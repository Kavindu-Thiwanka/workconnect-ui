import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// --- Add these imports ---
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule // <-- Import FormsModule here
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  model: any = {
    userRole: 'WORKER'
  };

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit(): void {
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
