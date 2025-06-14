import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobService } from '../../services/job.service';

@Component({
  selector: 'app-employer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employer-dashboard.component.html',
  styleUrls: ['./employer-dashboard.component.scss']
})
export class EmployerDashboardComponent implements OnInit {
  myJobs: any[] = [];
  selectedJob: any = null;
  applications: any[] = [];
  isLoadingJobs = true;
  isLoadingApps = false;

  constructor(private jobService: JobService) { }

  ngOnInit(): void {
    this.jobService.getMyJobs().subscribe(data => {
      this.myJobs = data;
      this.isLoadingJobs = false;
    });
  }

  viewApplications(job: any): void {
    this.selectedJob = job;
    this.isLoadingApps = true;
    this.applications = []; // Clear previous applications
    this.jobService.getApplicationsForJob(job.id).subscribe(data => {
      this.applications = data;
      this.isLoadingApps = false;
    });
  }
}
