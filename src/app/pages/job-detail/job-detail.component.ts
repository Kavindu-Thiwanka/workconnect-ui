import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { JobService } from '../../services/job.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.scss']
})
export class JobDetailComponent implements OnInit {
  job$!: Observable<any>;
  userRole: string | null = null;
  isApplying = false;
  hasApplied = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private jobService: JobService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('jobId');
    if (jobId) {
      this.job$ = this.jobService.getJobById(jobId);
    }
    this.userRole = this.authService.getRole();
  }

  applyForJob(jobId: string): void {
    this.isApplying = true;
    this.errorMessage = '';

    this.jobService.applyForJob(jobId).subscribe({
      next: () => {
        this.isApplying = false;
        this.hasApplied = true;
      },
      error: (err) => {
        this.isApplying = false;
        this.errorMessage = err.error || 'An error occurred.';
      }
    });
  }
}
