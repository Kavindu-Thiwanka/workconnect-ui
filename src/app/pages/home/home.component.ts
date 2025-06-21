import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { JobService } from '../../services/job.service';
import { ProfileService } from '../../services/profile.service';
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
  userProfile: any = null;
  recommendedJobs: any[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private jobService: JobService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadUserData();
      } else {
        this.isLoading = false;
      }
    });
  }

  loadUserData(): void {
    this.isLoading = true;
    this.profileService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        if (this.userProfile.userRole === 'WORKER') {
          this.fetchRecommendations();
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = "Could not load your user profile.";
        this.isLoading = false;
      }
    });
  }

  fetchRecommendations(): void {
    this.jobService.getRecommendedJobs().subscribe({
      next: (data) => {
        this.recommendedJobs = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error;
        this.isLoading = false;
      }
    });
  }
}
