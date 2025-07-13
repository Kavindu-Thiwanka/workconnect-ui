import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = `${environment.apiUrl}/jobs`;
  private applicationApiUrl = `${environment.apiUrl}/applications`;

  constructor(private http: HttpClient) { }

  createJob(jobData: any): Observable<any> {
    return this.http.post(this.apiUrl, jobData);
  }

  getAllJobs(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getJobById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  applyForJob(jobId: string): Observable<any> {
    const params = new HttpParams().set('jobId', jobId);
    return this.http.post(this.applicationApiUrl, null, { params });
  }

  getMyJobs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-jobs`);
  }

  getApplicationsForJob(jobId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.applicationApiUrl}/job/${jobId}`);
  }

  getRecommendedJobs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/recommendations`);
  }

  getAllJobApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.applicationApiUrl}/jobs`);
  }
}
