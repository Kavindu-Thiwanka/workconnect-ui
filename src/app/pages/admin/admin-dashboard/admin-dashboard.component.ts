import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Subject, takeUntil, interval, timer } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { ErrorService } from '../../../services/error.service';
import { AdminStats } from '../../../models/api-models';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatProgressBarModule,
    MatMenuModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatRippleModule,
    BaseChartDirective
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('userChart') userChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('jobChart') jobChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('applicationChart') applicationChart!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();

  stats: AdminStats | null = null;
  isLoading = true;
  error: string | null = null;

  // Animation and UI state
  animatedStats: any = {};
  showSkeletons = true;
  dateRange = { start: null, end: null };

  // Chart configurations
  userChartConfig: ChartConfiguration | null = null;
  jobChartConfig: ChartConfiguration | null = null;
  applicationChartConfig: ChartConfiguration | null = null;

  // Chart instances
  private userChartInstance: Chart | null = null;
  private jobChartInstance: Chart | null = null;
  private applicationChartInstance: Chart | null = null;

  // Quick action items
  quickActions = [
    { icon: 'people', label: 'Manage Users', route: '/app/admin/users', color: 'primary' },
    { icon: 'work', label: 'Manage Jobs', route: '/app/admin/jobs', color: 'accent' },
    { icon: 'assignment', label: 'View Applications', route: '/app/admin/applications', color: 'warn' },
    { icon: 'download', label: 'Export Data', action: 'export', color: 'primary' }
  ];

  constructor(
    private adminService: AdminService,
    private errorService: ErrorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeAnimatedStats();
    this.loadStatistics();
    this.setupAutoRefresh();
  }

  ngAfterViewInit(): void {
    // Initialize charts after view is ready
    timer(100).subscribe(() => {
      if (this.stats) {
        this.initializeCharts();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  private initializeAnimatedStats(): void {
    this.animatedStats = {
      totalUsers: 0,
      activeUsers: 0,
      totalJobs: 0,
      openJobs: 0,
      totalApplications: 0,
      approvedApplications: 0,
      newUsersThisWeek: 0,
      newJobsThisWeek: 0,
      newApplicationsThisWeek: 0
    };
  }

  private setupAutoRefresh(): void {
    // Auto-refresh every 5 minutes
    interval(300000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadStatistics(false);
      });
  }

  loadStatistics(showLoading = true): void {
    if (showLoading) {
      this.isLoading = true;
      this.showSkeletons = true;
    }
    this.error = null;

    this.adminService.getSystemStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.isLoading = false;
          this.showSkeletons = false;
          this.animateCounters();
          this.updateCharts();
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
          this.error = 'Failed to load system statistics';
          this.isLoading = false;
          this.showSkeletons = false;
          this.errorService.showError('Error', 'Failed to load system statistics');
        }
      });
  }

  private animateCounters(): void {
    if (!this.stats) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    const counters = [
      { key: 'totalUsers', target: this.stats.totalUsers },
      { key: 'activeUsers', target: this.stats.activeUsers },
      { key: 'totalJobs', target: this.stats.totalJobs },
      { key: 'openJobs', target: this.stats.openJobs },
      { key: 'totalApplications', target: this.stats.totalApplications },
      { key: 'approvedApplications', target: this.stats.approvedApplications },
      { key: 'newUsersThisWeek', target: this.stats.newUsersThisWeek },
      { key: 'newJobsThisWeek', target: this.stats.newJobsThisWeek },
      { key: 'newApplicationsThisWeek', target: this.stats.newApplicationsThisWeek }
    ];

    counters.forEach(counter => {
      const increment = counter.target / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        this.animatedStats[counter.key] = Math.round(increment * currentStep);

        if (currentStep >= steps) {
          this.animatedStats[counter.key] = counter.target;
          clearInterval(timer);
        }
      }, stepDuration);
    });
  }

  private initializeCharts(): void {
    if (!this.stats) return;

    this.createUserChart();
    this.createJobChart();
    this.createApplicationChart();
  }

  private createUserChart(): void {
    if (!this.userChart?.nativeElement || !this.stats) return;

    const ctx = this.userChart.nativeElement.getContext('2d');
    if (!ctx) return;

    this.userChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Active Users', 'Inactive Users', 'Banned Users'],
        datasets: [{
          data: [this.stats.activeUsers, this.stats.inactiveUsers, this.stats.bannedUsers],
          backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  }

  private createJobChart(): void {
    if (!this.jobChart?.nativeElement || !this.stats) return;

    const ctx = this.jobChart.nativeElement.getContext('2d');
    if (!ctx) return;

    this.jobChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Open', 'Closed', 'Filled', 'Expired'],
        datasets: [{
          label: 'Jobs',
          data: [this.stats.openJobs, this.stats.closedJobs, this.stats.filledJobs, this.stats.expiredJobs],
          backgroundColor: ['#2196F3', '#9E9E9E', '#4CAF50', '#FF5722'],
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  private createApplicationChart(): void {
    if (!this.applicationChart?.nativeElement || !this.stats) return;

    const ctx = this.applicationChart.nativeElement.getContext('2d');
    if (!ctx) return;

    this.applicationChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
          label: 'Applications',
          data: [this.stats.pendingApplications, this.stats.approvedApplications, this.stats.rejectedApplications],
          borderColor: '#673AB7',
          backgroundColor: 'rgba(103, 58, 183, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#673AB7',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  private updateCharts(): void {
    if (this.userChartInstance && this.stats) {
      this.userChartInstance.data.datasets[0].data = [
        this.stats.activeUsers,
        this.stats.inactiveUsers,
        this.stats.bannedUsers
      ];
      this.userChartInstance.update();
    }

    if (this.jobChartInstance && this.stats) {
      this.jobChartInstance.data.datasets[0].data = [
        this.stats.openJobs,
        this.stats.closedJobs,
        this.stats.filledJobs,
        this.stats.expiredJobs
      ];
      this.jobChartInstance.update();
    }

    if (this.applicationChartInstance && this.stats) {
      this.applicationChartInstance.data.datasets[0].data = [
        this.stats.pendingApplications,
        this.stats.approvedApplications,
        this.stats.rejectedApplications
      ];
      this.applicationChartInstance.update();
    }
  }

  private destroyCharts(): void {
    if (this.userChartInstance) {
      this.userChartInstance.destroy();
    }
    if (this.jobChartInstance) {
      this.jobChartInstance.destroy();
    }
    if (this.applicationChartInstance) {
      this.applicationChartInstance.destroy();
    }
  }

  refreshStats(): void {
    this.loadStatistics();
  }

  // Navigation and actions
  onQuickAction(action: any): void {
    if (action.route) {
      this.router.navigate([action.route]);
    } else if (action.action === 'export') {
      this.exportDashboardData();
    }
  }

  onStatCardClick(type: string): void {
    switch (type) {
      case 'users':
        this.router.navigate(['/app/admin/users']);
        break;
      case 'jobs':
        this.router.navigate(['/app/admin/jobs']);
        break;
      case 'applications':
        this.router.navigate(['/app/admin/applications']);
        break;
    }
  }

  private exportDashboardData(): void {
    if (!this.stats) return;

    const data = {
      exportDate: new Date().toISOString(),
      statistics: this.stats
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Utility methods for calculating percentages
  getUserActivePercentage(): number {
    if (!this.stats || this.stats.totalUsers === 0) return 0;
    return Math.round((this.stats.activeUsers / this.stats.totalUsers) * 100);
  }

  getJobOpenPercentage(): number {
    if (!this.stats || this.stats.totalJobs === 0) return 0;
    return Math.round((this.stats.openJobs / this.stats.totalJobs) * 100);
  }

  getApplicationApprovedPercentage(): number {
    if (!this.stats || this.stats.totalApplications === 0) return 0;
    return Math.round((this.stats.approvedApplications / this.stats.totalApplications) * 100);
  }

  // Trend calculation methods
  getTrendIcon(current: number, previous: number): string {
    if (current > previous) return 'trending_up';
    if (current < previous) return 'trending_down';
    return 'trending_flat';
  }

  getTrendColor(current: number, previous: number): string {
    if (current > previous) return 'success';
    if (current < previous) return 'warn';
    return 'primary';
  }

  getProgressValue(current: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  }
}
