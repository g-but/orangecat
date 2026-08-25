#!/usr/bin/env node
/**
 * Every field an entity schema collects must EXIST as a column.
 *
 * check-dead-fields.mjs asks "is this field rendered anywhere?". This asks the
 * question underneath it: "can this field be stored at all?". A field with no
 * column is worse than one that displays nowhere — `buildUpdatePayload` omits
 * null/undefined, so nothing breaks until a user ACTUALLY FILLS IT IN, and then
 * PostgREST rejects the entire payload and the whole save fails. The people who
 * use the feature are the only ones who ever see it break.
 *
 * That is not hypothetical: on 2026-08-25 `projects.start_date` and
 * `projects.target_completion` had a form field, a Zod rule, an API mapping and
 * guidance copy, and had never been columns — not in the baseline, not in any
 * migration. Filling either one failed the project save.
 *
 * WHY IT PARSES MIGRATIONS RATHER THAN QUERYING THE DATABASE
 * CI has no database credentials, and a gate that needs the network is a gate
 * that goes red when the network hiccups — which is how gates get disabled.
 * supabase/migrations/ is the committed SSOT for schema, is offline, and is
 * deterministic. The cost is that the parser must be right; see below.
 *
 * WHY YOU CAN TRUST THE PARSER
 * `--verify` compares every reconstructed table against the LIVE database and
 * reports any difference. That was run against production before this gate
 * landed and matched exactly for all mapped tables. Re-run it after touching the
 * parser: `node scripts/check-schema-columns.mjs --verify` (needs .env.local).
 * A parser that silently misses an ALTER produces FALSE failures, and a gate
 * that cries wolf gets deleted — so proving it is not optional.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const MIGRATIONS = join(ROOT, 'supabase/migrations');
const VALIDATION = join(ROOT, 'src/lib/validation');

/**
 * Schema export -> table. Explicit on purpose: one validation FILE can hold
 * several schemas for several tables (wishlist.ts has four), and mapping by
 * filename silently compares item fields against the wishlist table. Anything
 * not listed here is skipped, and the count of skipped schemas is printed —
 * a gate must never quietly narrow its own scope.
 */
const SCHEMA_TABLES = {
  projectSchema: 'projects',
  userProductSchema: 'user_products',
  userServiceSchema: 'user_services',
  userCauseSchema: 'user_causes',
  aiAssistantSchema: 'ai_assistants',
  assetSchema: 'assets',
  loanSchema: 'loans',
  investmentSchema: 'investments',
  eventSchema: 'events',
  wishlistSchema: 'wishlists',
  wishlistItemSchema: 'wishlist_items',
  circleSchema: 'circles',
  documentSchema: 'user_documents',
  profileSchema: 'profiles',
};

/**
 * Fields a schema legitimately accepts that are NOT columns of its own table.
 * Ratchet: this list may shrink, never grow without a reason on the line.
 */
const NOT_COLUMNS = new Set([
  // Write-side routing: names the row's parent/target, resolved before insert.
  'wishlist_id',
  'wishlist_item_id',
  // Accepted for convenience and mapped onto a differently-named column, or
  // consumed entirely by the API layer.
  'entity_type',
  'entity_id',
  // A child RELATION, not a column: collateral rows live in public.loan_collateral
  // and are written through /api/loan-collateral. loanSchema accepts the array so
  // the create form can submit loan + collateral together; the API splits them.
  'collateral',
]);

// ---------------------------------------------------------------- SQL parsing

/** Strip -- line comments and slash-star blocks so they cannot fake a match. */
function stripComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '');
}

const RESERVED_ROW = /^(constraint|primary|foreign|unique|check|exclude|like|partition)\b/i;

/** Column names from a CREATE TABLE body, ignoring table-level constraints. */
function columnsFromBody(body) {
  const cols = [];
  let depth = 0;
  let current = '';
  for (const ch of body) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      cols.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  cols.push(current);
  return cols
    .map(c => c.trim())
    .filter(c => c && !RESERVED_ROW.test(c))
    .map(c => c.match(/^"?([a-zA-Z_][a-zA-Z0-9_]*)"?/)?.[1])
    .filter(Boolean);
}

