import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { ErrorService } from '../../../services/error.service';
import { AdminUser, PageResponse } from '../../../models/api-models';

@Component({
  selector: 'app-user-management',
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
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  displayedColumns: string[] = ['userId', 'email', 'role', 'status', 'displayName', 'location', 'totalApplications', 'totalJobPostings', 'actions'];
  dataSource: AdminUser[] = [];
  totalElements = 0;
  pageSize = 20;
  pageIndex = 0;
  sortBy = 'userId';
  sortDirection: 'asc' | 'desc' = 'asc';
  searchTerm = '';
  isLoading = false;

  constructor(
    private adminService: AdminService,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadUsers();
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
        this.loadUsers();
      });
  }

  loadUsers(): void {
    this.isLoading = true;

    this.adminService.getAllUsers(
      this.pageIndex,
      this.pageSize,
      this.sortBy,
      this.sortDirection,
      this.searchTerm
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: PageResponse<AdminUser>) => {
        this.dataSource = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorService.showError('Error', 'Failed to load users');
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
    this.loadUsers();
  }

  onSortChange(sort: Sort): void {
    this.sortBy = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc';
    this.pageIndex = 0;
    this.loadUsers();
  }

  updateUserStatus(user: AdminUser, status: 'ACTIVE' | 'INACTIVE' | 'BANNED'): void {
    this.adminService.updateUserStatus(user.userId, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          user.status = status;
          this.errorService.showSuccess('Success', `User status updated to ${status}`);
        },
        error: (error) => {
          console.error('Error updating user status:', error);
          this.errorService.showError('Error', 'Failed to update user status');
        }
      });
  }

  deleteUser(user: AdminUser): void {
    if (confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
      this.adminService.deleteUser(user.userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.errorService.showSuccess('Success', 'User deleted successfully');
            this.loadUsers(); // Reload the list
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.errorService.showError('Error', 'Failed to delete user');
          }
        });
    }
  }

  exportUsers(): void {
    this.adminService.exportUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.adminService.downloadFile(blob, 'users_export.csv');
          this.errorService.showSuccess('Success', 'Users exported successfully');
        },
        error: (error) => {
          console.error('Error exporting users:', error);
          this.errorService.showError('Error', 'Failed to export users');
        }
      });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'primary';
      case 'INACTIVE': return 'accent';
      case 'BANNED': return 'warn';
      default: return '';
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'ADMIN': return 'warn';
      case 'EMPLOYER': return 'primary';
      case 'WORKER': return 'accent';
      default: return '';
    }
  }
}
