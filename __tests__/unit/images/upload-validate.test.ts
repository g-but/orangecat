/**
 * validateImageFile — type gate for user image uploads. Size is deliberately
 * NOT rejected here: oversized photos are downscaled client-side by
 * uploadUserImage (shrinkToFit), so the only hard size failure is an
 * animated GIF over the bucket limit, which is upload-time behavior.
 */
import { validateImageFile } from '@/services/images/upload';

function fakeFile(type: string, sizeBytes: number): File {
  // A File whose reported size we control without allocating real bytes.
  const f = new File(['x'], 'photo', { type });
  Object.defineProperty(f, 'size', { value: sizeBytes });
  return f;
}

describe('validateImageFile', () => {
  it('accepts allowed image types regardless of size — oversize is resized, not rejected', () => {
    expect(validateImageFile(fakeFile('image/jpeg', 2 * 1024 * 1024))).toEqual({ valid: true });
    expect(validateImageFile(fakeFile('image/webp', 1024)).valid).toBe(true);
    expect(validateImageFile(fakeFile('image/png', 40 * 1024 * 1024)).valid).toBe(true);
  });

  it('rejects non-image types with the shared formats label', () => {
    const r = validateImageFile(fakeFile('application/pdf', 1024));
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/JPEG, PNG, WebP, or GIF/);
  });
});
