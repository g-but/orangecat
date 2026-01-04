interface ErrorWithCode {
  code?: string;
}

export function isTableNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const errorWithCode = error as ErrorWithCode;
  return errorWithCode.code === '42P01';
}
