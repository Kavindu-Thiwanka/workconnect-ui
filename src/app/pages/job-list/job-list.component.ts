import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../services/job.service';
import { Observable, map, combineLatest, BehaviorSubject, catchError, of, startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss']
})
export class JobListComponent implements OnInit {
  jobs$!: Observable<any[]>;
  filteredJobs: any[] = [];
  searchTerm: string = '';
  locationFilter: string = '';
  jobTypeFilter: string = '';
  tradeFilter: string = '';
  viewMode: 'grid' | 'list' = 'grid';
  isLoading: boolean = true;

  private searchSubject = new BehaviorSubject<string>('');
  private locationSubject = new BehaviorSubject<string>('');
  private jobTypeSubject = new BehaviorSubject<string>('');
  private tradeSubject = new BehaviorSubject<string>('');

  constructor(private jobService: JobService) {
    // Initialize subjects with current values
    this.searchSubject.next(this.searchTerm);
    this.locationSubject.next(this.locationFilter);
    this.jobTypeSubject.next(this.jobTypeFilter);
    this.tradeSubject.next(this.tradeFilter);
  }

  ngOnInit(): void {
    this.jobs$ = this.jobService.getOpenJobs().pipe(
      catchError(error => {
        console.error('Error fetching jobs:', error);
        return of([]); // Return empty array on error
      }),
      startWith([]) // Start with empty array while loading
    );

    // Subscribe to jobs and apply filters
    combineLatest([
      this.jobs$,
      this.searchSubject,
      this.locationSubject,
      this.jobTypeSubject,
      this.tradeSubject
    ]).pipe(
      map(([jobs, search, location, jobType, trade]) => {
        console.log('Applying filters:', { search, location, jobType, trade, jobsCount: jobs?.length });
        return this.applyFilters(jobs, search, location, jobType, trade);
      }),
      catchError(error => {
        console.error('Error in filter pipeline:', error);
        return of([]); // Return empty array on error
      })
    ).subscribe({
      next: (filteredJobs) => {
        console.log('Filtered jobs result:', filteredJobs?.length);
        this.filteredJobs = filteredJobs || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error in subscription:', error);
        this.filteredJobs = [];
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    console.log('Search triggered:', this.searchTerm);
    this.searchSubject.next(this.searchTerm);
  }

  onFilter(): void {
    console.log('Filter triggered:', {
      location: this.locationFilter,
      jobType: this.jobTypeFilter,
      trade: this.tradeFilter
    });
    this.locationSubject.next(this.locationFilter);
    this.jobTypeSubject.next(this.jobTypeFilter);
    this.tradeSubject.next(this.tradeFilter);
  }

  // Combined method to trigger all filters at once
  triggerAllFilters(): void {
    this.searchSubject.next(this.searchTerm);
    this.locationSubject.next(this.locationFilter);
    this.jobTypeSubject.next(this.jobTypeFilter);
    this.tradeSubject.next(this.tradeFilter);
  }

  clearFilters(): void {
    console.log('Clearing all filters');
    this.searchTerm = '';
    this.locationFilter = '';
    this.jobTypeFilter = '';
    this.tradeFilter = '';

    // Trigger all subjects to clear filters
    this.searchSubject.next('');
    this.locationSubject.next('');
    this.jobTypeSubject.next('');
    this.tradeSubject.next('');
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  applyToJob(jobId: number): void {
    this.jobService.applyForJob(jobId.toString()).subscribe({
      next: () => {
        console.log('Application submitted successfully');
        // Update the job to show as applied
        this.filteredJobs = this.filteredJobs.map(job =>
          job.id === jobId ? { ...job, hasApplied: true } : job
        );
      },
      error: (err: any) => {
        console.error('Failed to apply to job', err);
      }
    });
  }

  toggleBookmark(jobId: number): void {
    console.log('Toggle bookmark for job:', jobId);
  }

  shareJob(job: any): void {
    if (navigator.share) {
      navigator.share({
        title: job.jobTitle,
        text: `Check out this ${job.trade || 'job'} opportunity at ${job.employerCompanyName}`,
        url: window.location.origin + `/jobs/${job.id}`
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/jobs/${job.id}`);
      console.log('Job link copied to clipboard');
    }
  }

  reportJob(jobId: number): void {
    console.log('Report job:', jobId);
  }

  getJobTypeDisplay(jobType: string): string {
    const typeMap: { [key: string]: string } = {
      'ONE_DAY': 'One Day',
      'CONTRACT': 'Contract',
      'PART_TIME': 'Part Time',
      'FULL_TIME': 'Full Time'
    };
    return typeMap[jobType] || jobType;
  }

  getPayPeriod(jobType: string): string {
    const periodMap: { [key: string]: string } = {
      'ONE_DAY': 'day',
      'CONTRACT': 'project',
      'PART_TIME': 'hour',
      'FULL_TIME': 'hour'
    };
    return periodMap[jobType] || 'hour';
  }

  getSkillsArray(skills: string | string[]): string[] {
    if (Array.isArray(skills)) {
      return skills;
    }
    return skills ? skills.split(',').map(s => s.trim()) : [];
  }

  trackByJobId(index: number, job: any): any {
    return job ? job.id : index;
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.locationFilter || this.jobTypeFilter || this.tradeFilter);
  }

  getFilterSummary(): string {
    const filters = [];
    if (this.searchTerm) filters.push(`search: "${this.searchTerm}"`);
    if (this.locationFilter) filters.push(`location: "${this.locationFilter}"`);
    if (this.jobTypeFilter) filters.push(`type: "${this.getJobTypeDisplay(this.jobTypeFilter)}"`);
    if (this.tradeFilter) filters.push(`trade: "${this.tradeFilter}"`);
    return filters.join(', ');
  }

  private applyFilters(jobs: any[], search: string, location: string, jobType: string, trade: string): any[] {
    if (!jobs || !Array.isArray(jobs)) {
      console.warn('Invalid jobs array provided to applyFilters');
      return [];
    }

    const filteredJobs = jobs.filter(job => {
      if (!job) return false;

      // Search filter - check multiple fields
      const searchTerm = search?.trim().toLowerCase() || '';
      const matchesSearch = !searchTerm || [
        job.jobTitle,
        job.employerCompanyName,
        job.description,
        job.trade,
        job.skills
      ].some(field =>
        field && field.toString().toLowerCase().includes(searchTerm)
      );

      // Location filter - flexible matching
      const locationTerm = location?.trim().toLowerCase() || '';
      const matchesLocation = !locationTerm ||
        (job.location && job.location.toLowerCase().includes(locationTerm));

      // Job type filter - exact match
      const matchesJobType = !jobType ||
        (job.jobType && job.jobType === jobType);

      // Trade filter - exact match
      const matchesTrade = !trade ||
        (job.trade && job.trade === trade);

      const matches = matchesSearch && matchesLocation && matchesJobType && matchesTrade;

      if (search || location || jobType || trade) {
        console.log(`Job ${job.id}: search=${matchesSearch}, location=${matchesLocation}, type=${matchesJobType}, trade=${matchesTrade}, overall=${matches}`);
      }

      return matches;
    });

    console.log(`Filtered ${filteredJobs.length} jobs from ${jobs.length} total`);
    return filteredJobs;
  }
}
