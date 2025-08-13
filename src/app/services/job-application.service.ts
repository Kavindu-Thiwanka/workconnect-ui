import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LoadingService } from './loading.service';
import { ErrorService } from './error.service';

// Interfaces for Job Applications
export interface JobApplication {
  id: number;
  jobId: number;
  workerId: number;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt?: string;
  coverLetter?: string;
  job?: {
    id: number;
    title: string;
    description: string;
    location: string;
    salary?: number;
    employer?: {
      id: number;
      companyName: string;
      email: string;
    };
  };
  worker?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    skills?: string[];
  };
  review?: ApplicationReview;
}

export interface ApplicationReview {
  id: number;
  applicationId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ApplicationStatusUpdate {
  status: ApplicationStatus;
  notes?: string;
}

export interface ReviewSubmission {
  rating: number;
  comment: string;
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  VIEWED = 'VIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export interface ApplicationStats {
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  completedApplications: number;
}

@Injectable({
  providedIn: 'root'
})
export class JobApplicationService {
  private readonly apiUrl = `${environment.apiUrl}/api`;
  private applicationsSubject = new BehaviorSubject<JobApplication[]>([]);
  public applications$ = this.applicationsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
    private errorService: ErrorService
  ) {}

  /**
   * Get all applications for the current worker
   */
  getMyApplications(): Observable<JobApplication[]> {
    return this.loadingService.wrapWithLoading('my-applications',
      this.http.get<JobApplication[]>(`${this.apiUrl}/worker/applications`).pipe(
        tap(applications => this.applicationsSubject.next(applications)),
        catchError(error => {
          this.errorService.showError('Failed to load applications', 'Unable to load your job applications. Please try again.');
          throw error;
        })
      )
    );
  }

  /**
   * Get applications for a specific job (employer view)
   */
  getJobApplications(jobId: number): Observable<JobApplication[]> {
    return this.loadingService.wrapWithLoading('job-applications',
      this.http.get<JobApplication[]>(`${this.apiUrl}/employer/jobs/${jobId}/applications`).pipe(
        catchError(error => {
          this.errorService.showError('Failed to load applications', 'Unable to load job applications. Please try again.');
          throw error;
        })
      )
    );
  }

  /**
   * Update application status (employer action)
   */
  updateApplicationStatus(applicationId: number, statusUpdate: ApplicationStatusUpdate): Observable<void> {
    return this.loadingService.wrapWithLoading('update-status',
      this.http.put<void>(`${this.apiUrl}/employer/applications/${applicationId}/status`, statusUpdate).pipe(
        tap(() => {
          this.errorService.showSuccess('Status Updated', 'Application status has been updated successfully.');
          this.refreshApplications();
        }),
        catchError(error => {
          this.errorService.showError('Failed to update status', 'Unable to update application status. Please try again.');
          throw error;
        })
      )
    );
  }

  /**
   * Submit a review for a completed job (worker action)
   */
  submitReview(applicationId: number, review: ReviewSubmission): Observable<ApplicationReview> {
    return this.loadingService.wrapWithLoading('submit-review',
      this.http.post<ApplicationReview>(`${this.apiUrl}/applications/${applicationId}/review`, review).pipe(
        tap(() => {
          this.errorService.showSuccess('Review Submitted', 'Your review has been submitted successfully.');
          this.refreshApplications();
        }),
        catchError(error => {
          this.errorService.showError('Failed to submit review', 'Unable to submit your review. Please try again.');
          throw error;
        })
      )
    );
  }

  /**
   * Apply for a job
   */
  applyForJob(jobId: number, coverLetter?: string): Observable<string> {
    const applicationData = coverLetter ? { coverLetter } : {};

    return this.loadingService.wrapWithLoading('apply-job',
      this.http.post<string>(`${this.apiUrl}/jobs/${jobId}/apply`, applicationData).pipe(
        tap(() => {
          this.errorService.showSuccess('Application Submitted', 'Your job application has been submitted successfully.');
          this.refreshApplications();
        }),
        catchError(error => {
          this.errorService.showError('Failed to apply', 'Unable to submit your application. Please try again.');
          throw error;
        })
      )
    );
  }

