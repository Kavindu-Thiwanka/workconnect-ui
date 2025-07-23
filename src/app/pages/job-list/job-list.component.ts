import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../services/job.service';
import { Observable, map, combineLatest, BehaviorSubject } from 'rxjs';
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

  constructor(private jobService: JobService) {}

  ngOnInit(): void {
    this.jobs$ = this.jobService.getOpenJobs();

    // Subscribe to jobs and apply filters
    combineLatest([
      this.jobs$,
      this.searchSubject,
      this.locationSubject,
      this.jobTypeSubject,
      this.tradeSubject
    ]).pipe(
      map(([jobs, search, location, jobType, trade]) => {
        return this.applyFilters(jobs, search, location, jobType, trade);
      })
    ).subscribe(filteredJobs => {
      this.filteredJobs = filteredJobs;
      this.isLoading = false;
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onFilter(): void {
    this.locationSubject.next(this.locationFilter);
    this.jobTypeSubject.next(this.jobTypeFilter);
    this.tradeSubject.next(this.tradeFilter);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.locationFilter = '';
    this.jobTypeFilter = '';
    this.tradeFilter = '';
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

  private applyFilters(jobs: any[], search: string, location: string, jobType: string, trade: string): any[] {
    return jobs.filter(job => {
      const matchesSearch = !search ||
        job.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
        job.employerCompanyName?.toLowerCase().includes(search.toLowerCase()) ||
        job.description?.toLowerCase().includes(search.toLowerCase()) ||
        job.trade?.toLowerCase().includes(search.toLowerCase());

      const matchesLocation = !location ||
        job.location?.toLowerCase().includes(location.toLowerCase());

      const matchesJobType = !jobType || job.jobType === jobType;

      const matchesTrade = !trade || job.trade === trade;

      return matchesSearch && matchesLocation && matchesJobType && matchesTrade;
    });
  }
}
