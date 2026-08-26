#!/usr/bin/env node
/**
 * Shared source tokenizer for the repo scripts that scan TypeScript by hand.
 *
 * Extracted from check-schema-columns.mjs when check-currency-units.mjs needed
 * the same thing on its first run: that gate stripped only `//` comments, and
 * the very first file it read was the doc comment DESCRIBING the bug it looks
 * for, inside a block comment. One definition, so a third scanner cannot
 * reinvent the naive version a fourth time.
 */

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

export { blankNonCode };
