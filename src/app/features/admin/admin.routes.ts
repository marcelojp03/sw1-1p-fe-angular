import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
    { path: 'organizacion', loadComponent: () => import('./organizacion/admin-organizacion.component').then(m => m.AdminOrganizacionComponent) },
    { path: 'usuarios', loadComponent: () => import('./usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent) },
    { path: 'politicas', loadComponent: () => import('./politicas/admin-politicas.component').then(m => m.AdminPoliticasComponent) },
    { path: 'politicas/nuevo', loadComponent: () => import('./politicas/admin-politica-nuevo.component').then(m => m.AdminPoliticaNuevoComponent) },
    { path: 'politicas/:id/editar', loadComponent: () => import('./politicas/admin-politica-diseñador.component').then(m => m.AdminPoliticaDiseñadorComponent) },
    { path: 'monitoreo', loadComponent: () => import('./monitoreo/admin-monitoreo.component').then(m => m.AdminMonitoreoComponent) },
    { path: 'perfil', loadChildren: () => import('../perfil/perfil.routes') },
] as Routes;
