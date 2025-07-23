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
      icon: 'construction',
      title: 'Find Skilled Trade Work',
      description: 'Browse thousands of construction, plumbing, electrical, and other trade opportunities'
    },
    {
      icon: 'handyman',
      title: 'Connect with Contractors',
      description: 'Contractors can find and hire skilled tradespeople and laborers for their projects'
    },
    {
      icon: 'trending_up',
      title: 'Build Your Career',
      description: 'Access training resources, certifications, and advance in the skilled trades'
    }
  ];

  stats = [
    { number: '5K+', label: 'Active Jobs' },
    { number: '25K+', label: 'Skilled Workers' },
    { number: '800+', label: 'Contractors' },
    { number: '98%', label: 'Job Completion Rate' }
  ];
}
