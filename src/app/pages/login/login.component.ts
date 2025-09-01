import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormErrorService } from '../../services/form-error.service';
import { LoadingService } from '../../services/loading.service';
import { ErrorService } from '../../services/error.service';
import { FormErrorComponent } from '../../components/form-error/form-error.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    FormErrorComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private formErrorService: FormErrorService,
    private errorService: ErrorService,
    public loadingService: LoadingService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Check for success message from registration and handle return URLs
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.errorService.showSuccess('Registration Successful', params['message']);
      }
      if (params['reason'] === 'session-expired') {
        this.errorService.showWarning('Session Expired', 'Your session has expired. Please log in again.');
      }

      // Store return URL if provided
      if (params['returnUrl']) {
        this.authService.setReturnUrl(params['returnUrl']);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.formErrorService.markAllFieldsAsTouched(this.loginForm);
      return;
    }

    this.authService.login(this.loginForm.value).pipe(
      catchError(error => {
        // Handle validation errors specifically for login form
        if (error.error?.fieldErrors) {
          this.formErrorService.applyErrorsToForm(this.loginForm, error.error);
        }
        return of(null); // Return null to complete the observable
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          // Login successful - navigation and success message handled by AuthService
          // AuthService.redirectAfterLogin() handles role-based redirection automatically
        }
      }
    });
  }

  // Helper methods for form error handling
  hasError(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return control ? this.formErrorService.hasError(control) : false;
  }

  getErrorMessage(fieldName: string): string | null {
    const control = this.loginForm.get(fieldName);
    return control ? this.formErrorService.getErrorMessage(control, fieldName) : null;
  }

  // Check if login is in progress
  isLoginLoading(): boolean {
    return this.loadingService.isLoading('login') as any; // Type assertion for now
  }
}
