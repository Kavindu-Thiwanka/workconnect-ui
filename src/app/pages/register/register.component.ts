import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormErrorService } from '../../services/form-error.service';
import { LoadingService } from '../../services/loading.service';
import { FormErrorComponent } from '../../components/form-error/form-error.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-register',
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
    MatRadioModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    FormErrorComponent
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private formErrorService: FormErrorService,
    public loadingService: LoadingService
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['WORKER', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.formErrorService.markAllFieldsAsTouched(this.registerForm);
      return;
    }

    const formData = { ...this.registerForm.value };
    delete formData.acceptTerms; // Remove acceptTerms from the data sent to backend

    this.authService.register(formData).pipe(
      catchError(error => {
        // Handle validation errors specifically for registration form
        if (error.error?.fieldErrors) {
          this.formErrorService.applyErrorsToForm(this.registerForm, error.error);
        }
        return of(null); // Return null to complete the observable
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          // Registration successful - success message handled by AuthService
          this.router.navigate(['/login'], {
            queryParams: { message: 'Registration successful! Please log in.' }
          });
        }
      }
    });
  }

  // Helper methods for form error handling
  hasError(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return control ? this.formErrorService.hasError(control) : false;
  }

  getErrorMessage(fieldName: string): string | null {
    const control = this.registerForm.get(fieldName);
    return control ? this.formErrorService.getErrorMessage(control, fieldName) : null;
  }
}
