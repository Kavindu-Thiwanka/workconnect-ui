import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { JobService } from '../../services/job.service';
import { AuthService } from '../../services/auth.service';
import { JobDetail, ApplicationStatusResponse } from '../../models/api-models';
import { Subject, Observable, EMPTY, combineLatest } from 'rxjs';
import { takeUntil, catchError, finalize, switchMap, tap, map } from 'rxjs/operators';

interface JobDetailState {
  job: JobDetail | null;
  applicationStatus: ApplicationStatusResponse | null;
  isLoading: boolean;
  isApplying: boolean;
  error: string | null;
}

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobDetailComponent implements OnInit, OnDestroy {
  // Modern Angular dependency injection
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobService = inject(JobService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  // Lifecycle management
  private readonly destroy$ = new Subject<void>();

  // Modern Angular signals for reactive state management
  private readonly state = signal<JobDetailState>({
    job: null,
    applicationStatus: null,
    isLoading: true,
    isApplying: false,
    error: null
  });

  // Computed signals for derived state
  readonly job = computed(() => this.state().job);
  readonly applicationStatus = computed(() => this.state().applicationStatus);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly isApplying = computed(() => this.state().isApplying);
  readonly error = computed(() => this.state().error);
  readonly userRole = computed(() => this.authService.getRole());
  readonly isWorker = computed(() => this.userRole() === 'WORKER');
  readonly canApply = computed(() =>
    this.isWorker() &&
    this.job() &&
    !this.applicationStatus()?.hasApplied &&
    !this.isApplying()
  );
  readonly hasApplied = computed(() => this.applicationStatus()?.hasApplied || false);

  // Computed properties for better UX
  readonly formattedSalary = computed(() => {
    const job = this.job();
    return job?.salary ? `$${job.salary.toLocaleString()}` : 'Salary not specified';
  });

  readonly formattedPostedDate = computed(() => {
    const job = this.job();
    if (!job?.postedAt) return '';
    return new Date(job.postedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  readonly skillsArray = computed(() => {
    const job = this.job();
    return job?.requiredSkills ? job.requiredSkills.split(',').map(s => s.trim()) : [];
  });

  ngOnInit(): void {
    this.loadJobDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadJobDetails(): void {
    const jobId = this.route.snapshot.paramMap.get('jobId');

    if (!jobId) {
      this.updateState({ error: 'Invalid job ID', isLoading: false });
      return;
    }

    // Reset state
    this.updateState({ isLoading: true, error: null });

    // Load job details and application status in parallel if user is a worker
    const jobDetails$ = this.jobService.getJobById(jobId).pipe(
      catchError((error) => {
        console.error('Error loading job details:', error);
        this.updateState({
          error: 'Failed to load job details. Please try again.',
          isLoading: false
        });
        return EMPTY;
      })
    );

    const applicationStatus$ = this.isWorker()
      ? this.jobService.checkApplicationStatus(jobId).pipe(
          catchError((error) => {
            console.error('Error checking application status:', error);
            // Don't fail the entire load if application status fails
            return EMPTY;
          })
        )
      : EMPTY;

    // Combine both observables
    combineLatest([jobDetails$, applicationStatus$]).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.updateState({ isLoading: false }))
    ).subscribe({
      next: ([job, applicationStatus]) => {
        this.updateState({
          job: job as JobDetail,
          applicationStatus: applicationStatus as ApplicationStatusResponse || null,
          error: null
        });
      },
      error: (error) => {
        console.error('Error in job details load:', error);
        this.updateState({
          error: 'An unexpected error occurred. Please try again.',
          isLoading: false
        });
      }
    });
  }

  applyForJob(): void {
    const job = this.job();
    if (!job || !this.canApply()) {
      return;
    }

    this.updateState({ isApplying: true });

    this.jobService.applyForJob(job.id.toString()).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.updateState({ isApplying: false }))
    ).subscribe({
      next: () => {
        this.updateState({
          applicationStatus: { hasApplied: true, status: 'PENDING', appliedAt: new Date().toISOString() }
        });
        this.showSuccessMessage('Application submitted successfully!');
      },
      error: (error) => {
        console.error('Error applying for job:', error);
        const errorMessage = error.message || 'Failed to submit application. Please try again.';
        this.showErrorMessage(errorMessage);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/app/jobs']);
  }

  shareJob(): void {
    if (navigator.share && this.job()) {
      navigator.share({
        title: this.job()!.jobTitle,
        text: `Check out this job opportunity: ${this.job()!.jobTitle}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.showSuccessMessage('Job link copied to clipboard!');
      }).catch(() => {
        this.showErrorMessage('Failed to copy link to clipboard');
      });
    }
  }

  private updateState(partialState: Partial<JobDetailState>): void {
    this.state.update(currentState => ({ ...currentState, ...partialState }));
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 7000,
      panelClass: ['error-snackbar']
    });
  }

  // Accessibility helpers
  getJobTypeDisplayName(jobType: string): string {
    switch (jobType) {
      case 'ONE_DAY': return 'One Day Job';
      case 'CONTRACT': return 'Contract Work';
      default: return jobType;
    }
  }

  getApplicationStatusDisplayName(status: string): string {
    switch (status) {
      case 'PENDING': return 'Application Pending';
      case 'REVIEWED': return 'Under Review';
      case 'SHORTLISTED': return 'Shortlisted';
      case 'INTERVIEWED': return 'Interviewed';
      case 'OFFERED': return 'Job Offered';
      case 'HIRED': return 'Hired';
      case 'REJECTED': return 'Not Selected';
      case 'COMPLETED': return 'Job Completed';
      default: return status;
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }
}
