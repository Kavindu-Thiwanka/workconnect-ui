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
import { AdminApplication, PageResponse } from '../../../models/api-models';
import { saveAs } from 'file-saver';

// Interface definitions
interface ApplicationFilter {
  name: string;
  query: any;
  icon: string;
  color: string;
}

interface ApplicationStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  averageProcessingTime: number;
  statusDistribution: { [key: string]: number };
  applicationTrends: { [key: string]: number };
}

@Component({
  selector: 'app-application-management',
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
  templateUrl: './application-management.component.html',
  styleUrls: ['./application-management.component.scss']
})
export class ApplicationManagementComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Make Math available in template
  Math = Math;

  // Data source and selection
  dataSource = new MatTableDataSource<AdminApplication>([]);
  selection = new SelectionModel<AdminApplication>(true, []);

  // Loading and error states
  isLoading = true;
  isLoadingStats = true;
  error: string | null = null;
  showSkeletons = true;

  // Application statistics
  applicationStats: ApplicationStats = {
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    averageProcessingTime: 0,
    statusDistribution: {},
    applicationTrends: {}
  };

  // Pagination
  totalElements = 0;
  pageSize = 25;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];
  sortBy = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Search and filters
  searchControl = new FormControl('');
  advancedFiltersForm!: FormGroup;
  showAdvancedFilters = false;

  // Table configuration
  displayedColumns: string[] = [
    'select', 'applicant', 'jobTitle', 'employerCompanyName', 'status',
    'appliedAt', 'statusUpdatedAt', 'resumeUrl', 'actions'
  ];

  // Available columns configuration
  availableColumns = [
    { key: 'select', label: 'Select', visible: true, sortable: false },
    { key: 'applicant', label: 'Applicant', visible: true, sortable: true },
    { key: 'jobTitle', label: 'Job Title', visible: true, sortable: true },
    { key: 'employerCompanyName', label: 'Company', visible: true, sortable: true },
    { key: 'status', label: 'Status', visible: true, sortable: true },
    { key: 'appliedAt', label: 'Applied Date', visible: true, sortable: true },
    { key: 'statusUpdatedAt', label: 'Last Updated', visible: true, sortable: true },
    { key: 'resumeUrl', label: 'Resume', visible: true, sortable: false },
    { key: 'actions', label: 'Actions', visible: true, sortable: false }
  ];

  // Filter options and presets
  statuses = ['PENDING', 'VIEWED', 'ACCEPTED', 'REJECTED', 'COMPLETED'];

  filterPresets: ApplicationFilter[] = [
    { name: 'Pending Applications', query: { status: 'PENDING' }, icon: 'schedule', color: 'accent' },
    { name: 'Recent Applications', query: { appliedThisWeek: true }, icon: 'schedule', color: 'primary' },
    { name: 'Rejected Applications', query: { status: 'REJECTED' }, icon: 'cancel', color: 'warn' },
    { name: 'Approved Applications', query: { status: 'ACCEPTED' }, icon: 'check_circle', color: 'primary' },
    { name: 'Completed Applications', query: { status: 'COMPLETED' }, icon: 'done_all', color: 'accent' }
  ];

  // Bulk actions
  bulkActions = [
    { label: 'Approve Selected', action: 'approve', icon: 'check_circle', color: 'primary' },
    { label: 'Reject Selected', action: 'reject', icon: 'cancel', color: 'warn' },
    { label: 'Mark as Viewed', action: 'viewed', icon: 'visibility', color: 'accent' },
    { label: 'Archive Selected', action: 'archive', icon: 'archive', color: 'basic' },
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
      status: [''],
      appliedDateStart: [''],
      appliedDateEnd: [''],
      statusUpdatedDateStart: [''],
      statusUpdatedDateEnd: [''],
      jobTitle: [''],
      employerCompanyName: [''],
      workerName: [''],
      workerEmail: ['']
    });
  }

  ngOnInit(): void {
    this.setupSearch();
    this.setupAdvancedFilters();
    this.loadApplications();
    this.loadApplicationStats();
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

  private createFilter(): (data: AdminApplication, filter: string) => boolean {
    return (data: AdminApplication, filter: string): boolean => {
      const searchStr = filter.toLowerCase();

      // Basic search across multiple fields
      const basicMatch = !searchStr ||
        (data.workerName?.toLowerCase().includes(searchStr) ?? false) ||
        (data.workerEmail?.toLowerCase().includes(searchStr) ?? false) ||
        (data.jobTitle?.toLowerCase().includes(searchStr) ?? false) ||
        (data.employerCompanyName?.toLowerCase().includes(searchStr) ?? false) ||
        (data.status?.toLowerCase().includes(searchStr) ?? false);

      // Advanced filters
      const advancedFilters = this.advancedFiltersForm.value;
      const advancedMatch = this.matchesAdvancedFilters(data, advancedFilters);

      return Boolean(basicMatch && advancedMatch);
    };
  }

  private matchesAdvancedFilters(application: AdminApplication, filters: any): boolean {
    if (filters.status && application.status !== filters.status) return false;
    if (filters.jobTitle && !application.jobTitle?.toLowerCase().includes(filters.jobTitle.toLowerCase())) return false;
    if (filters.employerCompanyName && !application.employerCompanyName?.toLowerCase().includes(filters.employerCompanyName.toLowerCase())) return false;
    if (filters.workerName && !application.workerName?.toLowerCase().includes(filters.workerName.toLowerCase())) return false;
    if (filters.workerEmail && !application.workerEmail?.toLowerCase().includes(filters.workerEmail.toLowerCase())) return false;

    return true;
  }

  loadApplications(): void {
    this.isLoading = true;
    this.showSkeletons = true;

    this.adminService.getAllApplications(
      this.pageIndex,
      this.pageSize,
      this.sortBy,
      this.sortDirection
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: PageResponse<AdminApplication>) => {
        this.dataSource.data = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
        this.showSkeletons = false;
        this.error = null;
      },
      error: (error: any) => {
        console.error('Error loading applications:', error);
        this.error = 'Failed to load applications';
        this.errorService.showError('Error', 'Failed to load applications');
        this.isLoading = false;
        this.showSkeletons = false;
      }
    });
  }

  loadApplicationStats(): void {
    this.isLoadingStats = true;

    // This would need to be implemented in the AdminService
    // For now, we'll simulate the stats
    setTimeout(() => {
      this.applicationStats = {
        totalApplications: this.totalElements,
        pendingApplications: Math.floor(this.totalElements * 0.4),
        approvedApplications: Math.floor(this.totalElements * 0.3),
        rejectedApplications: Math.floor(this.totalElements * 0.2),
        averageProcessingTime: 3.5, // days
        statusDistribution: {
          'PENDING': Math.floor(this.totalElements * 0.4),
          'VIEWED': Math.floor(this.totalElements * 0.1),
          'ACCEPTED': Math.floor(this.totalElements * 0.3),
          'REJECTED': Math.floor(this.totalElements * 0.2)
        },
        applicationTrends: {
          'thisWeek': Math.floor(this.totalElements * 0.15),
          'lastWeek': Math.floor(this.totalElements * 0.12),
          'thisMonth': Math.floor(this.totalElements * 0.6)
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

  applyFilterPreset(preset: ApplicationFilter): void {
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
    this.loadApplications();
  }

  onSortChange(sort: Sort): void {
    this.sortBy = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc';
    this.pageIndex = 0;
    this.loadApplications();
  }

  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  // Bulk actions
  executeBulkAction(action: string): void {
    const selectedApplications = this.selection.selected;
    if (selectedApplications.length === 0) {
      this.snackBar.open('Please select applications first', 'Close', { duration: 3000 });
      return;
    }

    switch (action) {
      case 'approve':
        this.bulkUpdateStatus(selectedApplications, 'ACCEPTED');
        break;
      case 'reject':
        this.bulkUpdateStatus(selectedApplications, 'REJECTED');
        break;
      case 'viewed':
        this.bulkUpdateStatus(selectedApplications, 'VIEWED');
        break;
      case 'archive':
        this.bulkArchiveApplications(selectedApplications);
        break;
      case 'export':
        this.exportApplications(selectedApplications);
        break;
    }
  }

  private bulkUpdateStatus(applications: AdminApplication[], status: string): void {
    const applicationIds = applications.map(a => a.id);

    // This would need to be implemented in AdminService
    this.snackBar.open(`Updated ${applications.length} applications to ${status}`, 'Close', { duration: 3000 });
    this.selection.clear();
    this.loadApplications();
  }

  private bulkArchiveApplications(applications: AdminApplication[]): void {
    const confirmed = confirm(`Are you sure you want to archive ${applications.length} applications?`);

    if (confirmed) {
      const applicationIds = applications.map(a => a.id);

      // This would need to be implemented in AdminService
      this.snackBar.open(`Archived ${applications.length} applications`, 'Close', { duration: 3000 });
      this.selection.clear();
      this.loadApplications();
    }
  }

  // Export functionality
  exportApplications(applications?: AdminApplication[]): void {
    const applicationsToExport = applications || this.dataSource.data;
    const csvData = this.convertToCSV(applicationsToExport);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const fileName = `applications_export_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);

    this.snackBar.open(`Exported ${applicationsToExport.length} applications`, 'Close', { duration: 3000 });
  }

  private convertToCSV(applications: AdminApplication[]): string {
    const headers = ['Application ID', 'Applicant Name', 'Applicant Email', 'Job Title', 'Company', 'Status', 'Applied Date', 'Last Updated'];
    const csvContent = [
      headers.join(','),
      ...applications.map(app => [
        app.id,
        `"${app.workerName || ''}"`,
        app.workerEmail,
        `"${app.jobTitle || ''}"`,
        `"${app.employerCompanyName || ''}"`,
        app.status,
        app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '',
        app.statusUpdatedAt ? new Date(app.statusUpdatedAt).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // Individual application actions
  viewApplicationDetails(application: AdminApplication): void {
    // This would open a detailed application modal/dialog
    this.snackBar.open(`Viewing details for application ${application.id}`, 'Close', { duration: 2000 });
  }

  approveApplication(application: AdminApplication): void {
    const confirmed = confirm(`Approve application from ${application.workerName} for ${application.jobTitle}?`);

    if (confirmed) {
      // This would need to be implemented in AdminService
      this.snackBar.open(`Application approved for ${application.workerName}`, 'Close', { duration: 3000 });
      this.loadApplications();
    }
  }

  rejectApplication(application: AdminApplication): void {
    const confirmed = confirm(`Reject application from ${application.workerName} for ${application.jobTitle}?`);

    if (confirmed) {
      // This would need to be implemented in AdminService
      this.snackBar.open(`Application rejected for ${application.workerName}`, 'Close', { duration: 3000 });
      this.loadApplications();
    }
  }

  downloadResume(application: AdminApplication): void {
    if (application.resumeUrl) {
      // This would download the resume file
      window.open(application.resumeUrl, '_blank');
      this.snackBar.open(`Downloading resume for ${application.workerName}`, 'Close', { duration: 2000 });
    } else {
      this.snackBar.open('No resume available for this application', 'Close', { duration: 3000 });
    }
  }

  contactApplicant(application: AdminApplication): void {
    // This would open email client or messaging system
    const emailSubject = `Regarding your application for ${application.jobTitle}`;
    const mailtoLink = `mailto:${application.workerEmail}?subject=${encodeURIComponent(emailSubject)}`;
    window.open(mailtoLink);
    this.snackBar.open(`Opening email to ${application.workerName}`, 'Close', { duration: 2000 });
  }

  viewJobDetails(application: AdminApplication): void {
    // This would navigate to job details or open job modal
    this.snackBar.open(`Viewing job details for ${application.jobTitle}`, 'Close', { duration: 2000 });
  }

  viewWorkerProfile(application: AdminApplication): void {
    // This would navigate to worker profile or open profile modal
    this.snackBar.open(`Viewing profile for ${application.workerName}`, 'Close', { duration: 2000 });
  }

  scheduleInterview(application: AdminApplication): void {
    // This would open interview scheduling dialog
    this.snackBar.open(`Scheduling interview with ${application.workerName}`, 'Close', { duration: 2000 });
  }

  addNotes(application: AdminApplication): void {
    // This would open notes dialog
    this.snackBar.open(`Adding notes for application ${application.id}`, 'Close', { duration: 2000 });
  }

  // Utility methods
  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'accent';
      case 'VIEWED': return 'primary';
      case 'ACCEPTED': return 'primary';
      case 'REJECTED': return 'warn';
      case 'COMPLETED': return 'primary';
      default: return 'basic';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING': return 'schedule';
      case 'VIEWED': return 'visibility';
      case 'ACCEPTED': return 'check_circle';
      case 'REJECTED': return 'cancel';
      case 'COMPLETED': return 'done_all';
      default: return 'help';
    }
  }

  getApplicantInitials(application: AdminApplication): string {
    if (!application.workerName) return '??';
    const names = application.workerName.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0].substring(0, 2).toUpperCase();
  }

  formatDate(date: string | Date): string {
    if (!date) return 'Not specified';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDateOnly(date: string | Date): string {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString();
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  getProcessingTime(application: AdminApplication): number {
    if (!application.appliedAt || !application.statusUpdatedAt) return 0;
    const applied = new Date(application.appliedAt);
    const updated = new Date(application.statusUpdatedAt);
    return Math.ceil((updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
  }

  getPriorityLevel(application: AdminApplication): string {
    const processingTime = this.getProcessingTime(application);
    if (processingTime > 7) return 'high';
    if (processingTime > 3) return 'medium';
    return 'low';
  }

  getPriorityColor(level: string): string {
    switch (level) {
      case 'high': return 'warn';
      case 'medium': return 'accent';
      case 'low': return 'primary';
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
    this.loadApplications();
    this.loadApplicationStats();
    this.snackBar.open('Data refreshed', 'Close', { duration: 2000 });
  }
}
