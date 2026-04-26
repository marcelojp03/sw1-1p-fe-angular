import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de roles. Uso en rutas:
 *
 *   canActivate: [roleGuard('ADMIN_INSTITUCION')]
 *   canActivate: [roleGuard('ADMIN_INSTITUCION', 'DIRECTOR')]
 */
export function roleGuard(...allowedRoles: string[]): CanActivateFn {
    return () => {
        const auth = inject(AuthService);
        const router = inject(Router);

        const user = auth.getCurrentUser();

        if (!user) {
            return router.createUrlTree(['/auth/login']);
        }

        const hasRole = allowedRoles.some((role) => user.roles.includes(role));

        if (!hasRole) {
            return router.createUrlTree(['/auth/access']);
        }

        return true;
    };
}
