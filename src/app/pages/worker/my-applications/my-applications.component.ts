import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorkerService } from '../../../services/worker.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ReviewService } from '../../../services/review.service';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.scss']
})
export class MyApplicationsComponent implements OnInit {
  applications$!: Observable<any[]>;
  filteredApplications$!: Observable<any[]>;
  reviewForm: FormGroup;
  reviewingApplicationId: number | null = null;
  isSubmittingReview = false;

  private filterSubject = new BehaviorSubject<string>('ALL');
  activeFilter = 'ALL';

  constructor(
    private workerService: WorkerService,
    private reviewService: ReviewService,
    private fb: FormBuilder
  ) {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.applications$ = this.workerService.getMyApplications();

    this.filteredApplications$ = combineLatest([
      this.applications$,
      this.filterSubject.asObservable()
    ]).pipe(
      map(([applications, filter]) => {
        if (filter === 'ALL') {
          return applications;
        }
        return applications.filter(app => app.status === filter);
      })
    );
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.filterSubject.next(filter);
  }

  getApplicationsByStatus(status: string): any[] {
    // This would need to be implemented based on your data structure
    return [];
  }

  toggleReviewForm(applicationId: number): void {
    this.reviewingApplicationId = this.reviewingApplicationId === applicationId ? null : applicationId;
    this.reviewForm.reset({ rating: 5, comment: '' });
  }

  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }

  getRatingText(rating: number): string {
    const ratingTexts: { [key: number]: string } = {
      1: 'Very Poor',
      2: 'Poor',
      3: 'Average',
      4: 'Good',
      5: 'Excellent'
    };
    return ratingTexts[rating] || '';
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'PENDING': 'schedule',
      'VIEWED': 'visibility',
      'ACCEPTED': 'check_circle',
      'REJECTED': 'cancel',
      'COMPLETED': 'done_all'
    };
    return statusIcons[status] || 'help';
  }

  isStepCompleted(step: string, currentStatus: string): boolean {
    const statusOrder = ['PENDING', 'VIEWED', 'ACCEPTED', 'COMPLETED'];
    const stepIndex = statusOrder.indexOf(step);
    const currentIndex = statusOrder.indexOf(currentStatus);
    return currentIndex >= stepIndex;
  }

  getEmptyStateTitle(): string {
    switch (this.activeFilter) {
      case 'PENDING': return 'No Pending Applications';
      case 'VIEWED': return 'No Applications Under Review';
      case 'ACCEPTED': return 'No Accepted Applications';
      case 'COMPLETED': return 'No Completed Applications';
      default: return 'No Applications Yet';
    }
  }

  getEmptyStateMessage(): string {
    switch (this.activeFilter) {
      case 'PENDING': return 'You don\'t have any pending applications at the moment.';
      case 'VIEWED': return 'None of your applications are currently under review.';
      case 'ACCEPTED': return 'You don\'t have any accepted applications yet.';
      case 'COMPLETED': return 'You haven\'t completed any jobs yet.';
      default: return 'Start applying to jobs to see your applications here.';
    }
  }

  trackByApplicationId(index: number, application: any): number {
    return application.applicationId;
  }

  onReviewSubmit(): void {
    if (this.reviewForm.invalid || this.reviewingApplicationId === null) {
      return;
    }

    this.isSubmittingReview = true;

    const reviewData = {
      applicationId: this.reviewingApplicationId,
      ...this.reviewForm.value
    };

    this.reviewService.submitReview(reviewData).subscribe({
      next: () => {
        this.isSubmittingReview = false;
        // Show success message (you might want to use a snackbar service)
        this.toggleReviewForm(this.reviewingApplicationId!);
        // Refresh applications to show updated review status
        this.applications$ = this.workerService.getMyApplications();
      },
      error: (err) => {
        this.isSubmittingReview = false;
        console.error('Failed to submit review', err);
        // Show error message (you might want to use a snackbar service)
      }
    });
  }
}
