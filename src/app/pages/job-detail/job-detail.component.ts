import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { JobService } from '../../services/job.service';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.scss']
})
export class JobDetailComponent implements OnInit {
  job: any = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private jobService: JobService
  ) { }

  ngOnInit(): void {
    // Get the 'id' from the URL parameters
    const jobId = this.route.snapshot.paramMap.get('id');

    if (jobId) {
      this.jobService.getJobById(jobId).subscribe({
        next: (data) => {
          this.job = data;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to fetch job details', err);
          this.error = 'Could not load job details. The job may no longer exist.';
          this.isLoading = false;
        }
      });
    } else {
      this.error = 'Job ID not found.';
      this.isLoading = false;
    }
  }
}
