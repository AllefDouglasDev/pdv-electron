/**
 * Session Monitor
 * Monitors session activity and handles session expiration
 */

const SessionMonitor = {
  // Check interval in milliseconds (every minute)
  CHECK_INTERVAL: 60000,

  // Activity events to track
  ACTIVITY_EVENTS: ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'],

  // Internal state
  _checkIntervalId: null,
  _activityThrottle: null,
  _lastActivityUpdate: 0,
  _warningShown: false,

  /**
   * Initialize session monitoring
   */
  async init() {
    // Check if logged in first
    const isLoggedIn = await window.api.auth.isLoggedIn();
    if (!isLoggedIn) {
      this.redirectToLogin();
      return false;
    }

    // Start periodic session checks
    this._startPeriodicCheck();

    // Track user activity
    this._trackActivity();

    return true;
  },

  /**
   * Start periodic session check
   */
  _startPeriodicCheck() {
    // Clear any existing interval
    if (this._checkIntervalId) {
      clearInterval(this._checkIntervalId);
    }

    // Check session periodically
    this._checkIntervalId = setInterval(async () => {
      await this.checkSession();
    }, this.CHECK_INTERVAL);
  },

  /**
   * Track user activity to update session
   */
  _trackActivity() {
    const updateActivity = async () => {
      const now = Date.now();
      // Throttle updates to once per 30 seconds
      if (now - this._lastActivityUpdate > 30000) {
        this._lastActivityUpdate = now;
        try {
          await window.api.auth.updateActivity();
        } catch (error) {
          console.error('Error updating activity:', error);
        }
      }
    };

    // Add event listeners for activity tracking
    this.ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
  },

  /**
   * Check if session is still valid
   */
  async checkSession() {
    try {
      const session = await window.api.auth.getSession();

      if (!session) {
        this.handleSessionExpired();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  },

  /**
   * Handle session expiration
   */
  handleSessionExpired() {
    // Stop monitoring
    this.stop();

    // Show alert
    if (!this._warningShown) {
      this._warningShown = true;
      alert('Sua sessao expirou por inatividade. Faca login novamente.');
      this.redirectToLogin();
    }
  },

  /**
   * Redirect to login page
   */
  async redirectToLogin() {
    try {
      await window.api.navigate('login');
    } catch (error) {
      console.error('Error redirecting to login:', error);
      // Fallback: try to reload
      window.location.reload();
    }
  },

  /**
   * Stop monitoring
   */
  stop() {
    if (this._checkIntervalId) {
      clearInterval(this._checkIntervalId);
      this._checkIntervalId = null;
    }
  },

  /**
   * Verify session before performing critical actions
   * @returns {Promise<boolean>} True if session is valid
   */
  async verifyBeforeAction() {
    const isValid = await this.checkSession();
    if (!isValid) {
      this.handleSessionExpired();
      return false;
    }
    return true;
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionMonitor;
}
