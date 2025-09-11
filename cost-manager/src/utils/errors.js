/**
 * Centralized error types for domain-specific failures.
 * Use these to attach a short code and optional details for better UX/logging.
 */
export class AppError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export class CurrencyError extends AppError {
  constructor(code, message, details) {
    super(code, message, details);
    this.name = 'CurrencyError';
  }
}

export class SettingsError extends AppError {
  constructor(code, message, details) {
    super(code, message, details);
    this.name = 'SettingsError';
  }
}


