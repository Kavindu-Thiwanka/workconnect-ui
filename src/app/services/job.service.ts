import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = `${environment.apiUrl}/api/jobs`;

  constructor(private http: HttpClient) { }

  getOpenJobs(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getJobById(jobId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${jobId}`);
  }

  applyForJob(jobId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${jobId}/apply`, {});
  }

  createJob(jobData: any): Observable<any> {
    return this.http.post(this.apiUrl, jobData);
  }

  updateJob(jobId: string, jobData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${jobId}`, jobData).pipe(
      tap(() => console.log(`Job ${jobId} updated successfully`)),
      catchError(this.handleError)
    );
  }

  deleteJob(jobId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${jobId}`).pipe(
      tap(() => console.log(`Job ${jobId} deleted successfully`)),
      catchError(this.handleError)
    );
  }

  updateJobStatus(jobId: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${jobId}/status`, { status }).pipe(
      tap(() => console.log(`Job ${jobId} status updated to ${status}`)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Bad request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'The requested job was not found.';
          break;
        case 409:
          errorMessage = 'Conflict. The job may have been modified by another user.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }

    console.error('Job service error:', error);
    return throwError(() => new Error(errorMessage));
  }

  getPostedJobs(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/employer/jobs`);
  }

  getApplicationsForJob(jobId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/employer/jobs/${jobId}/applications`);
  }

  updateApplicationStatus(applicationId: number, status: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/employer/applications/${applicationId}/status`, { status });
  }

  uploadJobImage(jobId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${jobId}/images`, formData);
  }
}
