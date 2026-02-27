import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.checkSession().pipe(
    map((ok) => {
      if (!ok) {
        void router.navigate(['/login']);
      }
      return ok;
    }),
    catchError(() => {
      void router.navigate(['/login']);
      return of(false);
    })
  );
};
