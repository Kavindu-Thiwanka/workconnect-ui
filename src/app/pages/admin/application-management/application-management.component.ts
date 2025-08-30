import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { ErrorService } from '../../../services/error.service';
import { AdminApplication, PageResponse } from '../../../models/api-models';

@Component({
  selector: 'app-application-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './application-management.component.html',
  styleUrls: ['./application-management.component.scss']
})
export class ApplicationManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = ['id', 'jobTitle', 'workerName', 'employerCompanyName', 'status', 'appliedAt', 'statusUpdatedAt', 'actions'];
  dataSource: AdminApplication[] = [];
  totalElements = 0;
  pageSize = 20;
  pageIndex = 0;
  sortBy = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';
  isLoading = false;

  constructor(
    private adminService: AdminService,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadApplications(): void {
    this.isLoading = true;

    this.adminService.getAllApplications(
      this.pageIndex,
      this.pageSize,
      this.sortBy,
      this.sortDirection
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: PageResponse<AdminApplication>) => {
        this.dataSource = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.errorService.showError('Error', 'Failed to load applications');
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadApplications();
  }

  onSortChange(sort: Sort): void {
    this.sortBy = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc';
    this.pageIndex = 0;
    this.loadApplications();
  }

  exportApplications(): void {
    this.adminService.exportApplications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.adminService.downloadFile(blob, 'applications_export.csv');
          this.errorService.showSuccess('Success', 'Applications exported successfully');
        },
        error: (error) => {
          console.error('Error exporting applications:', error);
          this.errorService.showError('Error', 'Failed to export applications');
        }
      });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'accent';
      case 'VIEWED': return 'primary';
      case 'ACCEPTED': return 'primary';
      case 'REJECTED': return 'warn';
      case 'COMPLETED': return 'primary';
      default: return '';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  truncateText(text: string, maxLength: number = 30): string {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  }
}
