import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JobService } from '../../services/job.service';

@Component({
  selector: 'app-post-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-job.component.html',
  styleUrls: ['./post-job.component.scss']
})
export class PostJobComponent implements OnInit {
  jobForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private router: Router
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

  onSubmit(): void {
    if (this.jobForm.invalid) {
      return;
    }
    this.jobService.createJob(this.jobForm.value).subscribe({
      next: (response) => {
        console.log('Job posted successfully!', response);
        // Navigate to the job list page after posting
        this.router.navigate(['/jobs']);
      },
      error: (err) => {
        console.error('Failed to post job', err);
        // You can add an error message for the user here
      }
    });
  }
}
