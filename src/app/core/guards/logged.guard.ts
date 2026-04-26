// core/guards/logged.guard.ts
import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Resolver para prevenir que usuarios ya autenticados accedan a páginas de auth.
 * SUPER_ADMIN → /admin  |  resto → /
 */
export const loggedResolver: ResolveFn<boolean> = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLogged()) {
    const user = auth.getCurrentUser();
    if (user?.roles.includes('SUPER_ADMIN')) {
      router.navigate(['/admin']);
    } else {
      router.navigate(['/']);
    }
  }

  return true;
};
