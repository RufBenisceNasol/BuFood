/*
 * tokenUtils
 * -------------------------------------------------------------
 * App flow role:
 *  - Centralized helpers to store/retrieve/remove auth tokens and user info
 *    from localStorage/sessionStorage, depending on "remember me".
 *  - Pages/components call the getters (e.g., `getUser()`) to personalize UI.
 *  - API calls (see `src/api/index.js`) read `getToken()` to attach auth headers.
 *  - `setToken`/`setUser` pick storage based on rememberMe to persist sessions.
 */
// Utility for managing tokens and user info in localStorage/sessionStorage for 'remember me' functionality

// Storage keys
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

// Set token (access/refresh/user) in the appropriate storage
export function setToken(token, rememberMe) {
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function setRefreshToken(refreshToken, rememberMe) {
  if (rememberMe) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } else {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function setUser(user, rememberMe) {
  const userStr = JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem(USER_KEY, userStr);
    sessionStorage.removeItem(USER_KEY);
  } else {
    sessionStorage.setItem(USER_KEY, userStr);
    localStorage.removeItem(USER_KEY);
  }
}

// Get token/user from either storage (prefer localStorage)
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getUser() {
  const userStr = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

// Remove token/user from both storages
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function removeRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function removeUser() {
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
} 