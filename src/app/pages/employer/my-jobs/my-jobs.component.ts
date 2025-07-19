import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobService } from '../../../services/job.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-jobs.component.html',
  styleUrls: ['./my-jobs.component.scss']
})
export class MyJobsComponent implements OnInit {
  myJobs$!: Observable<any[]>;

  constructor(private jobService: JobService) {}

  ngOnInit(): void {
    this.myJobs$ = this.jobService.getPostedJobs();
  }
}
