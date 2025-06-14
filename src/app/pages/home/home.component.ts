import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { JobService } from '../../services/job.service';
import { type AuthUser } from '@aws-amplify/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentUser: AuthUser | null = null;
  recommendedJobs: any[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private jobService: JobService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      // Check if the user is a WORKER to fetch recommendations
      // Note: Custom attributes like user_role require extra setup to appear here.
      // We will assume for now if they are logged in and not an employer, they are a worker.
      // A more robust solution involves decoding the ID token to get the role.
      if (user) {
        this.fetchRecommendations();
      }
    });
  }

  fetchRecommendations(): void {
    this.isLoading = true;
    this.error = null;
    this.jobService.getRecommendedJobs().subscribe({
      next: (data) => {
        this.recommendedJobs = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch recommendations', err);
        this.error = err.error; // Display the error message from the backend
        this.isLoading = false;
      }
    });
  }
}
