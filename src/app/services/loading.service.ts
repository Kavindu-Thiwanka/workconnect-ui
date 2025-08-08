import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoadingState {
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({});
  private globalLoadingSubject = new BehaviorSubject<boolean>(false);

  public loading$ = this.loadingSubject.asObservable();
  public globalLoading$ = this.globalLoadingSubject.asObservable();

  /**
   * Set loading state for a specific key
   */
  setLoading(key: string, loading: boolean): void {
    const currentState = this.loadingSubject.value;
    const newState = { ...currentState, [key]: loading };
    
    // Remove false values to keep the object clean
    if (!loading) {
      delete newState[key];
    }
    
    this.loadingSubject.next(newState);
    this.updateGlobalLoading(newState);
  }

  /**
   * Get loading state for a specific key
   */
  isLoading(key: string): Observable<boolean> {
    return new Observable(observer => {
      this.loading$.subscribe(state => {
        observer.next(!!state[key]);
      });
    });
  }

  /**
   * Check if any loading is active
   */
  isAnyLoading(): Observable<boolean> {
    return this.globalLoading$;
  }

  /**
   * Clear all loading states
   */
  clearAll(): void {
    this.loadingSubject.next({});
    this.globalLoadingSubject.next(false);
  }

  /**
   * Clear loading state for a specific key
   */
  clear(key: string): void {
    this.setLoading(key, false);
  }

  /**
   * Update global loading state based on individual states
   */
  private updateGlobalLoading(state: LoadingState): void {
    const hasAnyLoading = Object.values(state).some(loading => loading);
    this.globalLoadingSubject.next(hasAnyLoading);
  }

  /**
   * Create a loading wrapper for observables
   */
  wrapWithLoading<T>(key: string, observable: Observable<T>): Observable<T> {
    return new Observable(observer => {
      this.setLoading(key, true);
      
      const subscription = observable.subscribe({
        next: (value) => observer.next(value),
        error: (error) => {
          this.setLoading(key, false);
          observer.error(error);
        },
        complete: () => {
          this.setLoading(key, false);
          observer.complete();
        }
      });

      return () => {
        this.setLoading(key, false);
        subscription.unsubscribe();
      };
    });
  }
}
