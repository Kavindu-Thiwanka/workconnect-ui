import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { Observable, BehaviorSubject, combineLatest, Subject, of } from 'rxjs';
import { map, takeUntil, catchError } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  JobApplicationService,
  JobApplication,
  ApplicationStats,
  ApplicationStatus,
  ReviewSubmission
} from '../../../services/job-application.service';
import { LoadingService } from '../../../services/loading.service';
import { ErrorService } from '../../../services/error.service';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.scss']
})
export class MyApplicationsComponent implements OnInit, OnDestroy {
  applications$!: Observable<JobApplication[]>;
  filteredApplications$!: Observable<JobApplication[]>;
  applicationStats$!: Observable<ApplicationStats>;
  reviewForm: FormGroup;
  reviewingApplicationId: number | null = null;
  isSubmittingReview = false;
  isLoading = false;

  private filterSubject = new BehaviorSubject<ApplicationStatus | 'ALL'>('ALL');
  private destroy$ = new Subject<void>();
  activeFilter: ApplicationStatus | 'ALL' = 'ALL';

  // Expose ApplicationStatus enum to template
  ApplicationStatus = ApplicationStatus;

  constructor(
    private jobApplicationService: JobApplicationService,
    private loadingService: LoadingService,
    private errorService: ErrorService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadApplications();
    this.setupFilteredApplications();
    this.setupApplicationStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadApplications(): void {
    this.isLoading = true;
    this.applications$ = this.jobApplicationService.getMyApplications().pipe(
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

  private setupApplicationStats(): void {
    this.applicationStats$ = this.jobApplicationService.getApplicationStats().pipe(
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

  toggleReviewForm(applicationId: number): void {
    this.reviewingApplicationId = this.reviewingApplicationId === applicationId ? null : applicationId;
    this.reviewForm.reset({ rating: 5, comment: '' });
  }

  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }

  getRatingText(rating: number): string {
    const ratingTexts: { [key: number]: string } = {
      1: 'Very Poor',
      2: 'Poor',
      3: 'Average',
      4: 'Good',
      5: 'Excellent'
    };
    return ratingTexts[rating] || '';
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

  isStepCompleted(step: ApplicationStatus, currentStatus: ApplicationStatus): boolean {
    const statusOrder = [ApplicationStatus.PENDING, ApplicationStatus.VIEWED, ApplicationStatus.ACCEPTED, ApplicationStatus.COMPLETED];
    const stepIndex = statusOrder.indexOf(step);
    const currentIndex = statusOrder.indexOf(currentStatus);
    return currentIndex >= stepIndex;
  }

  canReview(application: JobApplication): boolean {
    return application.status === ApplicationStatus.COMPLETED && !application.review;
  }

  getEmptyStateTitle(): string {
    switch (this.activeFilter) {
      case ApplicationStatus.PENDING: return 'No Pending Applications';
      case ApplicationStatus.VIEWED: return 'No Applications Under Review';
      case ApplicationStatus.ACCEPTED: return 'No Accepted Applications';
      case ApplicationStatus.COMPLETED: return 'No Completed Applications';
      case ApplicationStatus.REJECTED: return 'No Rejected Applications';
      default: return 'No Applications Yet';
    }
  }

  getEmptyStateMessage(): string {
    switch (this.activeFilter) {
      case ApplicationStatus.PENDING: return 'You don\'t have any pending applications at the moment.';
      case ApplicationStatus.VIEWED: return 'None of your applications are currently under review.';
      case ApplicationStatus.ACCEPTED: return 'You don\'t have any accepted applications yet.';
      case ApplicationStatus.COMPLETED: return 'You haven\'t completed any jobs yet.';
      case ApplicationStatus.REJECTED: return 'You don\'t have any rejected applications.';
      default: return 'Start applying to jobs to see your applications here.';
    }
  }

  trackByApplicationId(index: number, application: JobApplication): number {
    return application.id;
  }

  onReviewSubmit(): void {
    if (this.reviewForm.invalid || this.reviewingApplicationId === null) {
      return;
    }

    this.isSubmittingReview = true;

    const reviewData: ReviewSubmission = {
      rating: this.reviewForm.value.rating,
      comment: this.reviewForm.value.comment
    };

    this.jobApplicationService.submitReview(this.reviewingApplicationId, reviewData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isSubmittingReview = false;
        this.toggleReviewForm(this.reviewingApplicationId!);
        this.refreshApplications();
      },
      error: () => {
        this.isSubmittingReview = false;
      }
    });
  }

  // Navigation methods
  onViewJobDetails(jobId: number): void {
    this.router.navigate(['/app/jobs', jobId]);
  }

  onViewCompanyProfile(employerId: number): void {
    this.router.navigate(['/app/company', employerId]);
  }

  onBrowseJobs(): void {
    this.router.navigate(['/app/jobs']);
  }

  // Helper methods for template
  getTimeAgo(dateString: string): string {
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

  getJobTitle(application: JobApplication): string {
    return application.job?.title || 'Unknown Position';
  }

  getCompanyName(application: JobApplication): string {
    return application.job?.employer?.companyName || 'Unknown Company';
  }

  getJobLocation(application: JobApplication): string {
    return application.job?.location || 'Location not specified';
  }

  getJobSalary(application: JobApplication): string {
    if (!application.job?.salary) return 'Salary not disclosed';
    return `$${application.job.salary.toLocaleString()}`;
  }

  getJobDescription(application: JobApplication): string {
    const description = application.job?.description || '';
    if (description.length <= 150) return description;
    return description.slice(0, 150) + '...';
  }
}
