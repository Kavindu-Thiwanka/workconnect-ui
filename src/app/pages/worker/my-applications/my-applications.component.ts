import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WorkerService } from '../../../services/worker.service';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ReviewService } from '../../../services/review.service';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './my-applications.component.html',
  styleUrls: ['./my-applications.component.scss']
})
export class MyApplicationsComponent implements OnInit {
  applications$!: Observable<any[]>;
  reviewForm: FormGroup;
  reviewingApplicationId: number | null = null;

  constructor(
    private workerService: WorkerService,
    private reviewService: ReviewService,
    private fb: FormBuilder
  ) {
    this.reviewForm = this.fb.group({
      rating: [5, Validators.required],
      comment: ['']
    });
  }

  ngOnInit(): void {
    this.applications$ = this.workerService.getMyApplications();
  }

  toggleReviewForm(applicationId: number): void {
    this.reviewingApplicationId = this.reviewingApplicationId === applicationId ? null : applicationId;
    this.reviewForm.reset({ rating: 5, comment: '' });
  }

  onReviewSubmit(): void {
    if (this.reviewForm.invalid || this.reviewingApplicationId === null) {
      return;
    }

    const reviewData = {
      applicationId: this.reviewingApplicationId,
      ...this.reviewForm.value
    };

    this.reviewService.submitReview(reviewData).subscribe({
      next: () => {
        alert('Review submitted successfully!');
        this.toggleReviewForm(this.reviewingApplicationId!);
        // In a real app, you'd refresh the list or hide the review button
      },
      error: (err) => {
        console.error('Failed to submit review', err);
        alert(err.error || 'Failed to submit review.');
      }
    });
  }
}
