import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { JobService } from '../../../services/job.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-job-applications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './job-applications.component.html',
  styleUrls: ['./job-applications.component.scss']
})
export class JobApplicationsComponent implements OnInit {
  applications$!: Observable<any[]>;
  jobId!: string;
  // Expose the status options to the template
  applicationStatusOptions = ['PENDING', 'VIEWED', 'ACCEPTED', 'REJECTED', 'COMPLETED'];

  constructor(
    private route: ActivatedRoute,
    private jobService: JobService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('jobId');
    if (id) {
      this.jobId = id;
      this.loadApplications();
    }
  }

  loadApplications(): void {
    this.applications$ = this.jobService.getApplicationsForJob(this.jobId);
  }

  onStatusChange(applicationId: number, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newStatus = selectElement.value;

    this.jobService.updateApplicationStatus(applicationId, newStatus).subscribe({
      next: () => {
        console.log('Status updated successfully');
        this.loadApplications();
      },
      error: (err) => {
        console.error('Failed to update status', err);
      }
    });
  }
}
