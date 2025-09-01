import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private apiUrl = `${environment.apiUrl}/api/worker`;

  constructor(private http: HttpClient) { }

  getMyApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/applications`);
  }
}