/** Reconstruct table -> Set(columns) by replaying migrations in filename order. */
export function buildSchema() {
  const tables = new Map();
  const files = readdirSync(MIGRATIONS)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = stripComments(readFileSync(join(MIGRATIONS, file), 'utf8'));

    // CREATE TABLE [IF NOT EXISTS] [public.]name ( ... );
    const createRe =
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*\(/gi;
    let m;
    while ((m = createRe.exec(sql)) !== null) {
      const name = m[1];
      // Walk to the matching close paren so nested types/constraints survive.
      let i = createRe.lastIndex;
      let depth = 1;
      const start = i;
      while (i < sql.length && depth > 0) {
        if (sql[i] === '(') depth++;
        else if (sql[i] === ')') depth--;
        i++;
      }
      const body = sql.slice(start, i - 1);
      const existing = tables.get(name) ?? new Set();
      for (const c of columnsFromBody(body)) existing.add(c);
      tables.set(name, existing);
    }

    // ALTER TABLE [public.]name ADD/DROP/RENAME COLUMN ...
    const alterRe =
      /alter\s+table\s+(?:only\s+)?(?:if\s+exists\s+)?(?:public\.)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?([\s\S]*?);/gi;
    while ((m = alterRe.exec(sql)) !== null) {
      const name = m[1];
      const rest = m[2];
      const set = tables.get(name) ?? new Set();
      for (const a of rest.matchAll(
        /add\s+column\s+(?:if\s+not\s+exists\s+)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?/gi
      )) {
        set.add(a[1]);
      }
      for (const d of rest.matchAll(
        /drop\s+column\s+(?:if\s+exists\s+)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?/gi
      )) {
        set.delete(d[1]);
      }
      for (const r of rest.matchAll(
        /rename\s+column\s+"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s+to\s+"?([a-zA-Z_][a-zA-Z0-9_]*)"?/gi
      )) {
        set.delete(r[1]);
        set.add(r[2]);
      }
      if (set.size) tables.set(name, set);
    }
  }
  return tables;
}

// ------------------------------------------------------------ schema fields

// Same anchoring rule as check-dead-fields.mjs: a key opens a line or follows
// `{`/`,`, so it is a property and not a ternary branch. Anchoring on
// indentation instead misses every schema Prettier keeps on one line.
const FIELD_DECL = /(?:^|[{,])\s*([a-z][a-z0-9_]{2,})\s*:\s*[A-Za-z_$][\w$]*\s*[(.]/gm;

/**
 * Blank out comments and string/template/regex contents, preserving length so
 * every offset and bracket-depth outside them stays exact.
 *
 * This has to be one left-to-right pass, not a sequence of regex replaces,
 * because the two constructs hide inside each other and order cannot fix that:
 *
 *   - Stripping comments first eats real code. A validation message reading
 *     `'…URL (e.g., https://example.com)'` contains `//`, so a `//`-to-newline
 *     rule blanked the rest of that line INCLUDING the closing `)` and `}`.
 *     Depth never recovered, extraction stopped at that field, and projectSchema
 *     silently reported 9 fields instead of 15 — the gate went green on an
 *     injected phantom column. Caught by mutation testing, not by reading it.
 *   - Stripping strings first mis-parses an apostrophe in a comment.
 *
 * Regex literals are only recognised where a regex can legally begin (after
 * `(,=:[!&|?{};` or a newline), so a division sign is never mistaken for one.
 */
function blankNonCode(src) {
  const out = src.split('');
  const blank = (from, to) => {
    for (let k = from; k < to && k < out.length; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  let i = 0;
  let prevSignificant = '';
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (ch === '/' && next === '/') {
      const end = src.indexOf('\n', i);
      blank(i, end === -1 ? src.length : end);
      i = end === -1 ? src.length : end;
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      blank(i, end === -1 ? src.length : end + 2);
      i = end === -1 ? src.length : end + 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === ch) break;
        j++;
      }
      blank(i + 1, j);
      i = j + 1;
      prevSignificant = ch;
      continue;
    }
    if (ch === '/' && '(,=:[!&|?{};\n'.includes(prevSignificant)) {
      let j = i + 1;
      let inClass = false;
      while (j < src.length) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === '[') inClass = true;
        else if (src[j] === ']') inClass = false;
        else if (src[j] === '/' && !inClass) break;
        else if (src[j] === '\n') break;
        j++;
      }
      if (src[j] === '/') {
        blank(i + 1, j);
        i = j + 1;
        prevSignificant = '/';
        continue;
      }
    }
    if (!/\s/.test(ch)) prevSignificant = ch;
    i++;
  }
  return out.join('');
}

/**
 * Fields declared at the TOP level of one exported schema.
 *
 * Depth matters, and getting it wrong is what makes this kind of gate useless.
 * `profileSchema` holds `social_links: z.object({ links: z.array(z.object({
 * platform, label, value })) })` — one JSONB column whose inner names are not
 * columns and never will be. A flat regex reports four phantom columns for it,
 * and a gate with four false alarms out of nine findings gets switched off. So
 * only depth-1 properties count; anything nested belongs to its parent column.
 */
