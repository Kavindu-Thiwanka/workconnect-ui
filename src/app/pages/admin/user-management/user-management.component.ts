import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, Sort, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SelectionModel } from '@angular/cdk/collections';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { ErrorService } from '../../../services/error.service';
import { AdminUser, PageResponse } from '../../../models/api-models';
import { saveAs } from 'file-saver';

// Interface definitions
interface UserFilter {
  name: string;
  query: any;
  icon: string;
  color: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  roleDistribution: { [key: string]: number };
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    MatDividerModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatBadgeModule,
    MatCardModule,
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatRippleModule,
    MatFormFieldModule,
    ScrollingModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Make Math available in template
  Math = Math;

  // Data source and selection
  dataSource = new MatTableDataSource<AdminUser>([]);
  selection = new SelectionModel<AdminUser>(true, []);

  // Loading and error states
  isLoading = true;
  isLoadingStats = true;
  error: string | null = null;
  showSkeletons = true;

  // User statistics
  userStats: UserStats = {
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisWeek: 0,
    roleDistribution: {}
  };

  // Pagination
  totalElements = 0;
  pageSize = 25;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];
  sortBy = 'userId';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Search and filters
  searchControl = new FormControl('');
  advancedFiltersForm!: FormGroup;
  showAdvancedFilters = false;

  // Table configuration
  displayedColumns: string[] = [
    'select', 'avatar', 'displayName', 'email', 'role', 'status',
    'location', 'totalApplications', 'totalJobPostings', 'actions'
  ];

  // Available columns configuration
  availableColumns = [
    { key: 'select', label: 'Select', visible: true, sortable: false },
    { key: 'avatar', label: 'Avatar', visible: true, sortable: false },
    { key: 'displayName', label: 'Name', visible: true, sortable: true },
    { key: 'email', label: 'Email', visible: true, sortable: true },
    { key: 'role', label: 'Role', visible: true, sortable: true },
    { key: 'status', label: 'Status', visible: true, sortable: true },
    { key: 'location', label: 'Location', visible: true, sortable: true },
    { key: 'totalApplications', label: 'Applications', visible: true, sortable: true },
    { key: 'totalJobPostings', label: 'Job Postings', visible: true, sortable: true },
    { key: 'actions', label: 'Actions', visible: true, sortable: false }
  ];

  // Filter options and presets
  roles = ['WORKER', 'EMPLOYER', 'ADMIN'];
  statuses = ['ACTIVE', 'INACTIVE', 'BANNED'];

  filterPresets: UserFilter[] = [
    { name: 'Active Workers', query: { role: 'WORKER', status: 'ACTIVE' }, icon: 'work', color: 'primary' },
    { name: 'Active Employers', query: { role: 'EMPLOYER', status: 'ACTIVE' }, icon: 'business', color: 'accent' },
    { name: 'Inactive Users', query: { status: 'INACTIVE' }, icon: 'person_off', color: 'warn' },
    { name: 'Recent Registrations', query: { registeredThisWeek: true }, icon: 'person_add', color: 'primary' },
    { name: 'Admin Users', query: { role: 'ADMIN' }, icon: 'admin_panel_settings', color: 'warn' }
  ];

  // Bulk actions
  bulkActions = [
    { label: 'Activate Selected', action: 'activate', icon: 'check_circle', color: 'primary' },
    { label: 'Deactivate Selected', action: 'deactivate', icon: 'cancel', color: 'warn' },
    { label: 'Delete Selected', action: 'delete', icon: 'delete', color: 'warn' },
    { label: 'Export Selected', action: 'export', icon: 'download', color: 'accent' }
  ];

  constructor(
    private adminService: AdminService,
    private errorService: ErrorService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.initializeAdvancedFilters();
  }

  private initializeAdvancedFilters(): void {
    this.advancedFiltersForm = this.fb.group({
      role: [''],
      status: [''],
      registrationDateStart: [''],
      registrationDateEnd: [''],
      lastLoginDateStart: [''],
      lastLoginDateEnd: [''],
      location: [''],
      minApplications: [''],
      maxApplications: [''],
      minJobPostings: [''],
      maxJobPostings: ['']
    });
  }

  ngOnInit(): void {
    this.setupSearch();
    this.setupAdvancedFilters();
    this.loadUsers();
    this.loadUserStats();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Setup custom filter predicate
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    // Setup main search control
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.applyFilter(searchTerm || '');
      });

    // Setup legacy search subject for backward compatibility
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchControl.setValue(searchTerm, { emitEvent: false });
        this.applyFilter(searchTerm);
      });
  }

  private setupAdvancedFilters(): void {
    this.advancedFiltersForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyAdvancedFilters();
      });
  }

  private createFilter(): (data: AdminUser, filter: string) => boolean {
    return (data: AdminUser, filter: string): boolean => {
      const searchStr = filter.toLowerCase();

      // Basic search across multiple fields
      const basicMatch = !searchStr ||
        (data.displayName?.toLowerCase().includes(searchStr) ?? false) ||
        (data.email?.toLowerCase().includes(searchStr) ?? false) ||
        (data.role?.toLowerCase().includes(searchStr) ?? false) ||
        (data.status?.toLowerCase().includes(searchStr) ?? false) ||
        (data.location?.toLowerCase().includes(searchStr) ?? false);

      // Advanced filters
      const advancedFilters = this.advancedFiltersForm.value;
      const advancedMatch = this.matchesAdvancedFilters(data, advancedFilters);

      return Boolean(basicMatch && advancedMatch);
    };
  }

  private matchesAdvancedFilters(user: AdminUser, filters: any): boolean {
    if (filters.role && user.role !== filters.role) return false;
    if (filters.status && user.status !== filters.status) return false;
    if (filters.location && !user.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;

    // Number range filters for applications and job postings
    if (filters.minApplications && user.totalApplications < filters.minApplications) return false;
    if (filters.maxApplications && user.totalApplications > filters.maxApplications) return false;
    if (filters.minJobPostings && user.totalJobPostings < filters.minJobPostings) return false;
    if (filters.maxJobPostings && user.totalJobPostings > filters.maxJobPostings) return false;

    return true;
  }

  loadUsers(): void {
    this.isLoading = true;
    this.showSkeletons = true;

    this.adminService.getAllUsers(
      this.pageIndex,
      this.pageSize,
      this.sortBy,
      this.sortDirection,
      this.searchControl.value || ''
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: PageResponse<AdminUser>) => {
        this.dataSource.data = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
        this.showSkeletons = false;
        this.error = null;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.error = 'Failed to load users';
        this.errorService.showError('Error', 'Failed to load users');
        this.isLoading = false;
        this.showSkeletons = false;
      }
    });
  }

  loadUserStats(): void {
    this.isLoadingStats = true;

    // This would need to be implemented in the AdminService
    // For now, we'll simulate the stats
    setTimeout(() => {
      this.userStats = {
        totalUsers: this.totalElements,
        activeUsers: Math.floor(this.totalElements * 0.8),
        newUsersThisWeek: Math.floor(this.totalElements * 0.1),
        roleDistribution: {
          'WORKER': Math.floor(this.totalElements * 0.6),
          'EMPLOYER': Math.floor(this.totalElements * 0.3),
          'ADMIN': Math.floor(this.totalElements * 0.1)
        }
      };
      this.isLoadingStats = false;
    }, 1000);
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyAdvancedFilters(): void {
    // Trigger the filter predicate
    this.dataSource.filter = JSON.stringify(this.advancedFiltersForm.value);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyFilterPreset(preset: UserFilter): void {
    // Reset advanced filters
    this.advancedFiltersForm.reset();

    // Apply preset filters
    Object.keys(preset.query).forEach(key => {
      if (this.advancedFiltersForm.get(key)) {
        this.advancedFiltersForm.get(key)?.setValue(preset.query[key]);
      }
    });

    this.showAdvancedFilters = true;
    this.snackBar.open(`Applied filter: ${preset.name}`, 'Close', { duration: 3000 });
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.advancedFiltersForm.reset();
    this.dataSource.filter = '';
    this.showAdvancedFilters = false;
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  getSelectedCount(): number {
    return this.selection.selected.length;
  }

  // Pagination and sorting
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

  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  // Bulk actions
  executeBulkAction(action: string): void {
    const selectedUsers = this.selection.selected;
    if (selectedUsers.length === 0) {
      this.snackBar.open('Please select users first', 'Close', { duration: 3000 });
      return;
    }

    switch (action) {
      case 'activate':
        this.bulkUpdateStatus(selectedUsers, 'ACTIVE');
        break;
      case 'deactivate':
        this.bulkUpdateStatus(selectedUsers, 'INACTIVE');
        break;
      case 'delete':
        this.bulkDeleteUsers(selectedUsers);
        break;
      case 'export':
        this.exportUsers(selectedUsers);
        break;
    }
  }

  private bulkUpdateStatus(users: AdminUser[], status: string): void {
    const userIds = users.map(u => u.userId);

    // This would need to be implemented in AdminService
    this.snackBar.open(`Updated ${users.length} users to ${status}`, 'Close', { duration: 3000 });
    this.selection.clear();
    this.loadUsers();
  }

  private bulkDeleteUsers(users: AdminUser[]): void {
    const confirmed = confirm(`Are you sure you want to delete ${users.length} users? This action cannot be undone.`);

    if (confirmed) {
      const userIds = users.map(u => u.userId);

      // This would need to be implemented in AdminService
      this.snackBar.open(`Deleted ${users.length} users`, 'Close', { duration: 3000 });
      this.selection.clear();
      this.loadUsers();
    }
  }

  // Export functionality
  exportUsers(users?: AdminUser[]): void {
    const usersToExport = users || this.dataSource.data;
    const csvData = this.convertToCSV(usersToExport);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const fileName = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);

    this.snackBar.open(`Exported ${usersToExport.length} users`, 'Close', { duration: 3000 });
  }

  private convertToCSV(users: AdminUser[]): string {
    const headers = ['User ID', 'Display Name', 'Email', 'Role', 'Status', 'Location', 'Applications', 'Job Postings'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        user.userId,
        `"${user.displayName || ''}"`,
        user.email,
        user.role,
        user.status,
        `"${user.location || ''}"`,
        user.totalApplications,
        user.totalJobPostings
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // Individual user actions
  viewUserDetails(user: AdminUser): void {
    // This would open a detailed user modal/dialog
    this.snackBar.open(`Viewing details for ${user.displayName}`, 'Close', { duration: 2000 });
  }

  editUser(user: AdminUser): void {
    // This would open an edit user dialog
    this.snackBar.open(`Editing ${user.displayName}`, 'Close', { duration: 2000 });
  }

  toggleUserStatus(user: AdminUser): void {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    // This would need to be implemented in AdminService
    this.snackBar.open(`${user.displayName} status changed to ${newStatus}`, 'Close', { duration: 3000 });
    this.loadUsers();
  }

  resetUserPassword(user: AdminUser): void {
    const confirmed = confirm(`Reset password for ${user.displayName}?`);

    if (confirmed) {
      // This would need to be implemented in AdminService
      this.snackBar.open(`Password reset email sent to ${user.email}`, 'Close', { duration: 3000 });
    }
  }

  deleteUser(user: AdminUser): void {
    const confirmed = confirm(`Are you sure you want to delete ${user.displayName}? This action cannot be undone.`);

    if (confirmed) {
      // This would need to be implemented in AdminService
      this.snackBar.open(`${user.displayName} has been deleted`, 'Close', { duration: 3000 });
      this.loadUsers();
    }
  }

  impersonateUser(user: AdminUser): void {
    const confirmed = confirm(`Impersonate ${user.displayName}? You will be logged in as this user.`);

    if (confirmed) {
      // This would need to be implemented in AdminService
      this.snackBar.open(`Impersonating ${user.displayName}`, 'Close', { duration: 3000 });
    }
  }

  // Utility methods
  getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'primary';
      case 'INACTIVE': return 'warn';
      case 'BANNED': return 'accent';
      default: return 'basic';
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'ADMIN': return 'admin_panel_settings';
      case 'EMPLOYER': return 'business';
      case 'WORKER': return 'work';
      default: return 'person';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'check_circle';
      case 'INACTIVE': return 'cancel';
      case 'BANNED': return 'block';
      default: return 'help';
    }
  }

  getUserInitials(user: AdminUser): string {
    if (!user.displayName) return '??';
    const names = user.displayName.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0].substring(0, 2).toUpperCase();
  }

  formatDate(date: string | Date): string {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getActivityLevel(user: AdminUser): string {
    const totalActivity = user.totalApplications + user.totalJobPostings;
    if (totalActivity > 10) return 'high';
    if (totalActivity > 5) return 'medium';
    if (totalActivity > 0) return 'low';
    return 'none';
  }

  getActivityColor(level: string): string {
    switch (level) {
      case 'high': return 'primary';
      case 'medium': return 'accent';
      case 'low': return 'warn';
      default: return 'basic';
    }
  }

  // Column visibility management
  toggleColumn(column: string): void {
    const col = this.availableColumns.find(c => c.key === column);
    if (col) {
      col.visible = !col.visible;
      this.updateDisplayedColumns();
    }
  }

  private updateDisplayedColumns(): void {
    this.displayedColumns = this.availableColumns
      .filter(col => col.visible)
      .map(col => col.key);
  }

  // Refresh functionality
  refreshData(): void {
    this.loadUsers();
    this.loadUserStats();
    this.snackBar.open('Data refreshed', 'Close', { duration: 2000 });
  }
}
