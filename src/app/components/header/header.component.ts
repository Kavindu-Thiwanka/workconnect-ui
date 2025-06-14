import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { type AuthUser } from '@aws-amplify/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  currentUser: AuthUser | null = null;

  constructor(public authService: AuthService, private router: Router) {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  async onLogout() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}
