import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { DashboardService } from '../../services/dashboard.service';
import { LoadingService } from '../../services/loading.service';
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
    MatChipsModule
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
    public loadingService: LoadingService
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

    forkJoin({
      profile: this.profileService.getWorkerProfile().pipe(
        catchError(error => {
          console.error('Error loading worker profile:', error);
          return of(null);
        })
      ),
      stats: this.dashboardService.getWorkerStats().pipe(
        catchError(error => {
          console.error('Error loading worker stats:', error);
          return of({
            totalApplications: 0,
            pendingApplications: 0,
            interviewsScheduled: 0,
            profileViews: 0
          });
        })
      ),
      recentApplications: this.dashboardService.getRecentApplications(5).pipe(
        catchError(error => {
          console.error('Error loading recent applications:', error);
          return of([]);
        })
      ),
      recommendedJobs: this.dashboardService.getRecommendedJobs(6).pipe(
        catchError(error => {
          console.error('Error loading recommended jobs:', error);
          return of([]);
        })
      ),
      profileCompletion: this.dashboardService.getProfileCompletion().pipe(
        catchError(error => {
          console.error('Error loading profile completion:', error);
          return of({ percentage: 0, tips: [] });
        })
      )
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.workerProfile = data.profile;
        this.workerStats = {
          totalApplications: data.stats.totalApplications,
          pendingApplications: data.stats.pendingApplications,
          interviewsScheduled: data.stats.interviewsScheduled,
          profileViews: data.stats.profileViews,
          profileCompletionPercentage: data.profileCompletion.percentage,
          recentApplications: data.recentApplications,
          recommendedJobs: data.recommendedJobs,
          profileCompletionTips: data.profileCompletion.tips
        };
        this.recentApplications = data.recentApplications;
        this.recommendedJobs = data.recommendedJobs;
        this.profileCompletion = data.profileCompletion;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading worker dashboard:', error);
        this.isLoading = false;
      }
    });
  }

  private loadEmployerDashboard(): void {
    this.isLoading = true;

    forkJoin({
      profile: this.profileService.getEmployerProfile().pipe(
        catchError(error => {
          console.error('Error loading employer profile:', error);
          return of(null);
        })
      ),
      stats: this.dashboardService.getEmployerStats().pipe(
        catchError(error => {
          console.error('Error loading employer stats:', error);
          return of({
            activeJobs: 0,
            totalApplications: 0,
            newApplicationsThisWeek: 0,
            totalViews: 0
          });
        })
      ),
      activeJobs: this.dashboardService.getActiveJobPostings(5).pipe(
        catchError(error => {
          console.error('Error loading active jobs:', error);
          return of([]);
        })
      ),
      recentApplications: this.dashboardService.getRecentApplicationsForEmployer(5).pipe(
        catchError(error => {
          console.error('Error loading recent applications:', error);
          return of([]);
        })
      )
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.employerProfile = data.profile;
        this.employerStats = {
          activeJobs: data.stats.activeJobs,
          totalApplications: data.stats.totalApplications,
          newApplicationsThisWeek: data.stats.newApplicationsThisWeek,
          totalViews: data.stats.totalViews,
          recentApplications: data.recentApplications,
          activeJobPostings: data.activeJobs
        };
        this.activeJobs = data.activeJobs;
        this.recentEmployerApplications = data.recentApplications;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employer dashboard:', error);
        this.isLoading = false;
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
    // Navigate to job details
  }

  onApplicationClick(applicationId: number): void {
    // Navigate to application details
  }
}
