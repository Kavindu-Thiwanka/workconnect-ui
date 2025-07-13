import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './review-form.component.html'
})
export class ReviewFormComponent {
  @Input() jobId!: string;
  @Input() revieweeId!: string;

  reviewForm = this.fb.group({
    rating: [0, [Validators.required, Validators.min(1)]],
    comment: ['', Validators.required]
  });

  constructor(private fb: FormBuilder, private reviewService: ReviewService) {}

  onSubmit(): void {
    if (this.reviewForm.valid) {
      const reviewData = {
        jobId: this.jobId,
        revieweeId: this.revieweeId,
        rating: this.reviewForm.value.rating || 0,
        comment: this.reviewForm.value.comment || ''
      };

      this.reviewService.createReview(reviewData).subscribe({
        next: () => {
          alert('Review submitted successfully!');
          this.reviewForm.reset();
        },
        error: (err) => alert(`Error: ${err.error}`)
      });
    }
  }
}
