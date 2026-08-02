/**
 * Local model ids travel as `local:<runtime>:<model>` through the selector,
 * the chat hook, and persistence. Ollama model names contain colons
 * themselves ("llama3.2:3b") — the parse must split only on the FIRST
 * separator after the runtime.
 */
import { LOCAL_MODEL_PREFIX, makeLocalModelId, parseLocalModelId } from '@/config/local-ai';

describe('local model ids', () => {
  it('round-trips a model name that itself contains colons', () => {
    const id = makeLocalModelId('ollama', 'llama3.2:3b');
    expect(id).toBe(`${LOCAL_MODEL_PREFIX}ollama:llama3.2:3b`);
    expect(parseLocalModelId(id)).toEqual({ runtimeId: 'ollama', model: 'llama3.2:3b' });
  });

  it('returns null for non-local and malformed ids', () => {
    expect(parseLocalModelId('nvidia/nemotron-3-super-120b-a12b:free')).toBeNull();
    expect(parseLocalModelId('local:')).toBeNull();
    expect(parseLocalModelId('local:ollama')).toBeNull();
    expect(parseLocalModelId('local:ollama:')).toBeNull();
  });
});
