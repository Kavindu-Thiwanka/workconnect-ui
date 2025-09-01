import { Injectable } from '@angular/core';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';
import { ErrorResponse } from '../models/error-response.model';

@Injectable({
  providedIn: 'root'
})
export class FormErrorService {

  /**
   * Apply backend validation errors to form controls
   */
  applyErrorsToForm(form: FormGroup, errorResponse: ErrorResponse): void {
    // Clear existing server errors
    this.clearServerErrors(form);

    // Apply field-specific errors
    if (errorResponse.fieldErrors) {
      Object.entries(errorResponse.fieldErrors).forEach(([fieldName, errorMessage]) => {
        const control = this.findControl(form, fieldName);
        if (control) {
          this.setServerError(control, errorMessage);
        }
      });
    }

    // Apply general validation errors
    if (errorResponse.validationErrors && errorResponse.validationErrors.length > 0) {
      // If no field-specific errors, try to map general errors to fields
      this.mapGeneralErrorsToFields(form, errorResponse.validationErrors);
    }
  }

  /**
   * Clear all server errors from form
   */
  clearServerErrors(form: FormGroup): void {
    this.clearServerErrorsRecursive(form);
  }

  /**
   * Get error message for a form control
   */
  getErrorMessage(control: AbstractControl, fieldName?: string): string | null {
    if (!control.errors) return null;

    // Server error takes precedence
    if (control.errors['serverError']) {
      return control.errors['serverError'];
    }

    // Client-side validation errors
    const errors = control.errors;
    const fieldDisplayName = fieldName ? this.getFieldDisplayName(fieldName) : 'This field';

    if (errors['required']) {
      return `${fieldDisplayName} is required`;
    }

    if (errors['email']) {
      return 'Please enter a valid email address';
    }

    if (errors['minlength']) {
      const requiredLength = errors['minlength'].requiredLength;
      return `${fieldDisplayName} must be at least ${requiredLength} characters long`;
    }

    if (errors['maxlength']) {
      const requiredLength = errors['maxlength'].requiredLength;
      return `${fieldDisplayName} cannot exceed ${requiredLength} characters`;
    }

    if (errors['min']) {
      const min = errors['min'].min;
      return `${fieldDisplayName} must be at least ${min}`;
    }

    if (errors['max']) {
      const max = errors['max'].max;
      return `${fieldDisplayName} cannot exceed ${max}`;
    }

    if (errors['pattern']) {
      return this.getPatternErrorMessage(fieldName);
    }

    if (errors['passwordMismatch']) {
      return 'Passwords do not match';
    }

    if (errors['phoneNumber']) {
      return 'Please enter a valid phone number';
    }

    if (errors['url']) {
      return 'Please enter a valid URL';
    }

    // Generic error message
    return `${fieldDisplayName} is invalid`;
  }

  /**
   * Check if form control has errors
   */
  hasError(control: AbstractControl): boolean {
    return !!(control.errors && (control.dirty || control.touched));
  }

  /**
   * Get all error messages for a form
   */
  getAllErrorMessages(form: FormGroup): string[] {
    const errors: string[] = [];
    this.collectErrorsRecursive(form, errors);
    return errors;
  }

  /**
   * Mark all fields as touched to show validation errors
   */
  markAllFieldsAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control instanceof FormGroup) {
        this.markAllFieldsAsTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  /**
   * Find control by field name (supports nested fields)
   */
  private findControl(form: FormGroup, fieldName: string): AbstractControl | null {
    // Handle nested field names (e.g., 'address.street')
    const fieldPath = fieldName.split('.');
    let control: AbstractControl | null = form;

    for (const path of fieldPath) {
      if (control instanceof FormGroup) {
        control = control.get(path);
      } else {
        return null;
      }
    }

    return control;
  }

  /**
   * Set server error on control
   */
  private setServerError(control: AbstractControl, errorMessage: string): void {
    const currentErrors = control.errors || {};
    control.setErrors({
      ...currentErrors,
      serverError: errorMessage
    });
  }

  /**
   * Clear server errors recursively
   */
  private clearServerErrorsRecursive(control: AbstractControl): void {
    if (control instanceof FormGroup) {
      Object.values(control.controls).forEach(childControl => {
        this.clearServerErrorsRecursive(childControl);
      });
    } else {
      if (control.errors?.['serverError']) {
        const { serverError, ...otherErrors } = control.errors;
        const hasOtherErrors = Object.keys(otherErrors).length > 0;
        control.setErrors(hasOtherErrors ? otherErrors : null);
      }
    }
  }

  /**
   * Map general validation errors to form fields
   */
  private mapGeneralErrorsToFields(form: FormGroup, validationErrors: string[]): void {
    validationErrors.forEach(error => {
      // Try to extract field name from error message
      const fieldName = this.extractFieldNameFromError(error);
      if (fieldName) {
        const control = this.findControl(form, fieldName);
        if (control) {
          this.setServerError(control, error);
        }
      }
    });
  }

  /**
   * Extract field name from error message
   */
  private extractFieldNameFromError(error: string): string | null {
    // Common patterns to extract field names from error messages
    const patterns = [
      /Field '(\w+)'/,
      /(\w+) is required/,
      /(\w+) must be/,
      /(\w+) cannot be/,
      /Invalid (\w+)/
    ];

    for (const pattern of patterns) {
      const match = error.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }

    return null;
  }

  /**
   * Get display name for field
   */
  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'email': 'Email',
      'password': 'Password',
      'confirmPassword': 'Confirm Password',
      'firstName': 'First Name',
      'lastName': 'Last Name',
      'phoneNumber': 'Phone Number',
      'companyName': 'Company Name',
      'jobTitle': 'Job Title',
      'description': 'Description',
      'location': 'Location',
      'salary': 'Salary',
      'experience': 'Experience',
      'skills': 'Skills'
    };

    return displayNames[fieldName] || this.capitalizeFirstLetter(fieldName);
  }

  /**
   * Get pattern-specific error message
   */
  private getPatternErrorMessage(fieldName?: string): string {
    const patternMessages: { [key: string]: string } = {
      'email': 'Please enter a valid email address',
      'phoneNumber': 'Please enter a valid phone number',
      'password': 'Password must contain at least 8 characters with uppercase, lowercase, and numbers'
    };

    return patternMessages[fieldName || ''] || 'Please enter a valid format';
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Collect all error messages recursively
   */
  private collectErrorsRecursive(control: AbstractControl, errors: string[], fieldName?: string): void {
    if (control instanceof FormGroup) {
      Object.entries(control.controls).forEach(([key, childControl]) => {
        const childFieldName = fieldName ? `${fieldName}.${key}` : key;
        this.collectErrorsRecursive(childControl, errors, childFieldName);
      });
    } else {
      if (this.hasError(control) && fieldName) {
        const errorMessage = this.getErrorMessage(control, fieldName);
        if (errorMessage) {
          errors.push(errorMessage);
        }
      }
    }
  }
}
