import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// --- Change this line back to the relative path ---
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileApiUrl = `${environment.apiUrl}/profiles`;
  private userApiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getCurrentUserProfile() {
    return this.http.get(`${this.userApiUrl}/me`);
  }

  createProfile(profileData: any) {
    return this.http.post(this.profileApiUrl, profileData);
  }
}
