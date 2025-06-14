import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { JobService } from '../../services/job.service';

@Component({
  selector: 'app-job-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './job-post.component.html',
  styleUrls: ['./job-post.component.scss']
})
export class JobPostComponent {
  jobForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private router: Router
  ) {
    this.jobForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      location: ['', Validators.required],
      salary: [''],
      requiredSkills: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.jobForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.jobForm.markAllAsTouched();
      return;
    }

    this.jobService.createJob(this.jobForm.value).subscribe({
      next: (response) => {
        alert('Job posted successfully!');
        // Navigate to the job list page (which we will build next)
        this.router.navigate(['/jobs']);
      },
      error: (err) => {
        console.error('Job posting failed', err);
        // Display a more specific error if the backend provides one
        alert(err.error?.message || 'Failed to post job. Are you registered as an Employer?');
      }
    });
  }
}
