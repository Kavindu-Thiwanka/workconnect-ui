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
  applicationStatusOptions = ['PENDING', 'VIEWED', 'ACCEPTED', 'REJECTED', 'COMPLETED'];
  job$!: Observable<any>;
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private jobService: JobService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('jobId');
    if (id) {
      this.jobId = id;
      this.loadApplications();
      this.job$ = this.jobService.getJobById(this.jobId);
    }
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      this.selectedFile = fileList[0];
    }
  }

  onImageUpload(): void {
    if (!this.selectedFile) { return; }
    this.jobService.uploadJobImage(this.jobId, this.selectedFile).subscribe({
      next: () => {
        alert('Image uploaded successfully!');
        this.job$ = this.jobService.getJobById(this.jobId);
        this.selectedFile = null;
      },
      error: (err) => alert('Image upload failed.')
    });
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
