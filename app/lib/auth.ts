import * as tokenModule from './token';

export type LogoutHandler = () => void | Promise<void>;

// Default logout handler: clear persisted tokens and redirect to `/login` in browsers.
// Default behavior split into two functions for better testability and to allow
// callers to clear auth state without forcing a redirect.
export function clearAuthState() {
  try {
    tokenModule.clearTokens();
  } catch {
    // ignore
  }
}

export function redirectToLogin() {
  try {
    if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
      window.location.replace('/login');
    }
  } catch {
    // ignore non-browser environments
  }
}

let handler: LogoutHandler = async () => {
  clearAuthState();
  redirectToLogin();
};

// Prevent repeated logout/redirect loops by tracking whether a logout is already in progress.
let isLoggingOut = false;

function isOnLoginPage() {
  try {
    return typeof window !== 'undefined' && window.location?.pathname === '/login';
  } catch {
    return false;
  }
}

export function setLogoutHandler(h: LogoutHandler | null) {
  if (h == null) {
    // reset to default
    handler = async () => {
      clearAuthState();
      redirectToLogin();
    };
  } else {
    handler = h;
  }
}

export async function handleLogout() {
  if (isLoggingOut) return;
  // If already on the login page, only clear tokens (avoid redirect loops).
  if (isOnLoginPage()) {
    clearAuthState();
    return;
  }

  isLoggingOut = true;
  try {
    await handler();
  } catch {
    // swallow errors to avoid breaking callers
  } finally {
    isLoggingOut = false;
  }
}

export default {
  setLogoutHandler,
  handleLogout,
};
