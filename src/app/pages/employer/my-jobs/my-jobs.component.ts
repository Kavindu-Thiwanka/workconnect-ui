import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../../services/job.service';
import { LoadingService } from '../../../services/loading.service';
import { ErrorService } from '../../../services/error.service';
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
    MatDialogModule,
    MatSnackBarModule,
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
  isUpdatingStatus: boolean = false;

  constructor(
    private jobService: JobService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  onFilterChange(): void {
    this.myJobs$.subscribe(jobs => {
      this.filteredJobs = this.statusFilter
        ? jobs.filter(job => (job.status || 'OPEN') === this.statusFilter)
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

  getStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'OPEN': 'Open',
      'CLOSED': 'Closed',
      'FILLED': 'Filled',
      'EXPIRED': 'Expired',
      'DRAFT': 'Draft'
    };
    return statusMap[status] || 'Open';
  }

  getDaysPosted(postedAt: string): number {
    const posted = new Date(postedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getActiveJobsCount(): number {
    return this.filteredJobs.filter(job => (job.status || 'OPEN') === 'OPEN').length;
  }

  getTotalApplicationsCount(): number {
    return this.filteredJobs.reduce((total, job) => total + (job.applicantCount || 0), 0);
  }

  getViewsCount(): number {
    return this.filteredJobs.reduce((total, job) => total + (job.viewCount || 0), 0);
  }

  onStatusChange(jobId: number, newStatus: string): void {
    this.isUpdatingStatus = true;
    this.jobService.updateJobStatus(jobId.toString(), newStatus).subscribe({
      next: () => {
        this.errorService.showSuccess('Success', 'Job status updated successfully');
        this.loadJobs(); // Refresh the job list
        this.isUpdatingStatus = false;
      },
      error: (error) => {
        this.errorService.showError('Failed to update job status', error.message);
        this.isUpdatingStatus = false;
      }
    });
  }

  editJob(job: any): void {
    this.router.navigate(['/app/jobs', job.id, 'edit']);
  }

  confirmDeleteJob(job: any): void {
    if (job.applicationCount > 0) {
      this.errorService.showWarning('Cannot Delete Job', 'Cannot delete job with existing applications');
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete "${job.jobTitle}"? This action cannot be undone.`);
    if (confirmed) {
      this.deleteJob(job.id);
    }
  }

  private deleteJob(jobId: number): void {
    this.jobService.deleteJob(jobId.toString()).subscribe({
      next: () => {
        this.errorService.showSuccess('Success', 'Job deleted successfully');
        this.loadJobs(); // Refresh the job list
      },
      error: (error) => {
        this.errorService.showError('Failed to delete job', error.message);
      }
    });
  }

  private loadJobs(): void {
    this.myJobs$ = this.jobService.getPostedJobs();
    this.myJobs$.subscribe(jobs => {
      this.filteredJobs = this.statusFilter
        ? jobs.filter(job => (job.status || 'OPEN') === this.statusFilter)
        : jobs;
    });
  }

  duplicateJob(job: any): void {
    // Navigate to create job with pre-filled data
    this.router.navigate(['/app/jobs/new'], {
      queryParams: { duplicate: job.id }
    });
  }

  shareJob(job: any): void {
    const jobUrl = `${window.location.origin}/app/jobs/${job.id}`;
    if (navigator.share) {
      navigator.share({
        title: job.jobTitle,
        text: `Check out this job opportunity: ${job.jobTitle}`,
        url: jobUrl
      });
    } else {
      navigator.clipboard.writeText(jobUrl).then(() => {
        this.errorService.showSuccess('Success', 'Job URL copied to clipboard');
      }).catch(() => {
        this.errorService.showError('Failed to copy URL');
      });
    }
  }
}
