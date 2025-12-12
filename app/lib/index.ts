// Canonical barrel for `app/lib`.
// Expose shared utilities, tokens and schema helpers without tying the app to a specific API implementation.
export * from './token';
export * from './auth';
export * from './error';
export * from './cn';
export * from './schemas/generated-schemas';
export * from './sdk/types';
export * from './sdk/errors';
export { default as BackendHealthNotifier, checkBackend } from './backend-check';

// Usage: `import { WalletResponse, ApiError } from 'app/lib'`.
