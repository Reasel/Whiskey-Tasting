/**
 * API Module Exports
 *
 * Centralized exports for all API-related functionality.
 */

// Client utilities
export {
  API_URL,
  API_BASE,
  apiFetch,
  apiPost,
  apiPatch,
  apiPut,
  apiDelete,
  getUploadUrl,
} from './client';

// Config operations (simplified)
export {
  fetchSystemStatus,
  type DatabaseStats,
  type SystemStatus,
} from './config';
