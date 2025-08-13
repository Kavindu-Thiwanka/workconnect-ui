import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { JobService } from '../../../services/job.service';
import {
  JobApplicationService,
  JobApplication,
  ApplicationStatus,
  ApplicationStatusUpdate
} from '../../../services/job-application.service';
import { LoadingService } from '../../../services/loading.service';
import { ErrorService } from '../../../services/error.service';
import { Observable, Subject, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, takeUntil, catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-job-applications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatChipsModule,
    MatTabsModule,
    MatDialogModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './job-applications.component.html',
  styleUrls: ['./job-applications.component.scss']
})
export class JobApplicationsComponent implements OnInit, OnDestroy {
  applications$!: Observable<JobApplication[]>;
  filteredApplications$!: Observable<JobApplication[]>;
  jobId!: number;
  job$!: Observable<any>;
  selectedFile: File | null = null;
  isLoading = false;

  private filterSubject = new BehaviorSubject<ApplicationStatus | 'ALL'>('ALL');
  private destroy$ = new Subject<void>();
  activeFilter: ApplicationStatus | 'ALL' = 'ALL';

  // Expose ApplicationStatus enum to template
  ApplicationStatus = ApplicationStatus;
  applicationStatusOptions = Object.values(ApplicationStatus);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService,
    private jobApplicationService: JobApplicationService,
    private loadingService: LoadingService,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('jobId');
    if (id) {
      this.jobId = parseInt(id, 10);
      this.loadApplications();
      this.loadJobDetails();
      this.setupFilteredApplications();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadApplications(): void {
    this.isLoading = true;
    this.applications$ = this.jobApplicationService.getJobApplications(this.jobId).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.isLoading = false;
        return of([]);
      })
    );

    // Subscribe to handle loading state
    this.applications$.subscribe(() => {
      this.isLoading = false;
    });
  }

  private loadJobDetails(): void {
    this.job$ = this.jobService.getJobById(this.jobId.toString()).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.errorService.showError('Failed to load job details', 'Unable to load job information.');
        return of(null);
      })
    );
  }

  private setupFilteredApplications(): void {
    this.filteredApplications$ = combineLatest([
      this.applications$,
      this.filterSubject.asObservable()
    ]).pipe(
      map(([applications, filter]) => {
        if (filter === 'ALL') {
          return applications;
        }
        return applications.filter(app => app.status === filter);
      }),
      takeUntil(this.destroy$)
    );
  }

  setFilter(filter: ApplicationStatus | 'ALL'): void {
    this.activeFilter = filter;
    this.filterSubject.next(filter);
  }

  refreshApplications(): void {
    this.loadApplications();
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      this.selectedFile = fileList[0];
    }
  }

  onImageUpload(): void {
    if (!this.selectedFile) { return; }
    this.jobService.uploadJobImage(this.jobId.toString(), this.selectedFile).subscribe({
      next: () => {
        this.errorService.showSuccess('Success', 'Image uploaded successfully!');
        this.loadJobDetails();
        this.selectedFile = null;
      },
      error: () => {
        this.errorService.showError('Upload Failed', 'Image upload failed. Please try again.');
      }
    });
  }

  onStatusChange(applicationId: number, newStatus: ApplicationStatus): void {
    const statusUpdate: ApplicationStatusUpdate = {
      status: newStatus
    };

    this.jobApplicationService.updateApplicationStatus(applicationId, statusUpdate).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.refreshApplications();
      }
    });
  }

  // Helper methods for template
  trackByApplicationId(index: number, application: JobApplication): number {
    return application.applicationId || application.id || index;
  }

  getStatusIcon(status: ApplicationStatus): string {
    return this.jobApplicationService.getStatusIcon(status);
  }

  getStatusColorClass(status: ApplicationStatus): string {
    return this.jobApplicationService.getStatusColorClass(status);
  }

  formatStatus(status: ApplicationStatus): string {
    return this.jobApplicationService.formatStatus(status);
  }

  getApplicantName(application: JobApplication): string {
    if (!application.worker) return 'Unknown Applicant';
    const firstName = application.worker.firstName || '';
    const lastName = application.worker.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Applicant';
  }

  getApplicantInitials(application: JobApplication): string {
    if (!application.worker) return 'NA';
    const firstName = application.worker.firstName || '';
    const lastName = application.worker.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'NA';
  }

  getTimeAgo(dateString: string | undefined): string {
    if (!dateString) return 'Unknown time';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    } catch (error) {
      return 'Unknown time';
    }
  }

  // Navigation methods
  onViewApplicantProfile(workerId: number | undefined): void {
    if (workerId) {
      this.router.navigate(['/app/profile', workerId]);
    }
  }

  onBackToJobs(): void {
    this.router.navigate(['/app/employer/jobs']);
  }

  onEditJob(): void {
    this.router.navigate(['/app/jobs', this.jobId, 'edit']);
  }

  // Statistics methods
  getApplicationStats(): Observable<any> {
    return this.applications$.pipe(
      map(applications => ({
        total: applications.length,
        pending: applications.filter(app => app.status === ApplicationStatus.PENDING).length,
        viewed: applications.filter(app => app.status === ApplicationStatus.VIEWED).length,
        accepted: applications.filter(app => app.status === ApplicationStatus.ACCEPTED).length,
        rejected: applications.filter(app => app.status === ApplicationStatus.REJECTED).length,
        completed: applications.filter(app => app.status === ApplicationStatus.COMPLETED).length
      }))
    );
  }

  getEmptyStateTitle(): string {
    switch (this.activeFilter) {
      case ApplicationStatus.PENDING: return 'No Pending Applications';
      case ApplicationStatus.VIEWED: return 'No Viewed Applications';
      case ApplicationStatus.ACCEPTED: return 'No Accepted Applications';
      case ApplicationStatus.REJECTED: return 'No Rejected Applications';
      case ApplicationStatus.COMPLETED: return 'No Completed Applications';
      default: return 'No Applications Yet';
    }
  }

  getEmptyStateMessage(): string {
    switch (this.activeFilter) {
      case ApplicationStatus.PENDING: return 'No pending applications for this job.';
      case ApplicationStatus.VIEWED: return 'No applications have been viewed yet.';
      case ApplicationStatus.ACCEPTED: return 'No applications have been accepted yet.';
      case ApplicationStatus.REJECTED: return 'No applications have been rejected.';
      case ApplicationStatus.COMPLETED: return 'No applications have been completed.';
      default: return 'This job hasn\'t received any applications yet. Share the job posting to attract candidates.';
    }
  }
}
