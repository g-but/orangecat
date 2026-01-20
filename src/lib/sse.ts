/**
 * Simple SSE reader for fetch() response bodies.
 * Splits by blank lines and parses `data: ...` lines as JSON.
 */
export async function readSSEStream(
  body: ReadableStream<Uint8Array> | null,
  onData: (message: unknown) => void
): Promise<void> {
  if (!body) return;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';
      for (const chunk of chunks) {
        const lines = chunk.split('\n');
        for (const raw of lines) {
          const line = raw.trim();
          if (line.startsWith('data: ')) {
            const payload = line.slice(6);
            try {
              const json = JSON.parse(payload);
              onData(json);
            } catch {
              // ignore malformed payloads
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Read event-like streams line-by-line.
 * Supports both SSE (data: {...}) and JSONL ({"foo": "bar"}\n) formats.
 */
export async function readEventStream(
  body: ReadableStream<Uint8Array> | null,
  onData: (message: unknown) => void
): Promise<void> {
  if (!body) return;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        if (line === '[DONE]') {
          onData('[DONE]');
          continue;
        }
        let payload = line;
        if (line.startsWith('data:')) {
          payload = line.replace(/^data:\s?/, '');
        }
        try {
          const json = JSON.parse(payload);
          onData(json);
        } catch {
          // ignore non-JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
