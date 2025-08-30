import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { Subject, takeUntil } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { ErrorService } from '../../../services/error.service';
import { AdminStats } from '../../../models/api-models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatGridListModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  stats: AdminStats | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private adminService: AdminService,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatistics(): void {
    this.isLoading = true;
    this.error = null;

    this.adminService.getSystemStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
          this.error = 'Failed to load system statistics';
          this.isLoading = false;
          this.errorService.showError('Error', 'Failed to load system statistics');
        }
      });
  }

  refreshStats(): void {
    this.loadStatistics();
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
}
