import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
import { Subject, takeUntil, debounceTime, distinctUntilChanged, forkJoin, catchError, of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { DashboardService } from '../../../services/dashboard.service';
import { ProfileService } from '../../../services/profile.service';
import { ErrorService } from '../../../services/error.service';
import { LoadingService } from '../../../services/loading.service';
import {
  EmployerDashboardStats,
  Job,
  JobApplication,
  EmployerProfile,
  PageResponse
} from '../../../models/api-models';
import { saveAs } from 'file-saver';

// Interface definitions
interface JobFilter {
  name: string;
  query: any;
  icon: string;
  color: string;
}

interface EmployerAnalytics {
  jobPostingTrends: { [key: string]: number };
  applicationConversionRates: { [key: string]: number };
  hiringFunnelData: { [key: string]: number };
  timeToHireMetrics: { [key: string]: number };
  topPerformingJobs: Job[];
  recruitmentEffectiveness: { [key: string]: number };
}

@Component({
  selector: 'app-employer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
  templateUrl: './employer-dashboard.component.html',
  styleUrls: ['./employer-dashboard.component.scss']
})
export class EmployerDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Make Math available in template
  Math = Math;

  // Data source and selection
  jobsDataSource = new MatTableDataSource<Job>([]);
  applicationsDataSource = new MatTableDataSource<JobApplication>([]);
  jobSelection = new SelectionModel<Job>(true, []);
  applicationSelection = new SelectionModel<JobApplication>(true, []);

  // Loading and error states
  isLoading = true;
  isLoadingStats = true;
  isLoadingJobs = false;
  isLoadingApplications = false;
  error: string | null = null;
  showSkeletons = true;

  // Dashboard data
  employerStats: EmployerDashboardStats | null = null;
  employerProfile: EmployerProfile | null = null;
  employerAnalytics: EmployerAnalytics | null = null;
  activeJobs: Job[] = [];
  recentApplications: JobApplication[] = [];

  // Pagination
  jobsTotalElements = 0;
  applicationsTotalElements = 0;
  jobsPageSize = 10;
  applicationsPageSize = 10;
  jobsPageIndex = 0;
  applicationsPageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // Search and filters
  jobSearchControl = new FormControl('');
  applicationSearchControl = new FormControl('');
  jobFiltersForm!: FormGroup;
  applicationFiltersForm!: FormGroup;
  showJobFilters = false;
  showApplicationFilters = false;

  // Table configuration
  jobsDisplayedColumns: string[] = [
    'select', 'jobTitle', 'status', 'applicationCount', 'createdAt', 'expiryDate', 'actions'
  ];

  applicationsDisplayedColumns: string[] = [
    'select', 'applicant', 'jobTitle', 'status', 'appliedAt', 'actions'
  ];

  // Filter presets
  jobFilterPresets: JobFilter[] = [
    { name: 'Active Jobs', query: { status: 'ACTIVE' }, icon: 'work', color: 'primary' },
    { name: 'Expiring Soon', query: { expiringSoon: true }, icon: 'schedule', color: 'warn' },
    { name: 'High Applications', query: { highApplications: true }, icon: 'trending_up', color: 'accent' },
    { name: 'Recent Posts', query: { recentPosts: true }, icon: 'new_releases', color: 'primary' }
  ];

  applicationFilterPresets: JobFilter[] = [
    { name: 'Pending Review', query: { status: 'PENDING' }, icon: 'schedule', color: 'accent' },
    { name: 'New Applications', query: { newApplications: true }, icon: 'fiber_new', color: 'primary' },
    { name: 'Shortlisted', query: { status: 'SHORTLISTED' }, icon: 'star', color: 'primary' },
    { name: 'Interviewed', query: { status: 'INTERVIEWED' }, icon: 'record_voice_over', color: 'accent' }
  ];

  // Bulk actions
  jobBulkActions = [
    { label: 'Activate Selected', action: 'activate', icon: 'play_arrow', color: 'primary' },
    { label: 'Deactivate Selected', action: 'deactivate', icon: 'pause', color: 'warn' },
    { label: 'Feature Selected', action: 'feature', icon: 'star', color: 'accent' },
    { label: 'Delete Selected', action: 'delete', icon: 'delete', color: 'warn' },
    { label: 'Export Selected', action: 'export', icon: 'download', color: 'accent' }
  ];

  applicationBulkActions = [
    { label: 'Mark as Reviewed', action: 'reviewed', icon: 'visibility', color: 'primary' },
    { label: 'Shortlist Selected', action: 'shortlist', icon: 'star', color: 'accent' },
    { label: 'Schedule Interviews', action: 'interview', icon: 'event', color: 'primary' },
    { label: 'Reject Selected', action: 'reject', icon: 'cancel', color: 'warn' },
    { label: 'Export Selected', action: 'export', icon: 'download', color: 'accent' }
  ];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private profileService: ProfileService,
    private errorService: ErrorService,
    private loadingService: LoadingService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.jobFiltersForm = this.fb.group({
      status: [''],
      jobType: [''],
      location: [''],
      salaryMin: [''],
      salaryMax: [''],
      createdDateStart: [''],
      createdDateEnd: [''],
      deadlineStart: [''],
      deadlineEnd: ['']
    });

    this.applicationFiltersForm = this.fb.group({
      status: [''],
      jobTitle: [''],
      appliedDateStart: [''],
      appliedDateEnd: [''],
      workerName: ['']
    });
  }

  ngOnInit(): void {
    this.setupSearch();
    this.setupFilters();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.jobsDataSource.paginator = this.paginator;
    this.jobsDataSource.sort = this.sort;

    // Setup custom filter predicates
    this.jobsDataSource.filterPredicate = this.createJobFilter();
    this.applicationsDataSource.filterPredicate = this.createApplicationFilter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    // Job search
    this.jobSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.applyJobFilter(searchTerm || '');
      });

    // Application search
    this.applicationSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.applyApplicationFilter(searchTerm || '');
      });
  }

  private setupFilters(): void {
    this.jobFiltersForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyJobAdvancedFilters();
      });

    this.applicationFiltersForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyApplicationAdvancedFilters();
      });
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.isLoadingStats = true;

    forkJoin({
      stats: this.dashboardService.getEmployerDashboard().pipe(
        catchError(error => {
          console.error('Error loading employer stats:', error);
          return of(null);
        })
      ),
      profile: this.profileService.getEmployerProfile().pipe(
        catchError(error => {
          console.error('Error loading employer profile:', error);
          return of(null);
        })
      )
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ stats, profile }) => {
        this.employerStats = stats;
        this.employerProfile = profile;

        if (stats) {
          this.activeJobs = stats.activeJobPostings || [];
          this.recentApplications = stats.recentApplications || [];
          this.jobsDataSource.data = this.activeJobs;
          this.applicationsDataSource.data = this.recentApplications;
        }

        this.loadAnalytics();
        this.isLoading = false;
        this.isLoadingStats = false;
        this.showSkeletons = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.errorService.showError('Error', 'Failed to load dashboard data');
        this.isLoading = false;
        this.isLoadingStats = false;
        this.showSkeletons = false;
      }
    });
  }

  private loadAnalytics(): void {
    // Simulate analytics data - in real app, this would come from API
    setTimeout(() => {
      this.employerAnalytics = {
        jobPostingTrends: {
          'Jan': 12,
          'Feb': 15,
          'Mar': 18,
          'Apr': 22,
          'May': 25,
          'Jun': 20
        },
        applicationConversionRates: {
          'Applied': 100,
          'Reviewed': 75,
          'Shortlisted': 45,
          'Interviewed': 25,
          'Hired': 12
        },
        hiringFunnelData: {
          'Applications': 450,
          'Reviewed': 320,
          'Shortlisted': 180,
          'Interviewed': 95,
          'Offers': 45,
          'Hired': 32
        },
        timeToHireMetrics: {
          'Average': 18,
          'Fastest': 7,
          'Slowest': 45
        },
        topPerformingJobs: this.activeJobs.slice(0, 5),
        recruitmentEffectiveness: {
          'Job Board': 45,
          'Referrals': 30,
          'Social Media': 15,
          'Direct': 10
        }
      };
    }, 1500);
  }

  private createJobFilter(): (data: Job, filter: string) => boolean {
    return (data: Job, filter: string): boolean => {
      const searchStr = filter.toLowerCase();

      // Basic search across multiple fields
      const basicMatch = !searchStr ||
        (data.jobTitle?.toLowerCase().includes(searchStr) ?? false) ||
        (data.location?.toLowerCase().includes(searchStr) ?? false) ||
        (data.status?.toLowerCase().includes(searchStr) ?? false);

      // Advanced filters
      const advancedFilters = this.jobFiltersForm.value;
      const advancedMatch = this.matchesJobAdvancedFilters(data, advancedFilters);

      return Boolean(basicMatch && advancedMatch);
    };
  }

  private createApplicationFilter(): (data: JobApplication, filter: string) => boolean {
    return (data: JobApplication, filter: string): boolean => {
      const searchStr = filter.toLowerCase();

      // Basic search across multiple fields
      const basicMatch = !searchStr ||
        (data.job?.jobTitle?.toLowerCase().includes(searchStr) ?? false) ||
        (data.worker?.firstName?.toLowerCase().includes(searchStr) ?? false) ||
        (data.worker?.lastName?.toLowerCase().includes(searchStr) ?? false) ||
        (data.status?.toLowerCase().includes(searchStr) ?? false);

      // Advanced filters
      const advancedFilters = this.applicationFiltersForm.value;
      const advancedMatch = this.matchesApplicationAdvancedFilters(data, advancedFilters);

      return Boolean(basicMatch && advancedMatch);
    };
  }

  private matchesJobAdvancedFilters(job: Job, filters: any): boolean {
    if (filters.status && job.status !== filters.status) return false;
    if (filters.jobType && job.jobType !== filters.jobType) return false;
    if (filters.location && !job.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;

    // Salary range filters
    if (filters.salaryMin && (job.salary || 0) < filters.salaryMin) return false;
    if (filters.salaryMax && (job.salary || 0) > filters.salaryMax) return false;

    return true;
  }

  private matchesApplicationAdvancedFilters(application: JobApplication, filters: any): boolean {
    if (filters.status && application.status !== filters.status) return false;
    if (filters.jobTitle && !application.job?.jobTitle?.toLowerCase().includes(filters.jobTitle.toLowerCase())) return false;
    if (filters.workerName && !`${application.worker?.firstName} ${application.worker?.lastName}`.toLowerCase().includes(filters.workerName.toLowerCase())) return false;

    return true;
  }

  // Filter methods
  applyJobFilter(filterValue: string): void {
    this.jobsDataSource.filter = filterValue.trim().toLowerCase();

    if (this.jobsDataSource.paginator) {
      this.jobsDataSource.paginator.firstPage();
    }
  }

  applyApplicationFilter(filterValue: string): void {
    this.applicationsDataSource.filter = filterValue.trim().toLowerCase();

    if (this.applicationsDataSource.paginator) {
      this.applicationsDataSource.paginator.firstPage();
    }
  }

  applyJobAdvancedFilters(): void {
    this.jobsDataSource.filter = JSON.stringify(this.jobFiltersForm.value);

    if (this.jobsDataSource.paginator) {
      this.jobsDataSource.paginator.firstPage();
    }
  }

  applyApplicationAdvancedFilters(): void {
    this.applicationsDataSource.filter = JSON.stringify(this.applicationFiltersForm.value);

    if (this.applicationsDataSource.paginator) {
      this.applicationsDataSource.paginator.firstPage();
    }
  }

  applyJobFilterPreset(preset: JobFilter): void {
    this.jobFiltersForm.reset();

    Object.keys(preset.query).forEach(key => {
      if (this.jobFiltersForm.get(key)) {
        this.jobFiltersForm.get(key)?.setValue(preset.query[key]);
      }
    });

    this.showJobFilters = true;
    this.snackBar.open(`Applied filter: ${preset.name}`, 'Close', { duration: 3000 });
  }

  applyApplicationFilterPreset(preset: JobFilter): void {
    this.applicationFiltersForm.reset();

    Object.keys(preset.query).forEach(key => {
      if (this.applicationFiltersForm.get(key)) {
        this.applicationFiltersForm.get(key)?.setValue(preset.query[key]);
      }
    });

    this.showApplicationFilters = true;
    this.snackBar.open(`Applied filter: ${preset.name}`, 'Close', { duration: 3000 });
  }

  clearJobFilters(): void {
    this.jobSearchControl.setValue('');
    this.jobFiltersForm.reset();
    this.jobsDataSource.filter = '';
    this.showJobFilters = false;
  }

  clearApplicationFilters(): void {
    this.applicationSearchControl.setValue('');
    this.applicationFiltersForm.reset();
    this.applicationsDataSource.filter = '';
    this.showApplicationFilters = false;
  }

  // Selection methods
  isAllJobsSelected(): boolean {
    const numSelected = this.jobSelection.selected.length;
    const numRows = this.jobsDataSource.data.length;
    return numSelected === numRows;
  }

  isAllApplicationsSelected(): boolean {
    const numSelected = this.applicationSelection.selected.length;
    const numRows = this.applicationsDataSource.data.length;
    return numSelected === numRows;
  }

  masterJobToggle(): void {
    this.isAllJobsSelected() ?
      this.jobSelection.clear() :
      this.jobsDataSource.data.forEach(row => this.jobSelection.select(row));
  }

  masterApplicationToggle(): void {
    this.isAllApplicationsSelected() ?
      this.applicationSelection.clear() :
      this.applicationsDataSource.data.forEach(row => this.applicationSelection.select(row));
  }

  getSelectedJobsCount(): number {
    return this.jobSelection.selected.length;
  }

  getSelectedApplicationsCount(): number {
    return this.applicationSelection.selected.length;
  }

  // Bulk actions
  executeJobBulkAction(action: string): void {
    const selectedJobs = this.jobSelection.selected;
    if (selectedJobs.length === 0) {
      this.snackBar.open('Please select jobs first', 'Close', { duration: 3000 });
      return;
    }

    switch (action) {
      case 'activate':
        this.bulkUpdateJobStatus(selectedJobs, 'ACTIVE');
        break;
      case 'deactivate':
        this.bulkUpdateJobStatus(selectedJobs, 'CLOSED');
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

  executeApplicationBulkAction(action: string): void {
    const selectedApplications = this.applicationSelection.selected;
    if (selectedApplications.length === 0) {
      this.snackBar.open('Please select applications first', 'Close', { duration: 3000 });
      return;
    }

    switch (action) {
      case 'reviewed':
        this.bulkUpdateApplicationStatus(selectedApplications, 'REVIEWED');
        break;
      case 'shortlist':
        this.bulkUpdateApplicationStatus(selectedApplications, 'SHORTLISTED');
        break;
      case 'interview':
        this.bulkScheduleInterviews(selectedApplications);
        break;
      case 'reject':
        this.bulkUpdateApplicationStatus(selectedApplications, 'REJECTED');
        break;
      case 'export':
        this.exportApplications(selectedApplications);
        break;
    }
  }

  private bulkUpdateJobStatus(jobs: Job[], status: string): void {
    // This would need to be implemented in the service
    this.snackBar.open(`Updated ${jobs.length} jobs to ${status}`, 'Close', { duration: 3000 });
    this.jobSelection.clear();
    this.loadDashboardData();
  }

  private bulkFeatureJobs(jobs: Job[]): void {
    // This would need to be implemented in the service
    this.snackBar.open(`Featured ${jobs.length} jobs`, 'Close', { duration: 3000 });
    this.jobSelection.clear();
    this.loadDashboardData();
  }

  private bulkDeleteJobs(jobs: Job[]): void {
    const confirmed = confirm(`Are you sure you want to delete ${jobs.length} jobs? This action cannot be undone.`);

    if (confirmed) {
      // This would need to be implemented in the service
      this.snackBar.open(`Deleted ${jobs.length} jobs`, 'Close', { duration: 3000 });
      this.jobSelection.clear();
      this.loadDashboardData();
    }
  }

  private bulkUpdateApplicationStatus(applications: JobApplication[], status: string): void {
    // This would need to be implemented in the service
    this.snackBar.open(`Updated ${applications.length} applications to ${status}`, 'Close', { duration: 3000 });
    this.applicationSelection.clear();
    this.loadDashboardData();
  }

  private bulkScheduleInterviews(applications: JobApplication[]): void {
    // This would open interview scheduling dialog
    this.snackBar.open(`Scheduling interviews for ${applications.length} applications`, 'Close', { duration: 3000 });
    this.applicationSelection.clear();
  }

  // Export functionality
  exportJobs(jobs?: Job[]): void {
    const jobsToExport = jobs || this.jobsDataSource.data;
    const csvData = this.convertJobsToCSV(jobsToExport);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const fileName = `jobs_export_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);

    this.snackBar.open(`Exported ${jobsToExport.length} jobs`, 'Close', { duration: 3000 });
  }

  exportApplications(applications?: JobApplication[]): void {
    const applicationsToExport = applications || this.applicationsDataSource.data;
    const csvData = this.convertApplicationsToCSV(applicationsToExport);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const fileName = `applications_export_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);

    this.snackBar.open(`Exported ${applicationsToExport.length} applications`, 'Close', { duration: 3000 });
  }

  private convertJobsToCSV(jobs: Job[]): string {
    const headers = ['Job ID', 'Title', 'Status', 'Location', 'Salary', 'Applications', 'Posted Date', 'Deadline'];
    const csvContent = [
      headers.join(','),
      ...jobs.map(job => [
        job.id,
        `"${job.jobTitle || ''}"`,
        job.status,
        `"${job.location || ''}"`,
        job.salary || 0,
        job.applicationCount || 0,
        job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '',
        job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  private convertApplicationsToCSV(applications: JobApplication[]): string {
    const headers = ['Application ID', 'Applicant Name', 'Worker ID', 'Job Title', 'Status', 'Applied Date'];
    const csvContent = [
      headers.join(','),
      ...applications.map(app => [
        app.id,
        `"${this.getApplicantName(app.worker)}"`,
        app.worker?.id || '',
        `"${app.job?.jobTitle || ''}"`,
        app.status,
        app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // Individual job actions
  viewJob(job: Job): void {
    this.router.navigate(['/app/jobs', job.id]);
  }

  editJob(job: Job): void {
    this.router.navigate(['/app/jobs', job.id, 'edit']);
  }

  viewJobApplications(job: Job): void {
    this.router.navigate(['/app/employer/jobs', job.id, 'applications']);
  }

  toggleJobStatus(job: Job): void {
    const newStatus = job.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';

    // This would need to be implemented in the service
    this.snackBar.open(`${job.jobTitle} status changed to ${newStatus}`, 'Close', { duration: 3000 });
    this.loadDashboardData();
  }

  featureJob(job: Job): void {
    // This would need to be implemented in the service
    this.snackBar.open(`${job.jobTitle} has been featured`, 'Close', { duration: 3000 });
    this.loadDashboardData();
  }

  deleteJob(job: Job): void {
    const confirmed = confirm(`Are you sure you want to delete "${job.jobTitle}"? This action cannot be undone.`);

    if (confirmed) {
      // This would need to be implemented in the service
      this.snackBar.open(`${job.jobTitle} has been deleted`, 'Close', { duration: 3000 });
      this.loadDashboardData();
    }
  }

  // Individual application actions
  viewApplication(application: JobApplication): void {
    this.router.navigate(['/app/employer/applications', application.id]);
  }

  reviewApplication(application: JobApplication): void {
    this.router.navigate(['/app/employer/applications', application.id, 'review']);
  }

  viewApplicantProfile(application: JobApplication): void {
    this.router.navigate(['/app/profiles', application.worker?.id]);
  }

  contactApplicant(application: JobApplication): void {
    // Since WorkerProfile doesn't have email, we'll show a message that contact info is not available
    this.snackBar.open(`Contact information not available for ${this.getApplicantName(application.worker)}`, 'Close', { duration: 3000 });
  }

  scheduleInterview(application: JobApplication): void {
    // This would open interview scheduling dialog
    this.snackBar.open(`Scheduling interview with ${this.getApplicantName(application.worker)}`, 'Close', { duration: 2000 });
  }

  updateApplicationStatus(application: JobApplication, status: string): void {
    // This would need to be implemented in the service
    this.snackBar.open(`Application status updated to ${status}`, 'Close', { duration: 3000 });
    this.loadDashboardData();
  }

  downloadResume(application: JobApplication): void {
    if (application.resumeUrl) {
      window.open(application.resumeUrl, '_blank');
      this.snackBar.open(`Downloading resume for ${this.getApplicantName(application.worker)}`, 'Close', { duration: 2000 });
    } else {
      this.snackBar.open('No resume available for this application', 'Close', { duration: 3000 });
    }
  }

  // Navigation methods
  navigateToPostJob(): void {
    this.router.navigate(['/app/jobs/new']);
  }

  navigateToManageJobs(): void {
    this.router.navigate(['/app/employer/jobs']);
  }

  navigateToAnalytics(): void {
    this.router.navigate(['/app/employer/analytics']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/app/profile']);
  }

  // Utility methods
  getJobStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'primary';
      case 'CLOSED': return 'warn';
      case 'DRAFT': return 'accent';
      default: return 'basic';
    }
  }

  getJobStatusIcon(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'work';
      case 'CLOSED': return 'work_off';
      case 'DRAFT': return 'edit';
      default: return 'help';
    }
  }

  getApplicationStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'accent';
      case 'REVIEWED': return 'primary';
      case 'SHORTLISTED': return 'primary';
      case 'INTERVIEWED': return 'accent';
      case 'REJECTED': return 'warn';
      case 'HIRED': return 'primary';
      default: return 'basic';
    }
  }

  getApplicationStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING': return 'schedule';
      case 'REVIEWED': return 'visibility';
      case 'SHORTLISTED': return 'star';
      case 'INTERVIEWED': return 'record_voice_over';
      case 'REJECTED': return 'cancel';
      case 'HIRED': return 'check_circle';
      default: return 'help';
    }
  }

  getApplicantName(worker: any): string {
    if (!worker) return 'Unknown Applicant';
    return `${worker.firstName || ''} ${worker.lastName || ''}`.trim() || 'Unknown Applicant';
  }

  getApplicantInitials(worker: any): string {
    if (!worker) return '??';
    const firstName = worker.firstName || '';
    const lastName = worker.lastName || '';

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    return '??';
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

  formatDateOnly(date: string | Date): string {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString();
  }

  getTimeAgo(date: string | Date): string {
    if (!date) return 'Unknown';

    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}m ago`;
  }

  getDaysUntilExpiry(expiryDate: string | Date): number {
    if (!expiryDate) return 0;

    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffInMs = expiry.getTime() - now.getTime();
    return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  }

  isJobExpiringSoon(job: Job): boolean {
    if (!job.applicationDeadline) return false;
    return this.getDaysUntilExpiry(job.applicationDeadline) <= 7;
  }

  getJobPriorityLevel(job: Job): string {
    const daysUntilExpiry = job.applicationDeadline ? this.getDaysUntilExpiry(job.applicationDeadline) : 0;
    const applicationCount = job.applicationCount || 0;

    if (daysUntilExpiry <= 3 || applicationCount === 0) return 'high';
    if (daysUntilExpiry <= 7 || applicationCount < 5) return 'medium';
    return 'low';
  }

  getJobPriorityColor(level: string): string {
    switch (level) {
      case 'high': return 'warn';
      case 'medium': return 'accent';
      case 'low': return 'primary';
      default: return 'basic';
    }
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // Refresh functionality
  refreshData(): void {
    this.loadDashboardData();
    this.snackBar.open('Dashboard refreshed', 'Close', { duration: 2000 });
  }
}
