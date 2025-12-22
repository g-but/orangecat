export function isTableNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const code = (error as any)?.code;
  return code === '42P01';
}
