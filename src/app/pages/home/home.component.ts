import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  features = [
    {
      icon: 'work',
      title: 'Find Your Dream Job',
      description: 'Browse thousands of job opportunities from top companies worldwide'
    },
    {
      icon: 'people',
      title: 'Connect with Talent',
      description: 'Employers can find and hire the best candidates for their teams'
    },
    {
      icon: 'trending_up',
      title: 'Grow Your Career',
      description: 'Access career resources and professional development opportunities'
    }
  ];

  stats = [
    { number: '10K+', label: 'Active Jobs' },
    { number: '50K+', label: 'Professionals' },
    { number: '500+', label: 'Companies' },
    { number: '95%', label: 'Success Rate' }
  ];
}