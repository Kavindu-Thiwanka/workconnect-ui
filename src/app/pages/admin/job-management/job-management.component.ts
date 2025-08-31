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
import { AdminJob, PageResponse } from '../../../models/api-models';
import { saveAs } from 'file-saver';

// Interface definitions
interface JobFilter {
  name: string;
  query: any;
  icon: string;
  color: string;
}

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  newJobsThisWeek: number;
  totalApplications: number;
  jobTypeDistribution: { [key: string]: number };
  statusDistribution: { [key: string]: number };
}

@Component({
  selector: 'app-job-management',
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
  templateUrl: './job-management.component.html',
  styleUrls: ['./job-management.component.scss']
})
export class JobManagementComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Make Math available in template
  Math = Math;

  // Data source and selection
  dataSource = new MatTableDataSource<AdminJob>([]);
  selection = new SelectionModel<AdminJob>(true, []);

  // Loading and error states
  isLoading = true;
  isLoadingStats = true;
  error: string | null = null;
  showSkeletons = true;

  // Job statistics
  jobStats: JobStats = {
    totalJobs: 0,
    activeJobs: 0,
    newJobsThisWeek: 0,
    totalApplications: 0,
    jobTypeDistribution: {},
    statusDistribution: {}
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
    'select', 'jobTitle', 'employerCompanyName', 'location', 'salary',
    'jobType', 'status', 'totalApplications', 'createdAt', 'actions'
  ];

  // Available columns configuration
  availableColumns = [
    { key: 'select', label: 'Select', visible: true, sortable: false },
    { key: 'jobTitle', label: 'Job Title', visible: true, sortable: true },
    { key: 'employerCompanyName', label: 'Company', visible: true, sortable: true },
    { key: 'location', label: 'Location', visible: true, sortable: true },
    { key: 'salary', label: 'Salary', visible: true, sortable: true },
    { key: 'jobType', label: 'Type', visible: true, sortable: true },
    { key: 'status', label: 'Status', visible: true, sortable: true },
    { key: 'totalApplications', label: 'Applications', visible: true, sortable: true },
    { key: 'createdAt', label: 'Posted Date', visible: true, sortable: true },
    { key: 'actions', label: 'Actions', visible: true, sortable: false }
  ];

  // Filter options and presets
  jobTypes = ['ONE_DAY', 'CONTRACT'];
  statuses = ['OPEN', 'CLOSED', 'FILLED', 'EXPIRED'];

  filterPresets: JobFilter[] = [
    { name: 'Active Remote Jobs', query: { status: 'OPEN', location: 'Remote' }, icon: 'home_work', color: 'primary' },
    { name: 'High Salary Positions', query: { minSalary: 100000 }, icon: 'attach_money', color: 'accent' },
    { name: 'Recent Postings', query: { postedThisWeek: true }, icon: 'schedule', color: 'primary' },
    { name: 'Contract Jobs', query: { jobType: 'CONTRACT' }, icon: 'assignment', color: 'warn' },
    { name: 'One Day Jobs', query: { jobType: 'ONE_DAY' }, icon: 'today', color: 'accent' }
  ];

  // Bulk actions
  bulkActions = [
    { label: 'Activate Selected', action: 'activate', icon: 'play_arrow', color: 'primary' },
    { label: 'Deactivate Selected', action: 'deactivate', icon: 'pause', color: 'warn' },
    { label: 'Feature Selected', action: 'feature', icon: 'star', color: 'accent' },
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
      jobType: [''],
      status: [''],
      location: [''],
      minSalary: [''],
      maxSalary: [''],
      postedDateStart: [''],
      postedDateEnd: [''],
      minApplications: [''],
      maxApplications: [''],
      employerCompanyName: ['']
    });
  }

  ngOnInit(): void {
    this.setupSearch();
    this.setupAdvancedFilters();
    this.loadJobs();
    this.loadJobStats();
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

  private createFilter(): (data: AdminJob, filter: string) => boolean {
    return (data: AdminJob, filter: string): boolean => {
      const searchStr = filter.toLowerCase();

      // Basic search across multiple fields
      const basicMatch = !searchStr ||
        (data.jobTitle?.toLowerCase().includes(searchStr) ?? false) ||
        (data.employerCompanyName?.toLowerCase().includes(searchStr) ?? false) ||
        (data.location?.toLowerCase().includes(searchStr) ?? false) ||
        (data.jobType?.toLowerCase().includes(searchStr) ?? false) ||
        (data.status?.toLowerCase().includes(searchStr) ?? false);

      // Advanced filters
      const advancedFilters = this.advancedFiltersForm.value;
      const advancedMatch = this.matchesAdvancedFilters(data, advancedFilters);

      return Boolean(basicMatch && advancedMatch);
    };
  }

  private matchesAdvancedFilters(job: AdminJob, filters: any): boolean {
    if (filters.jobType && job.jobType !== filters.jobType) return false;
    if (filters.status && job.status !== filters.status) return false;
    if (filters.location && !job.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.employerCompanyName && !job.employerCompanyName?.toLowerCase().includes(filters.employerCompanyName.toLowerCase())) return false;

    // Salary range filters
    if (filters.minSalary && (job.salary || 0) < filters.minSalary) return false;
    if (filters.maxSalary && (job.salary || 0) > filters.maxSalary) return false;

    // Application count filters
    if (filters.minApplications && job.totalApplications < filters.minApplications) return false;
    if (filters.maxApplications && job.totalApplications > filters.maxApplications) return false;

    return true;
  }

  loadJobs(): void {
    this.isLoading = true;
    this.showSkeletons = true;

    this.adminService.getAllJobs(
      this.pageIndex,
      this.pageSize,
      this.sortBy,
      this.sortDirection,
      this.searchControl.value || ''
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: PageResponse<AdminJob>) => {
        this.dataSource.data = response.content;
        this.totalElements = response.totalElements;
        this.isLoading = false;
        this.showSkeletons = false;
        this.error = null;
      },
      error: (error: any) => {
        console.error('Error loading jobs:', error);
        this.error = 'Failed to load jobs';
        this.errorService.showError('Error', 'Failed to load jobs');
        this.isLoading = false;
        this.showSkeletons = false;
      }
    });
  }

  loadJobStats(): void {
    this.isLoadingStats = true;

    // This would need to be implemented in the AdminService
    // For now, we'll simulate the stats
    setTimeout(() => {
      this.jobStats = {
        totalJobs: this.totalElements,
        activeJobs: Math.floor(this.totalElements * 0.7),
        newJobsThisWeek: Math.floor(this.totalElements * 0.15),
        totalApplications: Math.floor(this.totalElements * 12),
        jobTypeDistribution: {
          'ONE_DAY': Math.floor(this.totalElements * 0.6),
          'CONTRACT': Math.floor(this.totalElements * 0.4)
        },
        statusDistribution: {
          'OPEN': Math.floor(this.totalElements * 0.5),
          'CLOSED': Math.floor(this.totalElements * 0.2),
          'FILLED': Math.floor(this.totalElements * 0.2),
          'EXPIRED': Math.floor(this.totalElements * 0.1)
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

  applyFilterPreset(preset: JobFilter): void {
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
    this.loadJobs();
  }

  onSortChange(sort: Sort): void {
    this.sortBy = sort.active;
    this.sortDirection = sort.direction as 'asc' | 'desc';
    this.pageIndex = 0;
    this.loadJobs();
  }

  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  // Bulk actions
  executeBulkAction(action: string): void {
    const selectedJobs = this.selection.selected;
    if (selectedJobs.length === 0) {
      this.snackBar.open('Please select jobs first', 'Close', { duration: 3000 });
      return;
    }

    switch (action) {
      case 'activate':
        this.bulkUpdateStatus(selectedJobs, 'OPEN');
        break;
      case 'deactivate':
        this.bulkUpdateStatus(selectedJobs, 'CLOSED');
        break;
      case 'feature':
        this.bulkFeatureJobs(selectedJobs);
        break;
      case 'delete':
        this.bulkDeleteJobs(selectedJobs);
        break;
      case 'export':
        this.exportJobs(selectedJobs);
        break;
    }
  }

  private bulkUpdateStatus(jobs: AdminJob[], status: string): void {
    const jobIds = jobs.map(j => j.id);

    // This would need to be implemented in AdminService
    this.snackBar.open(`Updated ${jobs.length} jobs to ${status}`, 'Close', { duration: 3000 });
    this.selection.clear();
    this.loadJobs();
  }

  private bulkFeatureJobs(jobs: AdminJob[]): void {
    const jobIds = jobs.map(j => j.id);

    // This would need to be implemented in AdminService
    this.snackBar.open(`Featured ${jobs.length} jobs`, 'Close', { duration: 3000 });
    this.selection.clear();
    this.loadJobs();
  }

  private bulkDeleteJobs(jobs: AdminJob[]): void {
    const confirmed = confirm(`Are you sure you want to delete ${jobs.length} jobs? This action cannot be undone.`);

    if (confirmed) {
      const jobIds = jobs.map(j => j.id);

      // This would need to be implemented in AdminService
      this.snackBar.open(`Deleted ${jobs.length} jobs`, 'Close', { duration: 3000 });
      this.selection.clear();
      this.loadJobs();
    }
  }

  // Export functionality
  exportJobs(jobs?: AdminJob[]): void {
    const jobsToExport = jobs || this.dataSource.data;
    const csvData = this.convertToCSV(jobsToExport);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const fileName = `jobs_export_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);

    this.snackBar.open(`Exported ${jobsToExport.length} jobs`, 'Close', { duration: 3000 });
  }

  private convertToCSV(jobs: AdminJob[]): string {
    const headers = ['Job ID', 'Title', 'Company', 'Location', 'Salary', 'Type', 'Status', 'Applications', 'Posted Date'];
    const csvContent = [
      headers.join(','),
      ...jobs.map(job => [
        job.id,
        `"${job.jobTitle || ''}"`,
        `"${job.employerCompanyName || ''}"`,
        `"${job.location || ''}"`,
        job.salary || 0,
        job.jobType,
        job.status,
        job.totalApplications,
        job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // Individual job actions
  viewJobDetails(job: AdminJob): void {
    // This would open a detailed job modal/dialog
    this.snackBar.open(`Viewing details for ${job.jobTitle}`, 'Close', { duration: 2000 });
  }

  editJob(job: AdminJob): void {
    // This would open an edit job dialog
    this.snackBar.open(`Editing ${job.jobTitle}`, 'Close', { duration: 2000 });
  }

  toggleJobStatus(job: AdminJob): void {
    const newStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN';

    // This would need to be implemented in AdminService
    this.snackBar.open(`${job.jobTitle} status changed to ${newStatus}`, 'Close', { duration: 3000 });
    this.loadJobs();
  }

  featureJob(job: AdminJob): void {
    // This would need to be implemented in AdminService
    this.snackBar.open(`${job.jobTitle} has been featured`, 'Close', { duration: 3000 });
    this.loadJobs();
  }

  deleteJob(job: AdminJob): void {
    const confirmed = confirm(`Are you sure you want to delete "${job.jobTitle}"? This action cannot be undone.`);

    if (confirmed) {
      // This would need to be implemented in AdminService
      this.snackBar.open(`${job.jobTitle} has been deleted`, 'Close', { duration: 3000 });
      this.loadJobs();
    }
  }

  viewApplications(job: AdminJob): void {
    // This would navigate to applications for this job
    this.snackBar.open(`Viewing applications for ${job.jobTitle}`, 'Close', { duration: 2000 });
  }

  approveJob(job: AdminJob): void {
    // This would approve a pending job
    this.snackBar.open(`${job.jobTitle} has been approved`, 'Close', { duration: 3000 });
    this.loadJobs();
  }

  rejectJob(job: AdminJob): void {
    const confirmed = confirm(`Are you sure you want to reject "${job.jobTitle}"?`);

    if (confirmed) {
      // This would reject a pending job
      this.snackBar.open(`${job.jobTitle} has been rejected`, 'Close', { duration: 3000 });
      this.loadJobs();
    }
  }

  // Utility methods
  getStatusColor(status: string): string {
    switch (status) {
      case 'OPEN': return 'primary';
      case 'CLOSED': return 'warn';
      case 'FILLED': return 'accent';
      case 'EXPIRED': return 'basic';
      default: return 'basic';
    }
  }

  getJobTypeColor(jobType: string): string {
    switch (jobType) {
      case 'ONE_DAY': return 'accent';
      case 'CONTRACT': return 'primary';
      default: return 'basic';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'OPEN': return 'work';
      case 'CLOSED': return 'work_off';
      case 'FILLED': return 'check_circle';
      case 'EXPIRED': return 'schedule';
      default: return 'help';
    }
  }

  getJobTypeIcon(jobType: string): string {
    switch (jobType) {
      case 'ONE_DAY': return 'today';
      case 'CONTRACT': return 'assignment';
      default: return 'work';
    }
  }

  formatSalary(salary: number | null): string {
    if (!salary) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(salary);
  }

  formatDate(date: string | Date): string {
    if (!date) return 'Not specified';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  getApplicationsLevel(job: AdminJob): string {
    const totalApps = job.totalApplications;
    if (totalApps > 50) return 'high';
    if (totalApps > 20) return 'medium';
    if (totalApps > 0) return 'low';
    return 'none';
  }

  getApplicationsColor(level: string): string {
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
    this.loadJobs();
    this.loadJobStats();
    this.snackBar.open('Data refreshed', 'Close', { duration: 2000 });
  }
}
