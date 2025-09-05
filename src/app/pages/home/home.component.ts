import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerIn', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('slideInLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50px)' }),
        animate('800ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('slideInRight', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(50px)' }),
        animate('800ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('heroSection', { static: false }) heroSection!: ElementRef;

  private destroy$ = new Subject<void>();
  isAuthenticated = false;
  currentTestimonialIndex = 0;
  animatedStats = { activeJobs: 0, workers: 0, contractors: 0, completionRate: 0 };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
    this.startStatsAnimation();
    this.startTestimonialRotation();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  features = [
    {
      icon: 'construction',
      title: 'Find Skilled Trade Work',
      description: 'Browse thousands of construction, plumbing, electrical, and other trade opportunities',
      color: 'primary'
    },
    {
      icon: 'handyman',
      title: 'Connect with Contractors',
      description: 'Contractors can find and hire skilled tradespeople and laborers for their projects',
      color: 'accent'
    },
    {
      icon: 'trending_up',
      title: 'Build Your Career',
      description: 'Access training resources, certifications, and advance in the skilled trades',
      color: 'warn'
    },
    {
      icon: 'security',
      title: 'Secure Payments',
      description: 'Get paid safely and on time with our integrated payment protection system',
      color: 'primary'
    },
    {
      icon: 'verified',
      title: 'Verified Professionals',
      description: 'Work with background-checked, licensed professionals you can trust',
      color: 'accent'
    },
    {
      icon: 'support_agent',
      title: '24/7 Support',
      description: 'Get help when you need it with our dedicated customer support team',
      color: 'warn'
    }
  ];

  stats = [
    { number: 5000, label: 'Active Jobs', suffix: '+', icon: 'work' },
    { number: 25000, label: 'Skilled Workers', suffix: '+', icon: 'people' },
    { number: 800, label: 'Contractors', suffix: '+', icon: 'business' },
    { number: 98, label: 'Job Completion Rate', suffix: '%', icon: 'check_circle' }
  ];

  testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Licensed Electrician',
      company: 'Johnson Electric',
      image: 'assets/testimonials/sarah.jpg',
      rating: 5,
      text: 'WorkConnect helped me find consistent, high-paying electrical work. The platform is easy to use and the payment system is reliable.',
      location: 'Denver, CO'
    },
    {
      name: 'Mike Rodriguez',
      role: 'General Contractor',
      company: 'Rodriguez Construction',
      image: 'assets/testimonials/mike.jpg',
      rating: 5,
      text: 'I\'ve hired over 50 skilled workers through WorkConnect. The quality of professionals and the streamlined process saves me hours every week.',
      location: 'Austin, TX'
    },
    {
      name: 'David Chen',
      role: 'Plumber',
      company: 'Chen Plumbing Services',
      image: 'assets/testimonials/david.jpg',
      rating: 5,
      text: 'As a small business owner, WorkConnect has been a game-changer. I can focus on my work while the platform handles job matching and payments.',
      location: 'Seattle, WA'
    }
  ];

  howItWorks = [
    {
      step: 1,
      title: 'Create Your Profile',
      description: 'Showcase your skills, certifications, and experience with a professional profile',
      icon: 'person_add',
      details: ['Upload certifications', 'Add work samples', 'Set your rates', 'Verify your identity']
    },
    {
      step: 2,
      title: 'Find Perfect Matches',
      description: 'Browse jobs that match your trade, location, and schedule preferences',
      icon: 'search',
      details: ['Smart job matching', 'Location-based search', 'Filter by pay rate', 'Save favorites']
    },
    {
      step: 3,
      title: 'Apply & Get Hired',
      description: 'Submit proposals, communicate with employers, and start working',
      icon: 'handshake',
      details: ['One-click applications', 'Direct messaging', 'Schedule interviews', 'Accept offers']
    },
    {
      step: 4,
      title: 'Get Paid Securely',
      description: 'Complete work and receive payment through our secure payment system',
      icon: 'payment',
      details: ['Milestone payments', 'Automatic invoicing', 'Fast transfers', 'Payment protection']
    }
  ];

  private startStatsAnimation(): void {
    // Animate stats numbers
    this.stats.forEach((stat, index) => {
      const target = stat.number;
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = target / steps;
      let current = 0;

      const timer = interval(duration / steps).pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        current += increment;
        if (current >= target) {
          current = target;
          timer.unsubscribe();
        }

        switch (index) {
          case 0: this.animatedStats.activeJobs = Math.floor(current); break;
          case 1: this.animatedStats.workers = Math.floor(current); break;
          case 2: this.animatedStats.contractors = Math.floor(current); break;
          case 3: this.animatedStats.completionRate = Math.floor(current); break;
        }
      });
    });
  }

  private startTestimonialRotation(): void {
    interval(5000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentTestimonialIndex = (this.currentTestimonialIndex + 1) % this.testimonials.length;
    });
  }

  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in-view');
          }
        });
      }, { threshold: 0.1 });

      // Observe all sections
      const sections = document.querySelectorAll('.section');
      sections.forEach(section => observer.observe(section));
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  getCurrentTestimonial() {
    return this.testimonials[this.currentTestimonialIndex];
  }

  getStarArray(rating: number): number[] {
    return Array(rating).fill(0);
  }

  navigateToRegister(userType: 'worker' | 'employer'): void {
    // You can pass user type as query parameter if needed
    // this.router.navigate(['/register'], { queryParams: { type: userType } });
  }
}
