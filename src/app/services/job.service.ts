import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
