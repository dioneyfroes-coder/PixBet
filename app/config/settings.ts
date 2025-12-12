// Centralized frontend configuration for easy maintenance

export const CONTACT_API_PATH = '/api/contact';

export const CONTACT_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 60_000, // 1 minute
} as const;

export const DEFAULT_RATE_LIMITER_KEY = 'contact_form';

// Add other shared frontend settings here as needed
