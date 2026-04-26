import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
    { path: 'organizacion', loadComponent: () => import('./organizacion/admin-organizacion.component').then(m => m.AdminOrganizacionComponent) },
    { path: 'usuarios', loadComponent: () => import('./usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent) },
    { path: 'perfil', loadChildren: () => import('../perfil/perfil.routes') },
] as Routes;
