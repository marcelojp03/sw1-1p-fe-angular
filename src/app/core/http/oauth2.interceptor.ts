import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';

export const oauth2Interceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const messageService = inject(MessageService);

    const publicRoutes = ['/api/auth/login'];
    const isPublicRoute = publicRoutes.some((route) => req.url.includes(route));

    // Las rutas del proxy QR manejan su propio header Authorization
    const isQrRoute = req.url.includes('/qr-proxy');

    if (!isPublicRoute && !isQrRoute) {
        const token = authService.getAccessToken();
        if (token) {
            req = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
            });
        }
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if ((error.status === 401 || error.status === 403) && !isPublicRoute && !isQrRoute) {
                if (authService.clearSession()) {
                    const returnUrl = router.url;
                    messageService.add({
                        severity: 'warn',
                        summary: 'Sesión expirada',
                        detail: 'Tu sesión ha expirado. Serás redirigido al inicio de sesión...',
                        life: 3000
                    });
                    setTimeout(() => {
                        authService.resetSessionExpiring();
                        router.navigate(['/auth/login'], {
                            queryParams: { returnUrl, sessionExpired: '1' }
                        });
                    }, 3000);
                }
            }
            return throwError(() => error);
        })
    );
};

