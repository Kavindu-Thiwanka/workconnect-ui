import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { DashboardService } from '../../services/dashboard.service';
import { LoadingService } from '../../services/loading.service';
import { ErrorService } from '../../services/error.service';
import { EmployerDashboardComponent } from '../employer/employer-dashboard/employer-dashboard.component';
import {
  WorkerDashboardStats,
  EmployerDashboardStats,
  Job,
  JobApplication,
  WorkerProfile,
  EmployerProfile
} from '../../models/api-models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatProgressBarModule,
    MatChipsModule,
    MatMenuModule,
    EmployerDashboardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  userRole: string | null = null;
  isLoading = true;

  // Worker Dashboard Data
  workerStats: WorkerDashboardStats | null = null;
  workerProfile: WorkerProfile | null = null;
  recentApplications: JobApplication[] = [];
  recommendedJobs: Job[] = [];
  profileCompletion = { percentage: 0, tips: [] as string[] };

  // Employer Dashboard Data
  employerStats: EmployerDashboardStats | null = null;
  employerProfile: EmployerProfile | null = null;
  activeJobs: Job[] = [];
  recentEmployerApplications: JobApplication[] = [];

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private dashboardService: DashboardService,
    public loadingService: LoadingService,
    private errorService: ErrorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getRole();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    if (this.userRole === 'WORKER') {
      this.loadWorkerDashboard();
    } else if (this.userRole === 'EMPLOYER') {
      this.loadEmployerDashboard();
    }
  }

  private loadWorkerDashboard(): void {
    this.isLoading = true;

    // Use the comprehensive dashboard endpoint
    this.dashboardService.getWorkerDashboard().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.errorService.showError('Failed to load dashboard', 'Unable to load your dashboard data. Please try again.');
        this.isLoading = false;
        return of(null);
      })
    ).subscribe({
      next: (dashboard) => {
        if (dashboard) {
          this.workerStats = dashboard;
          this.recentApplications = dashboard.recentApplications || [];
          this.recommendedJobs = dashboard.recommendedJobs || [];
          this.profileCompletion = {
            percentage: dashboard.profileCompletionPercentage || 0,
            tips: dashboard.profileCompletionTips || []
          };
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorService.showError('Failed to load dashboard', 'Unable to load your dashboard data. Please try again.');
        this.isLoading = false;
      }
    });

    // Load worker profile separately as it might be needed for other purposes
    this.profileService.getWorkerProfile().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error loading worker profile:', error);
        return of(null);
      })
    ).subscribe({
      next: (profile) => {
        this.workerProfile = profile;
      }
    });
  }

  private loadEmployerDashboard(): void {
    this.isLoading = true;

    // Use the comprehensive dashboard endpoint
    this.dashboardService.getEmployerDashboard().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.errorService.showError('Failed to load dashboard', 'Unable to load your dashboard data. Please try again.');
        this.isLoading = false;
        return of(null);
      })
    ).subscribe({
      next: (dashboard) => {
        if (dashboard) {
          this.employerStats = dashboard;
          this.activeJobs = dashboard.activeJobPostings || [];
          this.recentEmployerApplications = dashboard.recentApplications || [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorService.showError('Failed to load dashboard', 'Unable to load your dashboard data. Please try again.');
        this.isLoading = false;
      }
    });

    // Load employer profile separately as it might be needed for other purposes
    this.profileService.getEmployerProfile().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error loading employer profile:', error);
        return of(null);
      })
    ).subscribe({
      next: (profile) => {
        this.employerProfile = profile;
      }
    });
  }

  // Helper methods for template
  getProfileCompletionColor(): string {
    if (this.profileCompletion.percentage >= 80) return 'primary';
    if (this.profileCompletion.percentage >= 50) return 'accent';
    return 'warn';
  }

  getApplicationStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'primary';
      case 'REVIEWED': return 'accent';
      case 'SHORTLISTED': return 'primary';
      case 'INTERVIEWED': return 'accent';
      case 'OFFERED': return 'primary';
      case 'HIRED': return 'primary';
      case 'REJECTED': return 'warn';
      default: return 'primary';
    }
  }

  formatSalary(salary: number | undefined, currency: string = 'USD'): string {
    if (!salary) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(salary);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onJobClick(jobId: number): void {
    this.router.navigate(['/app/jobs', jobId]);
  }

  onApplicationClick(applicationId: number): void {
    if (this.userRole === 'EMPLOYER') {
      this.router.navigate(['/app/employer/applications', applicationId]);
    } else {
      this.router.navigate(['/app/my-applications']);
    }
  }

  onViewAllJobs(): void {
    if (this.userRole === 'EMPLOYER') {
      this.router.navigate(['/app/employer/jobs']);
    } else {
      this.router.navigate(['/app/jobs']);
    }
  }

  onViewAllApplications(): void {
    if (this.userRole === 'EMPLOYER') {
      this.router.navigate(['/app/employer/applications']);
    } else {
      this.router.navigate(['/app/my-applications']);
    }
  }

  onPostNewJob(): void {
    this.router.navigate(['/app/jobs/new']);
  }

  onEditProfile(): void {
    this.router.navigate(['/app/profile']);
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  // Method to handle real-time updates when data changes
  onDataUpdate(): void {
    // This can be called when jobs are created, applications are submitted, etc.
    this.refreshDashboard();
  }

  // Helper methods for template
  trackByJobId(index: number, job: any): any {
    return job.id;
  }

  trackByApplicationId(index: number, application: any): any {
    return application.id;
  }

  getDaysAgo(dateString: string): string {
    if (!dateString) return 'Unknown date';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    } catch (error) {
      return 'Unknown date';
    }
  }

  getTimeAgo(dateString: string): string {
    if (!dateString) return 'Unknown time';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return '1 day ago';
      return `${diffDays} days ago`;
    } catch (error) {
      return 'Unknown time';
    }
  }

  getApplicantInitials(worker: any): string {
    if (!worker) return 'NA';
    const firstName = worker.firstName || '';
    const lastName = worker.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'NA';
  }

  getApplicantName(worker: any): string {
    if (!worker) return 'Unknown Applicant';
    const firstName = worker.firstName || '';
    const lastName = worker.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Applicant';
  }

  formatApplicationStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pending Review',
      'VIEWED': 'Viewed',
      'ACCEPTED': 'Accepted',
      'REJECTED': 'Rejected',
      'COMPLETED': 'Completed'
    };
    return statusMap[status] || status;
  }

  // Action methods for employer dashboard
  onViewApplications(jobId: number): void {
    this.router.navigate(['/app/employer/jobs', jobId, 'applications']);
  }

  onEditJob(jobId: number): void {
    this.router.navigate(['/app/jobs', jobId, 'edit']);
  }

  onViewJob(jobId: number): void {
    this.router.navigate(['/app/jobs', jobId]);
  }

  onReviewApplication(applicationId: number): void {
    this.router.navigate(['/app/employer/applications', applicationId]);
  }

  onViewApplicantProfile(workerId: number): void {
    this.router.navigate(['/app/profile', workerId]);
  }

  onUpdateApplicationStatus(applicationId: number): void {
    // This could open a dialog or navigate to a status update page
    this.router.navigate(['/app/employer/applications', applicationId]);
  }
}
