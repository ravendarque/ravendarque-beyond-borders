/**
 * Structured logging utility for scripts
 * Provides consistent logging with levels and formatting
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const LOG_LEVEL_NAMES = {
  [LOG_LEVELS.DEBUG]: 'DEBUG',
  [LOG_LEVELS.INFO]: 'INFO',
  [LOG_LEVELS.WARN]: 'WARN',
  [LOG_LEVELS.ERROR]: 'ERROR',
};

class Logger {
  constructor(minLevel = LOG_LEVELS.INFO) {
    this.minLevel = minLevel;
  }

  /**
   * Log a message at the specified level
   * @param {number} level - Log level
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  _log(level, message, ...args) {
    if (level < this.minLevel) return;

    const levelName = LOG_LEVEL_NAMES[level] || 'LOG';
    const prefix = `[${levelName}]`;

    if (level >= LOG_LEVELS.ERROR) {
      console.error(prefix, message, ...args);
    } else if (level >= LOG_LEVELS.WARN) {
      console.warn(prefix, message, ...args);
    } else {
      console.log(prefix, message, ...args);
    }
  }

  /**
   * Log a debug message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  debug(message, ...args) {
    this._log(LOG_LEVELS.DEBUG, message, ...args);
  }

  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  info(message, ...args) {
    this._log(LOG_LEVELS.INFO, message, ...args);
  }

  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  warn(message, ...args) {
    this._log(LOG_LEVELS.WARN, message, ...args);
  }

  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  error(message, ...args) {
    this._log(LOG_LEVELS.ERROR, message, ...args);
  }

  /**
   * Log a success message (info level with checkmark)
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  success(message, ...args) {
    this._log(LOG_LEVELS.INFO, `✓ ${message}`, ...args);
  }
}

// Export a default logger instance
export const logger = new Logger(process.env.DEBUG ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO);

// Export the Logger class for custom instances
export { Logger };
