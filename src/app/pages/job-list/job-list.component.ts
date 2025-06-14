import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobService } from '../../services/job.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss']
})
export class JobListComponent implements OnInit {
  jobs: any[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private jobService: JobService) { }

  ngOnInit(): void {
    this.jobService.getAllJobs().subscribe({
      next: (data) => {
        this.jobs = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch jobs', err);
        this.error = 'Could not load jobs. Please try again later.';
        this.isLoading = false;
      }
    });
  }
}
