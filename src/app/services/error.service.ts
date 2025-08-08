import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ErrorResponse,
  ErrorCode,
  NotificationMessage,
  NotificationType,
  NotificationAction,
  NetworkStatus,
  ErrorContext
} from '../models/error-response.model';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private notificationsSubject = new BehaviorSubject<NotificationMessage[]>([]);
  private networkStatusSubject = new BehaviorSubject<NetworkStatus>({
    online: navigator.onLine,
    lastChecked: new Date(),
    retryCount: 0
  });

  public notifications$ = this.notificationsSubject.asObservable();
  public networkStatus$ = this.networkStatusSubject.asObservable();

  constructor() {
    this.initializeNetworkMonitoring();
  }

  /**
   * Handle error response from backend
   */
  handleError(error: any, context?: ErrorContext): void {

    if (this.isErrorResponse(error?.error)) {
      this.handleBackendError(error.error, context);
    } else if (error.status === 0) {
      this.handleNetworkError(context);
    } else if (error.status >= 500) {
      this.handleServerError(error, context);
    } else {
      this.handleGenericError(error, context);
    }
  }

  /**
   * Handle specific backend error response
   */
  private handleBackendError(errorResponse: ErrorResponse, context?: ErrorContext): void {
    const notification = this.createNotificationFromError(errorResponse);
    this.addNotification(notification);

    // Log error for debugging
    this.logError(errorResponse, context);
  }

  /**
   * Handle network connectivity errors
   */
  private handleNetworkError(context?: ErrorContext): void {
    const currentStatus = this.networkStatusSubject.value;
    this.networkStatusSubject.next({
      ...currentStatus,
      online: false,
      lastChecked: new Date(),
      retryCount: currentStatus.retryCount + 1
    });

    this.addNotification({
      type: NotificationType.ERROR,
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      duration: 0, // Don't auto-dismiss
      dismissible: true,
      actions: [
        {
          label: 'Retry',
          action: () => this.retryConnection(),
          primary: true
        }
      ]
    });
  }

  /**
   * Handle server errors (5xx)
   */
  private handleServerError(error: any, context?: ErrorContext): void {
    this.addNotification({
      type: NotificationType.ERROR,
      title: 'Server Error',
      message: 'The server is currently experiencing issues. Please try again later.',
      duration: 8000,
      dismissible: true,
      actions: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
          primary: true
        }
      ]
    });
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(error: any, context?: ErrorContext): void {
    this.addNotification({
      type: NotificationType.ERROR,
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again.',
      duration: 5000,
      dismissible: true
    });
  }

  /**
   * Create notification from backend error response
   */
  private createNotificationFromError(errorResponse: ErrorResponse): NotificationMessage {
    const baseNotification: NotificationMessage = {
      type: this.getNotificationTypeFromErrorCode(errorResponse.errorCode),
      title: this.getErrorTitle(errorResponse.errorCode),
      message: errorResponse.message,
      duration: 5000,
      dismissible: true
    };

    // Add specific handling for certain error types
    switch (errorResponse.errorCode) {
      case ErrorCode.VALIDATION_ERROR:
        return {
          ...baseNotification,
          duration: 0, // Keep validation errors visible
          message: this.formatValidationMessage(errorResponse)
        };

      case ErrorCode.TOKEN_EXPIRED:
        return {
          ...baseNotification,
          title: 'Session Expired',
          message: 'Your session has expired. Please log in again.',
          actions: [
            {
              label: 'Login',
              action: () => this.redirectToLogin(),
              primary: true
            }
          ]
        };

      case ErrorCode.ACCESS_DENIED:
        return {
          ...baseNotification,
          title: 'Access Denied',
          message: 'You don\'t have permission to perform this action.',
          type: NotificationType.WARNING
        };

      case ErrorCode.DUPLICATE_APPLICATION:
        return {
          ...baseNotification,
          title: 'Already Applied',
          message: 'You have already applied for this job.',
          type: NotificationType.INFO
        };

      default:
        return baseNotification;
    }
  }

  /**
   * Format validation error message
   */
  private formatValidationMessage(errorResponse: ErrorResponse): string {
    if (errorResponse.fieldErrors && Object.keys(errorResponse.fieldErrors).length > 0) {
      const fieldMessages = Object.entries(errorResponse.fieldErrors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');
      return `Validation failed: ${fieldMessages}`;
    }

    if (errorResponse.validationErrors && errorResponse.validationErrors.length > 0) {
      return `Validation failed: ${errorResponse.validationErrors.join(', ')}`;
    }

    return errorResponse.message;
  }

  /**
   * Get notification type based on error code
   */
  private getNotificationTypeFromErrorCode(errorCode: string): NotificationType {
    const warningCodes = [
      ErrorCode.ACCESS_DENIED,
      ErrorCode.DUPLICATE_APPLICATION,
      ErrorCode.APPLICATION_DEADLINE_PASSED
    ];

    const infoCodes = [
      ErrorCode.PROFILE_INCOMPLETE,
      ErrorCode.JOB_NOT_AVAILABLE
    ];

    if (warningCodes.includes(errorCode as ErrorCode)) {
      return NotificationType.WARNING;
    }

    if (infoCodes.includes(errorCode as ErrorCode)) {
      return NotificationType.INFO;
    }

    return NotificationType.ERROR;
  }

  /**
   * Get user-friendly error title
   */
  private getErrorTitle(errorCode: string): string {
    const titleMap: { [key: string]: string } = {
      [ErrorCode.VALIDATION_ERROR]: 'Validation Error',
      [ErrorCode.AUTHENTICATION_FAILED]: 'Authentication Failed',
      [ErrorCode.ACCESS_DENIED]: 'Access Denied',
      [ErrorCode.RESOURCE_NOT_FOUND]: 'Not Found',
      [ErrorCode.PAYMENT_ERROR]: 'Payment Error',
      [ErrorCode.INTERNAL_SERVER_ERROR]: 'Server Error'
    };

    return titleMap[errorCode] || 'Error';
  }

  /**
   * Add notification to the queue
   */
  addNotification(notification: NotificationMessage): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, notification.duration);
    }
  }

  /**
   * Remove notification from the queue
   */
  removeNotification(notification: NotificationMessage): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(n => n !== notification);
    this.notificationsSubject.next(updatedNotifications);
  }

  /**
   * Clear all notifications
   */
  clearNotifications(): void {
    this.notificationsSubject.next([]);
  }

  /**
   * Show success notification
   */
  showSuccess(title: string, message: string, duration: number = 3000): void {
    this.addNotification({
      type: NotificationType.SUCCESS,
      title,
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Show info notification
   */
  showInfo(title: string, message: string, duration: number = 5000): void {
    this.addNotification({
      type: NotificationType.INFO,
      title,
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Show warning notification
   */
  showWarning(title: string, message: string, duration: number = 6000): void {
    this.addNotification({
      type: NotificationType.WARNING,
      title,
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Check if response is a backend error response
   */
  private isErrorResponse(obj: any): obj is ErrorResponse {
    return obj &&
           typeof obj.status === 'number' &&
           typeof obj.errorCode === 'string' &&
           typeof obj.message === 'string';
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.networkStatusSubject.next({
        online: true,
        lastChecked: new Date(),
        retryCount: 0
      });
      this.showSuccess('Connection Restored', 'You are back online!');
    });

    window.addEventListener('offline', () => {
      this.networkStatusSubject.next({
        online: false,
        lastChecked: new Date(),
        retryCount: 0
      });
      this.addNotification({
        type: NotificationType.WARNING,
        title: 'Connection Lost',
        message: 'You are currently offline. Some features may not be available.',
        duration: 0,
        dismissible: true
      });
    });
  }

  /**
   * Retry connection
   */
  private retryConnection(): void {
    // Simple connectivity check
    fetch('/api/health', { method: 'HEAD' })
      .then(() => {
        this.networkStatusSubject.next({
          online: true,
          lastChecked: new Date(),
          retryCount: 0
        });
        this.showSuccess('Connection Restored', 'Connection has been restored!');
      })
      .catch(() => {
        const currentStatus = this.networkStatusSubject.value;
        this.networkStatusSubject.next({
          ...currentStatus,
          lastChecked: new Date(),
          retryCount: currentStatus.retryCount + 1
        });
        this.addNotification({
          type: NotificationType.ERROR,
          title: 'Still Offline',
          message: 'Unable to connect to the server. Please try again later.',
          duration: 3000,
          dismissible: true
        });
      });
  }

  /**
   * Redirect to login page
   */
  private redirectToLogin(): void {
    window.location.href = '/login';
  }

  /**
   * Log error for debugging
   */
  private logError(errorResponse: ErrorResponse, context?: ErrorContext): void {
    const logData = {
      error: errorResponse,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('WorkConnect Error:', logData);

    // In production, you might want to send this to a logging service
    // this.sendToLoggingService(logData);
  }
}
