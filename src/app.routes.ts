import { Routes } from '@angular/router';
import { Notfound } from './app/pages/notfound/notfound';
import { AppLayout } from '@/layout/component/app.layout';
import { authGuard } from './app/core/guards/auth.guard';
import { roleGuard } from './app/core/guards/role.guard';

export const appRoutes: Routes = [
    {
        path: 'admin',
        component: AppLayout,
        canActivate: [authGuard, roleGuard('ADMIN')],
        children: [
            { path: '', loadChildren: () => import('./app/features/admin/admin.routes') },
        ]
    },
    {
        path: 'officer',
        component: AppLayout,
        canActivate: [authGuard, roleGuard('OFFICER')],
        children: [
            { path: '', loadChildren: () => import('./app/features/officer/officer.routes') },
        ]
    },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
