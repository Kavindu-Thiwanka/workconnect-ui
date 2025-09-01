import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FormErrorService } from '../../services/form-error.service';

@Component({
  selector: 'app-form-error',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div 
      *ngIf="hasError()" 
      class="form-error"
      [@slideIn]
    >
      <mat-icon class="error-icon">error</mat-icon>
      <span class="error-message">{{ getErrorMessage() }}</span>
    </div>
  `,
  styleUrls: ['./form-error.component.scss'],
  animations: [
    // Import trigger from @angular/animations
  ]
})
export class FormErrorComponent {
  @Input() control!: AbstractControl;
  @Input() fieldName?: string;

  constructor(private formErrorService: FormErrorService) {}

  hasError(): boolean {
    return this.formErrorService.hasError(this.control);
  }

  getErrorMessage(): string | null {
    return this.formErrorService.getErrorMessage(this.control, this.fieldName);
  }
}
