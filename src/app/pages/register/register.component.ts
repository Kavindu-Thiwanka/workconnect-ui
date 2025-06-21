import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  selectedRole: 'WORKER' | 'EMPLOYER' | null = null;

  model: any = {};

  constructor(private authService: AuthService, private router: Router) { }

  selectRole(role: 'WORKER' | 'EMPLOYER'): void {
    this.selectedRole = role;
    this.model.userRole = role;
  }

  onSubmit(): void {
    if (!this.model.email || !this.model.password) {
      alert('Please fill out all required fields.');
      return;
    }

    this.authService.register(this.model).subscribe({
      next: (response) => {
        console.log('Registration successful', response);
        alert('Registration successful! Please check your email for a verification code.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Registration failed', err);
        alert(err.error?.message || 'Registration failed');
      }
    });
  }
}
