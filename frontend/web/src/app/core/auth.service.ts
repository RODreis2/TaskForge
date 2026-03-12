import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { ApiService, ProfileUpdateRequest, UserRequest, UserResponse } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<UserResponse | null>(null);

  constructor(
    private readonly api: ApiService,
    private readonly router: Router
  ) {}

  get currentUser(): UserResponse | null {
    return this.userSubject.value;
  }

  get currentUser$(): Observable<UserResponse | null> {
    return this.userSubject.asObservable();
  }

  get isAuthenticated(): boolean {
    return !!this.userSubject.value;
  }

  register(payload: UserRequest): Observable<UserResponse> {
    return this.api.register(payload);
  }

  login(payload: UserRequest): Observable<UserResponse> {
    return this.api.login(payload).pipe(tap((user) => this.userSubject.next(user)));
  }

  checkSession(): Observable<boolean> {
    if (this.userSubject.value) {
      return of(true);
    }

    return this.api.me().pipe(
      tap((user) => this.userSubject.next(user)),
      map(() => true),
      catchError(() => this.clearSession())
    );
  }

  updateProfile(payload: ProfileUpdateRequest): Observable<UserResponse> {
    return this.api.updateProfile(payload).pipe(tap((user) => this.userSubject.next(user)));
  }

  logout(): Observable<void> {
    return this.api.logout().pipe(
      tap(() => {
        this.userSubject.next(null);
        void this.router.navigate(['/']);
      })
    );
  }

  clearSession(): Observable<boolean> {
    this.userSubject.next(null);
    return of(false);
  }
}
