import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../../services/job.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    FormsModule
  ],
  templateUrl: './my-jobs.component.html',
  styleUrls: ['./my-jobs.component.scss']
})
export class MyJobsComponent implements OnInit {
  myJobs$!: Observable<any[]>;
  filteredJobs: any[] = [];
  statusFilter: string = '';
  viewMode: 'grid' | 'list' = 'list';

  constructor(private jobService: JobService) {}

  ngOnInit(): void {
    this.myJobs$ = this.jobService.getPostedJobs();
    this.myJobs$.subscribe(jobs => {
      this.filteredJobs = jobs;
    });
  }

  onFilterChange(): void {
    this.myJobs$.subscribe(jobs => {
      this.filteredJobs = this.statusFilter
        ? jobs.filter(job => (job.status || 'ACTIVE') === this.statusFilter)
        : jobs;
    });
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  getJobTypeDisplay(jobType: string): string {
    const typeMap: { [key: string]: string } = {
      'ONE_DAY': 'One Day',
      'CONTRACT': 'Contract',
      'PART_TIME': 'Part Time',
      'FULL_TIME': 'Full Time'
    };
    return typeMap[jobType] || jobType;
  }

  getDaysPosted(postedAt: string): number {
    const posted = new Date(postedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getActiveJobsCount(): number {
    return this.filteredJobs.filter(job => (job.status || 'ACTIVE') === 'ACTIVE').length;
  }

  getTotalApplicationsCount(): number {
    return this.filteredJobs.reduce((total, job) => total + (job.applicantCount || 0), 0);
  }

  getViewsCount(): number {
    return this.filteredJobs.reduce((total, job) => total + (job.viewCount || 0), 0);
  }

  duplicateJob(job: any): void {
    console.log('Duplicate job:', job.id);
    // Implement job duplication logic
  }

  toggleJobStatus(job: any): void {
    const newStatus = job.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    console.log('Toggle job status:', job.id, 'to', newStatus);
    // Implement status toggle logic
  }

  shareJob(job: any): void {
    if (navigator.share) {
      navigator.share({
        title: job.jobTitle,
        text: `Check out this job opportunity: ${job.jobTitle}`,
        url: window.location.origin + `/jobs/${job.id}`
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/jobs/${job.id}`);
      console.log('Job link copied to clipboard');
    }
  }

  deleteJob(jobId: number): void {
    if (confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      console.log('Delete job:', jobId);
      // Implement job deletion logic
    }
  }
}
