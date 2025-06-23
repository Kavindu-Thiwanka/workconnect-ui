import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface LoginModel {
  email: string;
  password: string;
  remember: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  model: LoginModel = {
    email: '',
    password: '',
    remember: false
  };

  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() { }

  async onSubmit(): Promise<void> {
    try {
      this.loading = true;
      this.error = '';

      // Pass an object to the signIn method
      const { isSignedIn, nextStep } = await this.authService.signIn({
        username: this.model.email,
        password: this.model.password
      });

      console.log('Is user signed in?', isSignedIn);

      if (isSignedIn) {
        // On success, redirect to the home page or a dashboard
        this.router.navigate(['/']);
      } else {
        // Handle other steps if necessary (e.g., MFA)
        console.log('Next step in auth flow:', nextStep);
      }
    } catch (err: any) {
      console.error('Login failed', err);
      if (err.name === 'UserNotConfirmedException') {
        alert('You must confirm your email before you can log in.');
        // Optionally, redirect to a confirmation page
        // this.router.navigate(['/confirm-email']);
      } else {
        alert(err.message || 'Login failed');
      }
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
