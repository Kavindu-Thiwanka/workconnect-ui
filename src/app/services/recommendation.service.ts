import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LoadingService } from './loading.service';
import { ErrorService } from './error.service';
import { Job, JobRecommendation, RecommendationResponse } from '../models/api-models';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private apiUrl = `${environment.apiUrl}/api/recommendations`;

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
    private errorService: ErrorService
  ) {}

  /**
   * Get AI-powered job recommendations for the authenticated worker
   */
  getJobRecommendations(limit: number = 10): Observable<JobRecommendation> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.loadingService.wrapWithLoading('job-recommendations',
      this.http.get<JobRecommendation>(`${this.apiUrl}/jobs`, { params }).pipe(
        map(response => ({
          ...response,
          isAiPowered: this.isAiPoweredRecommendation(response.recommendationReason),
          aiServiceUsed: this.isAiPoweredRecommendation(response.recommendationReason)
        })),
        catchError(error => {
          console.error('Error fetching AI recommendations:', error);

          // Return fallback response
          const fallbackResponse: JobRecommendation = {
            recommendations: [],
            totalCount: 0,
            recommendationReason: 'Unable to generate recommendations at this time. Please try again later.',
            isAiPowered: false,
            aiServiceUsed: false
          };

          return of(fallbackResponse);
        })
      )
    );
  }

  /**
   * Check if the recommendation is AI-powered based on the reason text
   */
  private isAiPoweredRecommendation(reason: string): boolean {
    return reason.toLowerCase().includes('ai-powered') ||
           reason.toLowerCase().includes('based on your skills');
  }

  /**
   * Get recommendation status for UI indicators
   */
  getRecommendationStatus(recommendationReason: string): {
    isAiPowered: boolean;
    statusText: string;
    statusIcon: string;
    statusColor: string;
  } {
    const isAiPowered = this.isAiPoweredRecommendation(recommendationReason);

    if (isAiPowered) {
      return {
        isAiPowered: true,
        statusText: 'AI-Powered',
        statusIcon: 'psychology',
        statusColor: 'primary'
      };
    } else {
      return {
        isAiPowered: false,
        statusText: 'Basic',
        statusIcon: 'list',
        statusColor: 'accent'
      };
    }
  }
}
