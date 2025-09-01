import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JobService } from '../../services/job.service';
import { LoadingService } from '../../services/loading.service';
import { ErrorService } from '../../services/error.service';

@Component({
  selector: 'app-edit-job',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './edit-job.component.html',
  styleUrls: ['./edit-job.component.scss']
})
export class EditJobComponent implements OnInit {
  jobForm: FormGroup;
  jobId!: string;
  isLoading = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private errorService: ErrorService
  ) {
    this.jobForm = this.fb.group({
      jobTitle: ['', Validators.required],
      description: ['', Validators.required],
      requiredSkills: [''],
      location: ['', Validators.required],
      salary: [null, [Validators.required, Validators.min(0)]],
      jobType: ['ONE_DAY', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.jobId = this.route.snapshot.paramMap.get('jobId')!;
    if (this.jobId) {
      this.loadJobData();
    }

    this.jobForm.get('jobType')?.valueChanges.subscribe(type => {
      const endDateControl = this.jobForm.get('endDate');
      if (type === 'CONTRACT') {
        endDateControl?.setValidators([Validators.required]);
      } else {
        endDateControl?.clearValidators();
        endDateControl?.setValue(null);
      }
      endDateControl?.updateValueAndValidity();
    });
  }

  private loadJobData(): void {
    this.isLoading = true;
    this.jobService.getJobById(this.jobId).subscribe({
      next: (job) => {
        this.populateForm(job);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorService.showError('Failed to load job data', error.message);
        this.isLoading = false;
        this.router.navigate(['/app/employer/jobs']);
      }
    });
  }

  private populateForm(job: any): void {
    this.jobForm.patchValue({
      jobTitle: job.jobTitle,
      description: job.description,
      requiredSkills: job.requiredSkills,
      location: job.location,
      salary: job.salary,
      jobType: job.jobType,
      startDate: job.startDate || job.jobDate,
      endDate: job.endDate
    });
  }

  onSubmit(): void {
    if (this.jobForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.jobForm.value;

    this.jobService.updateJob(this.jobId, formData).subscribe({
      next: (response) => {
        this.errorService.showSuccess('Success', 'Job updated successfully!');
        this.router.navigate(['/app/employer/jobs']);
      },
      error: (error) => {
        this.errorService.showError('Failed to update job', error.message);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/app/employer/jobs']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.jobForm.controls).forEach(key => {
      const control = this.jobForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.jobForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (control?.hasError('min')) {
      return `${this.getFieldDisplayName(fieldName)} must be greater than 0`;
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      jobTitle: 'Job title',
      description: 'Job description',
      location: 'Location',
      salary: 'Salary',
      startDate: 'Start date',
      endDate: 'End date'
    };
    return displayNames[fieldName] || fieldName;
  }
}
