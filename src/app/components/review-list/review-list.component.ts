import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Review } from '../../models/review.model';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.scss']
})
export class ReviewListComponent implements OnInit {
  @Input() userId!: string;
  reviews: Review[] = [];
  averageRating = 0;

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    if (this.userId) {
      this.reviewService.getReviewsForUser(this.userId).subscribe(reviews => {
        this.reviews = reviews;
        if (this.reviews.length > 0) {
          const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
          this.averageRating = total / this.reviews.length;
        }
      });
    }
  }

  getStarRating(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? '★' : '☆');
    }
    return stars;
  }
}
