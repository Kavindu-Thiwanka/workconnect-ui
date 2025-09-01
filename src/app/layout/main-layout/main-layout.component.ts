import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIcon, MatIcon, MatButton, MatIcon, MatIcon],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  constructor(private authService: AuthService, private router: Router) {}

  get userRole(): string | null {
    return this.authService.getRole();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
