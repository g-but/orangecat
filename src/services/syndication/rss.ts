/**
 * Minimal RSS 2.0 item parser for the syndication sweep. Pure and dependency
 * free: the feeds it reads are our own fleet's (allow-listed origins), so it
 * favors being small and predictable over handling every dialect. Anything it
 * cannot parse it simply omits — the sweep treats absence as "skip", never as
 * an error worth failing the cron over.
 */

export interface RssItem {
  title: string;
  link: string;
  guid: string;
  description?: string;
  /** ISO 8601, only present when the feed's pubDate parsed to a valid date. */
  publishedAt?: string;
}

/** Decode the five XML entities plus numeric references — all our feeds emit. */
function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Extract one tag's text content, unwrapping CDATA when present. */
function tagText(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!match) {
    return undefined;
  }
  const inner = match[1].trim();
  const cdata = inner.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return decodeEntities((cdata ? cdata[1] : inner).trim());
}

export function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const title = tagText(block, 'title');
    const link = tagText(block, 'link');
    if (!title || !link) {
      continue;
    }
    // guid falls back to the link — both are stable, and the bus only needs
    // a consistent idempotency key per item.
    const guid = tagText(block, 'guid') ?? link;
    const description = tagText(block, 'description');
    const pubDateRaw = tagText(block, 'pubDate');
    const pubDate = pubDateRaw ? new Date(pubDateRaw) : null;
    items.push({
      title,
      link,
      guid,
      ...(description ? { description } : {}),
      ...(pubDate && !Number.isNaN(pubDate.getTime())
        ? { publishedAt: pubDate.toISOString() }
        : {}),
    });
  }
  return items;
}
