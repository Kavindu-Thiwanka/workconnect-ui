import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { ErrorService } from '../../../services/error.service';
import { AdminJob, PageResponse } from '../../../models/api-models';

@Component({
  selector: 'app-job-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './job-management.component.html',
  styleUrls: ['./job-management.component.scss']
})
export class JobManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  displayedColumns: string[] = ['id', 'jobTitle', 'employerCompanyName', 'location', 'salary', 'jobType', 'status', 'totalApplications', 'createdAt', 'actions'];
  dataSource: AdminJob[] = [];
  totalElements = 0;
  pageSize = 20;
  pageIndex = 0;
  sortBy = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';
  searchTerm = '';
  isLoading = false;

  constructor(
    private adminService: AdminService,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchTerm = searchTerm;
        this.pageIndex = 0;
        this.loadJobs();
      });
  }

  loadJobs(): void {
    this.isLoading = true;

    this.adminService.getAllJobs(
      this.pageIndex,
      this.pageSize,
      this.sortBy,
      this.sortDirection,
      this.searchTerm
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: PageResponse<AdminJob>) => {
        this.dataSource = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.errorService.showError('Error', 'Failed to load jobs');
        this.isLoading = false;
      }
    });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadJobs();
  }

  onSortChange(sort: Sort): void {
    this.sortBy = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc';
    this.pageIndex = 0;
    this.loadJobs();
  }

  deleteJob(job: AdminJob): void {
    if (confirm(`Are you sure you want to delete the job "${job.jobTitle}"? This action cannot be undone.`)) {
      this.adminService.deleteJob(job.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.errorService.showSuccess('Success', 'Job deleted successfully');
            this.loadJobs(); // Reload the list
          },
          error: (error) => {
            console.error('Error deleting job:', error);
            this.errorService.showError('Error', 'Failed to delete job');
          }
        });
    }
  }

  exportJobs(): void {
    this.adminService.exportJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.adminService.downloadFile(blob, 'jobs_export.csv');
          this.errorService.showSuccess('Success', 'Jobs exported successfully');
        },
        error: (error) => {
          console.error('Error exporting jobs:', error);
          this.errorService.showError('Error', 'Failed to export jobs');
        }
      });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'OPEN': return 'primary';
      case 'CLOSED': return 'accent';
      case 'FILLED': return 'primary';
      case 'EXPIRED': return 'warn';
      default: return '';
    }
  }

  getJobTypeColor(jobType: string): string {
    switch (jobType) {
      case 'ONE_DAY': return 'accent';
      case 'CONTRACT': return 'primary';
      default: return '';
    }
  }

  formatSalary(salary: number | null): string {
    if (!salary) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(salary);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  truncateText(text: string, maxLength: number = 50): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
