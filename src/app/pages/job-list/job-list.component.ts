import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../services/job.service';
import { JobListing } from '../../models/api-models';
import { BehaviorSubject, takeUntil } from 'rxjs';
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
export class JobListComponent implements OnInit, OnDestroy {
  jobs: JobListing[] = [];
  filteredJobs: JobListing[] = [];
  searchTerm: string = '';
  locationFilter: string = '';
  jobTypeFilter: string = '';
  tradeFilter: string = '';
  viewMode: 'grid' | 'list' = 'grid';
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';

  private destroy$ = new BehaviorSubject<void>(undefined);

  constructor(
    private jobService: JobService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadJobs(): Promise<void> {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    try {
      const jobs = await this.jobService.getOpenJobs().toPromise();
      this.jobs = jobs || [];
      this.isLoading = false;
      this.applyFilters();
    } catch (error) {
      console.error('Error fetching jobs:', error);
      this.hasError = true;
      this.isLoading = false;
      this.errorMessage = 'Failed to load jobs. Please try again later.';
      this.jobs = [];
    }
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilter(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.locationFilter = '';
    this.jobTypeFilter = '';
    this.tradeFilter = '';
    this.applyFilters();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  applyToJob(jobId: number): void {
    this.viewJobDetails(jobId);
  }

  viewJobDetails(jobId: number): void {
    this.router.navigate(['/app/jobs', jobId]);
  }

  toggleBookmark(jobId: number): void {
    // TODO: Implement bookmark functionality
    console.log('Toggle bookmark for job:', jobId);
  }

  shareJob(job: JobListing): void {
    if (navigator.share) {
      navigator.share({
        title: job.jobTitle,
        text: `Check out this job opportunity: ${job.jobTitle} at ${job.employerCompanyName}`,
        url: window.location.origin + `/app/jobs/${job.id}`
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/app/jobs/${job.id}`);
      console.log('Job link copied to clipboard');
    }
  }

  reportJob(jobId: number): void {
    // TODO: Implement job reporting functionality
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

  getTradeFromSkills(skills: string): string {
    if (!skills) return 'General';
    
    const skillsArray = this.getSkillsArray(skills);
    const tradeKeywords = {
      'CONSTRUCTION': ['construction', 'building', 'carpentry', 'masonry'],
      'PLUMBING': ['plumbing', 'pipe', 'water', 'drain'],
      'ELECTRICAL': ['electrical', 'wiring', 'electric', 'circuit'],
      'HVAC': ['hvac', 'heating', 'cooling', 'air conditioning'],
      'LANDSCAPING': ['landscaping', 'gardening', 'lawn', 'outdoor'],
      'PAINTING': ['painting', 'paint', 'brush', 'coating'],
      'ROOFING': ['roofing', 'roof', 'shingle', 'gutter'],
      'CLEANING': ['cleaning', 'janitorial', 'maintenance'],
      'MOVING': ['moving', 'transport', 'delivery', 'logistics'],
      'GENERAL_LABOR': ['general', 'labor', 'manual', 'physical']
    };

    for (const [trade, keywords] of Object.entries(tradeKeywords)) {
      if (keywords.some(keyword => 
        skillsArray.some(skill => 
          skill.toLowerCase().includes(keyword.toLowerCase())
        )
      )) {
        return trade.replace('_', ' ');
      }
    }
    
    return 'General';
  }

  trackByJobId(index: number, job: JobListing): number {
    return job ? job.id : index;
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.locationFilter || this.jobTypeFilter || this.tradeFilter);
  }

  retryLoadJobs(): void {
    this.loadJobs();
  }

  private applyFilters(): void {
    this.filteredJobs = this.filterJobs(this.jobs, this.searchTerm, this.locationFilter, this.jobTypeFilter, this.tradeFilter);
  }

  private filterJobs(jobs: JobListing[], search: string, location: string, jobType: string, trade: string): JobListing[] {
    if (!jobs || !Array.isArray(jobs)) {
      return [];
    }

    return jobs.filter(job => {
      if (!job) return false;

      // Search filter - check multiple fields
      const searchTerm = search?.trim().toLowerCase() || '';
      const matchesSearch = !searchTerm || [
        job.jobTitle,
        job.employerCompanyName,
        job.description,
        job.requiredSkills
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

      // Trade filter - check if skills contain the trade
      const matchesTrade = !trade ||
        (job.requiredSkills && job.requiredSkills.toLowerCase().includes(trade.toLowerCase()));

      return matchesSearch && matchesLocation && matchesJobType && matchesTrade;
    });
  }
}
