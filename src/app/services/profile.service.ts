import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WorkerProfile, EmployerProfile } from '../models/api-models';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/api/profiles`;

  constructor(private http: HttpClient) { }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  getWorkerProfile(): Observable<WorkerProfile> {
    return this.http.get<WorkerProfile>(`${this.apiUrl}/me`);
  }

  getEmployerProfile(): Observable<EmployerProfile> {
    return this.http.get<EmployerProfile>(`${this.apiUrl}/me`);
  }

  updateWorkerProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/me/worker`, profileData);
  }

  updateEmployerProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/me/employer`, profileData);
  }

  getRecommendations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/me/recommendations`);
  }

  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/me/picture`, formData);
  }
}
