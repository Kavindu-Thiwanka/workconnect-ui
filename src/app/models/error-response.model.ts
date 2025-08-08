/**
 * Error response model matching the backend ErrorResponseDto
 */
export interface ErrorResponse {
  status: number;
  errorCode: string;
  message: string;
  details?: string;
  path: string;
  timestamp: string;
  fieldErrors?: { [key: string]: string };
  validationErrors?: string[];
  traceId?: string;
}

/**
 * Error codes from the backend
 */
export enum ErrorCode {
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  INVALID_PARAMETER_TYPE = 'INVALID_PARAMETER_TYPE',
  MALFORMED_REQUEST = 'MALFORMED_REQUEST',
  
  // Authentication & Authorization Errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  ACCESS_DENIED = 'ACCESS_DENIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  
  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  ENDPOINT_NOT_FOUND = 'ENDPOINT_NOT_FOUND',
  
  // Business Rule Errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  ILLEGAL_STATE = 'ILLEGAL_STATE',
  
  // Job Application Errors
  JOB_APPLICATION_ERROR = 'JOB_APPLICATION_ERROR',
  DUPLICATE_APPLICATION = 'DUPLICATE_APPLICATION',
  JOB_NOT_AVAILABLE = 'JOB_NOT_AVAILABLE',
  APPLICATION_DEADLINE_PASSED = 'APPLICATION_DEADLINE_PASSED',
  INVALID_APPLICATION_STATUS = 'INVALID_APPLICATION_STATUS',
  UNAUTHORIZED_APPLICATION_ACCESS = 'UNAUTHORIZED_APPLICATION_ACCESS',
  
  // User Profile Errors
  USER_PROFILE_ERROR = 'USER_PROFILE_ERROR',
  PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE',
  INVALID_PROFILE_DATA = 'INVALID_PROFILE_DATA',
  PROFILE_IMAGE_UPLOAD_FAILED = 'PROFILE_IMAGE_UPLOAD_FAILED',
  UNAUTHORIZED_PROFILE_ACCESS = 'UNAUTHORIZED_PROFILE_ACCESS',
  
  // Payment Errors
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  PAYMENT_PROCESSING_FAILED = 'PAYMENT_PROCESSING_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PAYMENT_METHOD_NOT_FOUND = 'PAYMENT_METHOD_NOT_FOUND',
  INVALID_PAYMENT_AMOUNT = 'INVALID_PAYMENT_AMOUNT',
  PAYMENT_ALREADY_PROCESSED = 'PAYMENT_ALREADY_PROCESSED',
  
  // Database Errors
  DATA_INTEGRITY_VIOLATION = 'DATA_INTEGRITY_VIOLATION',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  NOT_NULL_VIOLATION = 'NOT_NULL_VIOLATION',
  
  // HTTP Errors
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

/**
 * Notification types for user feedback
 */
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Notification message interface
 */
export interface NotificationMessage {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  actions?: NotificationAction[];
}

/**
 * Notification action interface
 */
export interface NotificationAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

/**
 * Network status interface
 */
export interface NetworkStatus {
  online: boolean;
  lastChecked: Date;
  retryCount: number;
}

/**
 * Error context for debugging
 */
export interface ErrorContext {
  url: string;
  method: string;
  timestamp: Date;
  userAgent: string;
  userId?: string;
  sessionId?: string;
}
