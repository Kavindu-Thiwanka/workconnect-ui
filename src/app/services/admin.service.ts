import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminUser, AdminJob, AdminApplication, AdminStats, PageResponse } from '../models/api-models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) { }

  // Statistics
  getSystemStatistics(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`);
  }

  // User Management
  getAllUsers(page: number = 0, size: number = 20, sortBy: string = 'userId', sortDir: string = 'asc', search?: string): Observable<PageResponse<AdminUser>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PageResponse<AdminUser>>(`${this.apiUrl}/users`, { params });
  }

  getUserById(userId: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/users/${userId}`);
  }

  updateUserStatus(userId: number, status: 'ACTIVE' | 'INACTIVE' | 'BANNED'): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/users/${userId}/status`, { status });
  }

  deleteUser(userId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/users/${userId}`);
  }

  // Job Management
  getAllJobs(page: number = 0, size: number = 20, sortBy: string = 'id', sortDir: string = 'desc', search?: string): Observable<PageResponse<AdminJob>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PageResponse<AdminJob>>(`${this.apiUrl}/jobs`, { params });
  }

  getJobById(jobId: number): Observable<AdminJob> {
    return this.http.get<AdminJob>(`${this.apiUrl}/jobs/${jobId}`);
  }

  deleteJob(jobId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/jobs/${jobId}`);
  }

  // Application Management
  getAllApplications(page: number = 0, size: number = 20, sortBy: string = 'id', sortDir: string = 'desc'): Observable<PageResponse<AdminApplication>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<PageResponse<AdminApplication>>(`${this.apiUrl}/applications`, { params });
  }

  getApplicationsByJob(jobId: number, page: number = 0, size: number = 20): Observable<PageResponse<AdminApplication>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<AdminApplication>>(`${this.apiUrl}/applications/job/${jobId}`, { params });
  }

  getApplicationsByWorker(workerId: number, page: number = 0, size: number = 20): Observable<PageResponse<AdminApplication>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PageResponse<AdminApplication>>(`${this.apiUrl}/applications/worker/${workerId}`, { params });
  }

  getApplicationById(applicationId: number): Observable<AdminApplication> {
    return this.http.get<AdminApplication>(`${this.apiUrl}/applications/${applicationId}`);
  }

  // Review Management
  getAllReviews(page: number = 0, size: number = 20, sortBy: string = 'id', sortDir: string = 'desc'): Observable<PageResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<PageResponse<any>>(`${this.apiUrl}/reviews`, { params });
  }

  deleteReview(reviewId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/reviews/${reviewId}`);
  }

  // Data Export
  exportUsers(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/users`, { responseType: 'blob' });
  }

  exportJobs(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/jobs`, { responseType: 'blob' });
  }

  exportApplications(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/applications`, { responseType: 'blob' });
  }

  // Utility methods for file download
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