function fieldsOfSchema(src, exportName) {
  const start = src.indexOf(`export const ${exportName} =`);
  if (start === -1) return null;
  // Take until the next top-level `export const`, so sibling schemas in the
  // same file cannot bleed their fields into this one.
  const nextExport = src.indexOf('\nexport const ', start + 1);
  let chunk = src.slice(start, nextExport === -1 ? undefined : nextExport);

  chunk = blankNonCode(chunk);

  const objStart = chunk.indexOf('{');
  if (objStart === -1) return new Set();

  const fields = new Set();
  let depth = 0;
  for (let i = objStart; i < chunk.length; i++) {
    const ch = chunk[i];
    if (ch === '{' || ch === '(' || ch === '[') {
      depth++;
      continue;
    }
    if (ch === '}' || ch === ')' || ch === ']') {
      depth--;
      continue;
    }
    // Depth 1 == a property of the schema's own object literal.
    if (depth !== 1) continue;
    // Match the NAME AND COLON ONLY, never the bracket that follows. An earlier
    // version consumed the trailing `(` and skipped past it, so that bracket was
    // never counted, depth drifted permanently, and everything after the second
    // field silently fell out of scope — the schema reported 2 fields instead of
    // 30 and the gate went quietly green. A parser that under-reports is worse
    // than one that over-reports: it gives false confidence instead of noise.
    const m = chunk.slice(i, i + 60).match(/^\s*([a-z][a-z0-9_]{2,})\s*:\s*(?=[A-Za-z_$])/);
    if (m) {
      fields.add(m[1]);
      i += m[0].length - 1;
    }
  }
  return fields;
}

function allSchemaFields() {
  const out = new Map();
  for (const file of readdirSync(VALIDATION).filter(f => f.endsWith('.ts'))) {
    const src = readFileSync(join(VALIDATION, file), 'utf8');
    for (const [exportName, table] of Object.entries(SCHEMA_TABLES)) {
      const fields = fieldsOfSchema(src, exportName);
      if (fields) out.set(exportName, { table, fields, file });
    }
  }
  return out;
}

// ------------------------------------------------------------------ commands

const tables = buildSchema();
const schemas = allSchemaFields();

if (process.argv.includes('--verify')) {
  // Prove the parser against the live database. Not part of `verify` — needs
  // credentials and the network. Run it after touching the parsing above.
  const env = {};
  for (const line of readFileSync(join(ROOT, '../../../.env.local'), 'utf8').split('\n')) {
    const mm = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (mm) env[mm[1]] = mm[2].replace(/^["']|["']$/g, '');
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  let mismatches = 0;
  for (const table of new Set([...schemas.values()].map(s => s.table))) {
    const parsed = tables.get(table);
    if (!parsed) {
      console.log(`${table}: NOT PARSED`);
      mismatches++;
      continue;
    }
    // Ask per column so this works on EMPTY tables — reading Object.keys of a
    // row reports every column as missing when there are no rows.
    const bad = [];
    for (const col of parsed) {
      const r = await fetch(`${url}/rest/v1/${table}?select=${col}&limit=0`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (!r.ok) bad.push(col);
    }
    if (bad.length) {
      console.log(`${table}: parser claims ${bad.length} column(s) the DB lacks -> ${bad.join(', ')}`);
      mismatches += bad.length;
    } else {
      console.log(`${table}: ${parsed.size} parsed columns all exist ✓`);
    }
  }
  if (mismatches) {
    console.log(
      `\n${mismatches} mismatch(es).\n\n` +
        `  Expected when a migration is merged but not yet DEPLOYED — the parser\n` +
        `  reads supabase/migrations, the database reflects what has been applied,\n` +
        `  and apply-migrations.sh only runs on deploy. Re-run after the deploy\n` +
        `  lands. Anything still mismatched after that is a genuine parser bug:\n` +
        `  a column the parser invented, or a table it failed to reconstruct.`
    );
  } else {
    console.log('\nparser matches the live database');
  }
  process.exit(mismatches ? 1 : 0);
}

const problems = [];
let checked = 0;
for (const [exportName, { table, fields, file }] of schemas) {
  const cols = tables.get(table);
  if (!cols) {
    problems.push({ exportName, table, field: '(table not found in migrations)', file });
    continue;
  }
  checked++;
  for (const f of fields) {
    if (!cols.has(f) && !NOT_COLUMNS.has(f)) problems.push({ exportName, table, field: f, file });
  }
}

const skipped = Object.keys(SCHEMA_TABLES).length - schemas.size;
console.log(
  `[check-schema-columns] schemas checked: ${checked}` +
    (skipped > 0 ? ` — ${skipped} mapped schema(s) not found in source` : '') +
    ` — fields with no column: ${problems.length}`
);

if (problems.length > 0) {
  console.error(
    `\n[check-schema-columns] FAIL: ${problems.length} field(s) are collected but cannot be stored:\n` +
      problems.map(p => `    ${p.table}.${p.field}  (${p.exportName} in ${p.file})`).join('\n') +
      `\n\n  A write that includes one of these fails the ENTIRE payload, so the bug\n` +
      `  only appears when a user actually fills the field in.\n\n` +
      `  Fix by adding a migration under supabase/migrations/ (it is applied on\n` +
      `  deploy by scripts/apply-migrations.sh), or — if the field is genuinely\n` +
      `  not a column of this table — add it to NOT_COLUMNS in this file WITH the\n` +
      `  reason. Do not delete the check to make this pass.`
  );
  process.exit(1);
}

console.log('[check-schema-columns] OK — every collected field has a column.');
