import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-auth-loading',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-loading-container">
      <div class="auth-loading-content">
        <mat-spinner diameter="40"></mat-spinner>
        <p class="loading-text">Verifying authentication...</p>
      </div>
    </div>
  `,
  styles: [`
    .auth-loading-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .auth-loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .loading-text {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }
  `]
})
export class AuthLoadingComponent {}