  /**
   * Get application statistics for worker
   */
  getApplicationStats(): Observable<ApplicationStats> {
    return this.applications$.pipe(
      map(applications => {
        const stats: ApplicationStats = {
          totalApplications: applications.length,
          pendingApplications: applications.filter(app => app.status === ApplicationStatus.PENDING).length,
          acceptedApplications: applications.filter(app => app.status === ApplicationStatus.ACCEPTED).length,
          rejectedApplications: applications.filter(app => app.status === ApplicationStatus.REJECTED).length,
          completedApplications: applications.filter(app => app.status === ApplicationStatus.COMPLETED).length
        };
        return stats;
      })
    );
  }

  /**
   * Get applications filtered by status
   */
  getApplicationsByStatus(status?: ApplicationStatus): Observable<JobApplication[]> {
    return this.applications$.pipe(
      map(applications => {
        if (!status) return applications;
        return applications.filter(app => app.status === status);
      })
    );
  }

  /**
   * Check if user has already applied for a job
   */
  hasAppliedForJob(jobId: number): Observable<boolean> {
    return this.applications$.pipe(
      map(applications => applications.some(app => app.jobId === jobId))
    );
  }

  /**
   * Check if user has already applied for a job (server-side check)
   */
  checkApplicationStatus(jobId: number): Observable<{ hasApplied: boolean; applicationId?: number; status?: ApplicationStatus }> {
    return this.http.get<{ hasApplied: boolean; applicationId?: number; status?: ApplicationStatus }>(`${this.apiUrl}/jobs/${jobId}/application-status`).pipe(
      catchError(error => {
        console.error('Failed to check application status', error);
        return of({ hasApplied: false });
      })
    );
  }

  /**
   * Get application by ID
   */
  getApplicationById(applicationId: number): Observable<JobApplication | undefined> {
    return this.applications$.pipe(
      map(applications => applications.find(app => app.id === applicationId))
    );
  }

  /**
   * Refresh applications data
   */
  refreshApplications(): void {
    this.getMyApplications().subscribe();
  }

  /**
   * Format application status for display
   */
  formatStatus(status: ApplicationStatus): string {
    const statusMap: { [key in ApplicationStatus]: string } = {
      [ApplicationStatus.PENDING]: 'Pending Review',
      [ApplicationStatus.VIEWED]: 'Under Review',
      [ApplicationStatus.ACCEPTED]: 'Accepted',
      [ApplicationStatus.REJECTED]: 'Not Selected',
      [ApplicationStatus.COMPLETED]: 'Completed'
    };
    return statusMap[status] || status;
  }

  /**
   * Get status icon for display
   */
  getStatusIcon(status: ApplicationStatus): string {
    const iconMap: { [key in ApplicationStatus]: string } = {
      [ApplicationStatus.PENDING]: 'schedule',
      [ApplicationStatus.VIEWED]: 'visibility',
      [ApplicationStatus.ACCEPTED]: 'check_circle',
      [ApplicationStatus.REJECTED]: 'cancel',
      [ApplicationStatus.COMPLETED]: 'task_alt'
    };
    return iconMap[status] || 'help';
  }

  /**
   * Get status color class for styling
   */
  getStatusColorClass(status: ApplicationStatus): string {
    const colorMap: { [key in ApplicationStatus]: string } = {
      [ApplicationStatus.PENDING]: 'status-pending',
      [ApplicationStatus.VIEWED]: 'status-viewed',
      [ApplicationStatus.ACCEPTED]: 'status-accepted',
      [ApplicationStatus.REJECTED]: 'status-rejected',
      [ApplicationStatus.COMPLETED]: 'status-completed'
    };
    return colorMap[status] || 'status-default';
  }
}
