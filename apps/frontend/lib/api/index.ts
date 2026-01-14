/**
 * API Module Exports
 *
 * Centralized exports for all API-related functionality.
 */

// Client utilities
export { API_URL, API_BASE, apiFetch, apiPost, apiPatch, apiPut, apiDelete } from './client';

// Config operations (simplified)
export { fetchSystemStatus, type DatabaseStats, type SystemStatus } from './config';

// Tasting operations
export {
  fetchAllThemesScores,
  submitTasting,
  fetchActiveTheme,
  fetchWhiskeysByTheme,
  fetchUserTastingsForTheme,
  type ThemeScoresResponse,
  type SubmitTastingRequest,
  type Whiskey,
  type ThemeResponse,
  type UserTastingsResponse,
} from './tastings';

// User operations
export { fetchUsers, type User, type UserListResponse } from './users';

// Theme operations
export {
  fetchThemes,
  createTheme,
  updateTheme,
  updateWhiskeys,
  type Theme,
  type ThemeListResponse,
  type CreateThemeRequest,
  type ThemeCreateResponse,
} from './themes';
