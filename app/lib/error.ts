export type ErrorHandler = (err: unknown) => void | Promise<void>;

let handler: ErrorHandler | null = null;

export function setErrorHandler(h: ErrorHandler | null) {
  handler = h;
}

export async function handleError(err: unknown) {
  try {
    if (handler) {
      await handler(err);
      return;
    }
  } catch (e) {
    // If the custom handler failed, fallthrough to default logging below
    // but don't throw to avoid masking original error flow
    console.error('Error handler threw:', e);
  }

  // Default behavior: log error to console in non-production
  try {
    console.error(err);
  } catch {
    // swallow
  }
}

export default { setErrorHandler, handleError };
