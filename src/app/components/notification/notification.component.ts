import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Subject, takeUntil } from 'rxjs';
import { ErrorService } from '../../services/error.service';
import { NotificationMessage, NotificationType } from '../../models/error-response.model';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule
  ],
  template: `
    <div class="notification-container" [@listAnimation]="notifications.length">
      <div 
        *ngFor="let notification of notifications; trackBy: trackByNotification"
        class="notification"
        [ngClass]="getNotificationClass(notification.type)"
        [@slideIn]
      >
        <div class="notification-content">
          <div class="notification-header">
            <mat-icon class="notification-icon">{{ getNotificationIcon(notification.type) }}</mat-icon>
            <h4 class="notification-title">{{ notification.title }}</h4>
            <button 
              *ngIf="notification.dismissible"
              mat-icon-button 
              class="close-button"
              (click)="dismissNotification(notification)"
              aria-label="Dismiss notification"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <p class="notification-message">{{ notification.message }}</p>
          <div *ngIf="notification.actions && notification.actions.length > 0" class="notification-actions">
            <button
              *ngFor="let action of notification.actions"
              mat-button
              [color]="action.primary ? 'primary' : 'accent'"
              (click)="executeAction(action, notification)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./notification.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-in', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ transform: 'translateX(100%)', opacity: 0 }),
          stagger(100, [
            animate('300ms ease-in', style({ transform: 'translateX(0)', opacity: 1 }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: NotificationMessage[] = [];
  private destroy$ = new Subject<void>();

  constructor(private errorService: ErrorService) {}

  ngOnInit(): void {
    this.errorService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  dismissNotification(notification: NotificationMessage): void {
    this.errorService.removeNotification(notification);
  }

  executeAction(action: any, notification: NotificationMessage): void {
    action.action();
    this.dismissNotification(notification);
  }

  getNotificationClass(type: NotificationType): string {
    return `notification-${type}`;
  }

  getNotificationIcon(type: NotificationType): string {
    const iconMap = {
      [NotificationType.SUCCESS]: 'check_circle',
      [NotificationType.ERROR]: 'error',
      [NotificationType.WARNING]: 'warning',
      [NotificationType.INFO]: 'info'
    };
    return iconMap[type] || 'info';
  }

  trackByNotification(index: number, notification: NotificationMessage): any {
    return notification.title + notification.message + notification.type;
  }
}
