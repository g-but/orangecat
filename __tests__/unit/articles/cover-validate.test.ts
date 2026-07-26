/**
 * validateCoverFile — guards article cover uploads by type + size before they
 * ever hit storage.
 */
import { validateCoverFile } from '@/services/articles/cover-storage';

function fakeFile(type: string, sizeBytes: number): File {
  // A File whose reported size we control without allocating real bytes.
  const f = new File(['x'], 'cover', { type });
  Object.defineProperty(f, 'size', { value: sizeBytes });
  return f;
}

describe('validateCoverFile', () => {
  it('accepts a normal-sized image of an allowed type', () => {
    expect(validateCoverFile(fakeFile('image/jpeg', 2 * 1024 * 1024))).toEqual({ valid: true });
    expect(validateCoverFile(fakeFile('image/webp', 1024)).valid).toBe(true);
  });

  it('rejects non-image types', () => {
    const r = validateCoverFile(fakeFile('application/pdf', 1024));
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/JPEG|PNG|WebP/);
  });

  it('rejects images over the size cap', () => {
    const r = validateCoverFile(fakeFile('image/png', 9 * 1024 * 1024));
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/under \d+MB/);
  });
});
