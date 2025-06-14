import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Hub } from 'aws-amplify/utils';
import { BehaviorSubject } from 'rxjs';

import {
  confirmSignUp,
  signIn,
  getCurrentUser,
  signOut,
  type SignInInput,
  type AuthUser
} from '@aws-amplify/auth';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  public currentUser = new BehaviorSubject<AuthUser | null>(null);

  constructor(private http: HttpClient) {
    Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          this.updateCurrentUser();
          break;
        case 'signedOut':
          this.currentUser.next(null);
          break;
      }
    });
    this.updateCurrentUser();
  }

  async updateCurrentUser(): Promise<void> {
    try {
      const user = await getCurrentUser();
      this.currentUser.next(user);
    } catch (error) {
      this.currentUser.next(null);
    }
  }

  register(userData: any) {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  confirmRegistration(username: string, confirmationCode: string) {
    return confirmSignUp({ username, confirmationCode });
  }

  signIn(credentials: SignInInput) {
    return signIn(credentials);
  }

  getCurrentUser() {
    return getCurrentUser();
  }

  signOut() {
    return signOut({ global: true });
  }
}
