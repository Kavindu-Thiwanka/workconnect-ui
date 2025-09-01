import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './components/notification/notification.component';
import { AuthService } from './services/auth.service';
import { TokenRefreshService } from './services/token-refresh.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationComponent],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'workconnect-ui';

  constructor(
    private authService: AuthService,
    private tokenRefreshService: TokenRefreshService
  ) {}

  ngOnInit(): void {
    // Start token refresh timer if user is logged in
    if (this.authService.isLoggedIn()) {
      this.tokenRefreshService.startTokenRefreshTimer();
    }
  }

  ngOnDestroy(): void {
    this.tokenRefreshService.stopTokenRefreshTimer();
  }
}
