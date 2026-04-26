import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
    { path: 'instituciones', loadComponent: () => import('./instituciones/admin-instituciones.component').then(m => m.AdminInstitucionesComponent) },
    { path: 'usuarios', loadComponent: () => import('./usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent) },
    { path: 'perfil', loadChildren: () => import('../perfil/perfil.routes') },
] as Routes;
