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

  applicationStatus = [
    {
      jobTitle: 'Construction Worker',
      company: 'BuildRight Inc.',
      status: 'Interview Scheduled',
      statusType: 'scheduled',
      dateApplied: '2023-08-15'
    },
    {
      jobTitle: 'Warehouse Associate',
      company: 'Quick Logistics',
      status: 'Application Received',
      statusType: 'received',
      dateApplied: '2023-08-10'
    },
    {
      jobTitle: 'Delivery Driver',
      company: 'Swift Transport',
      status: 'Rejected',
      statusType: 'rejected',
      dateApplied: '2023-08-05'
    }
  ];

  messages = [
    {
      company: 'BuildRight Inc.',
      logo: 'assets/company1.svg',
      message: 'Interview scheduled for next week. Please confirm your availability.',
      time: '2 days ago',
      unread: true
    },
    {
      company: 'Quick Logistics',
      logo: 'assets/company2.svg',
      message: 'Your application has been received. We will review it and get back to you soon.',
      time: '5 days ago',
      unread: false
    }
  ];

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
