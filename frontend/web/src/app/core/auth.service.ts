import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, of, tap } from 'rxjs';
import { ApiService, UserRequest, UserResponse } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user: UserResponse | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly router: Router
  ) {}

  get currentUser(): UserResponse | null {
    return this.user;
  }

  register(payload: UserRequest): Observable<UserResponse> {
    return this.api.register(payload);
  }

  login(payload: UserRequest): Observable<UserResponse> {
    return this.api.login(payload).pipe(tap((user) => (this.user = user)));
  }

  checkSession(): Observable<boolean> {
    return this.api.me().pipe(
      tap((user) => (this.user = user)),
      map(() => true)
    );
  }

  logout(): Observable<void> {
    return this.api.logout().pipe(
      tap(() => {
        this.user = null;
        void this.router.navigate(['/login']);
      })
    );
  }

  clearSession(): Observable<boolean> {
    this.user = null;
    return of(false);
  }
}
