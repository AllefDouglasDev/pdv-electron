const authService = require('../services/auth');
const logger = require('../services/logger');

/**
 * Authentication middleware functions for IPC handlers
 * Provides consistent access control and logging
 */

/**
 * Check if user is authenticated and update activity
 * @returns {object|null} Session if authenticated, null otherwise
 */
function requireAuth() {
  if (!authService.isLoggedIn()) {
    return null;
  }
  authService.updateActivity();
  return authService.getSession();
}

/**
 * Check if user is admin
 * @param {string} resource - Resource being accessed (for logging)
 * @returns {object|null} Session if admin, null otherwise
 */
function requireAdmin(resource = 'unknown') {
  const session = requireAuth();
  if (!session) {
    return null;
  }

  if (!authService.isAdmin()) {
    logger.logAccessDenied(session, resource);
    return null;
  }

  return session;
}

/**
 * Check if user is manager or admin
 * @param {string} resource - Resource being accessed (for logging)
 * @returns {object|null} Session if manager/admin, null otherwise
 */
function requireManager(resource = 'unknown') {
  const session = requireAuth();
  if (!session) {
    return null;
  }

  if (!authService.isManager()) {
    logger.logAccessDenied(session, resource);
    return null;
  }

  return session;
}

/**
 * Wrapper for IPC handlers that require authentication
 * @param {function} handler - The handler function
 * @returns {function} Wrapped handler
 */
function withAuth(handler) {
  return async (...args) => {
    const session = requireAuth();
    if (!session) {
      return { success: false, error: 'Sessao expirada. Faca login novamente.' };
    }
    return handler(session, ...args);
  };
}

/**
 * Wrapper for IPC handlers that require admin role
 * @param {string} resource - Resource name for logging
 * @param {function} handler - The handler function
 * @returns {function} Wrapped handler
 */
function withAdmin(resource, handler) {
  return async (...args) => {
    const session = requireAdmin(resource);
    if (!session) {
      if (!authService.isLoggedIn()) {
        return { success: false, error: 'Sessao expirada. Faca login novamente.' };
      }
      return { success: false, error: 'Acesso negado' };
    }
    return handler(session, ...args);
  };
}

/**
 * Wrapper for IPC handlers that require manager role
 * @param {string} resource - Resource name for logging
 * @param {function} handler - The handler function
 * @returns {function} Wrapped handler
 */
function withManager(resource, handler) {
  return async (...args) => {
    const session = requireManager(resource);
    if (!session) {
      if (!authService.isLoggedIn()) {
        return { success: false, error: 'Sessao expirada. Faca login novamente.' };
      }
      return { success: false, error: 'Acesso negado' };
    }
    return handler(session, ...args);
  };
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireManager,
  withAuth,
  withAdmin,
  withManager
};
