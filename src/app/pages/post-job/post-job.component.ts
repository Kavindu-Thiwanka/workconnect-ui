import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JobService } from '../../services/job.service';
import { ErrorService } from '../../services/error.service';

@Component({
  selector: 'app-post-job',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatSnackBarModule
  ],
  templateUrl: './post-job.component.html',
  styleUrls: ['./post-job.component.scss']
})
export class PostJobComponent implements OnInit {
  jobForm: FormGroup;
  isDuplicating = false;

  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private errorService: ErrorService
  ) {
    this.jobForm = this.fb.group({
      jobTitle: ['', Validators.required],
      description: ['', Validators.required],
      requiredSkills: [''],
      location: ['', Validators.required],
      salary: [null, Validators.required],
      jobType: ['ONE_DAY', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null] // Initially not required
    });
  }

  ngOnInit(): void {
    // Check if duplicating a job
    const duplicateJobId = this.route.snapshot.queryParamMap.get('duplicate');
    if (duplicateJobId) {
      this.isDuplicating = true;
      this.loadJobForDuplication(duplicateJobId);
    }

    // Listen for changes in the jobType radio button
    this.jobForm.get('jobType')?.valueChanges.subscribe(type => {
      const endDateControl = this.jobForm.get('endDate');
      if (type === 'CONTRACT') {
        endDateControl?.setValidators([Validators.required]);
      } else {
        endDateControl?.clearValidators();
      }
      endDateControl?.updateValueAndValidity();
    });
  }

  private loadJobForDuplication(jobId: string): void {
    this.jobService.getJobById(jobId).subscribe({
      next: (job) => {
        // Pre-populate form with existing job data (excluding dates)
        this.jobForm.patchValue({
          jobTitle: `${job.jobTitle} (Copy)`,
          description: job.description,
          requiredSkills: job.requiredSkills,
          location: job.location,
          salary: job.salary,
          jobType: job.jobType,
          startDate: null,
          endDate: null
        });
      },
      error: (error) => {
        this.errorService.showError('Failed to load job for duplication', error.message);
      }
    });
  }

  onSubmit(): void {
    if (this.jobForm.invalid) {
      return;
    }
    this.jobService.createJob(this.jobForm.value).subscribe({
      next: (response) => {
        const title = this.isDuplicating ? 'Job Duplicated' : 'Job Posted';
        const message = this.isDuplicating ? 'Job duplicated successfully!' : 'Job posted successfully!';
        this.errorService.showSuccess(title, message);
        // Navigate to the job list page after posting
        this.router.navigate(['/app/employer/jobs']);
      },
      error: (error) => {
        this.errorService.showError('Failed to post job', error.message);
      }
    });
  }
}
