import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = `${environment.apiUrl}/jobs`;

  constructor(private http: HttpClient) { }

  createJob(jobData: any): Observable<any> {
    return this.http.post(this.apiUrl, jobData);
  }

  getAllJobs(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // --- ADD THIS NEW METHOD ---
  getJobById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
