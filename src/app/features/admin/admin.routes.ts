import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
    { path: 'organizacion', loadComponent: () => import('./organizacion/admin-organizacion.component').then(m => m.AdminOrganizacionComponent) },
    { path: 'usuarios', loadComponent: () => import('./usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent) },
    { path: 'politicas', loadComponent: () => import('./politicas/admin-politicas.component').then(m => m.AdminPoliticasComponent) },
    { path: 'politicas/:id/editar', loadComponent: () => import('./politicas/admin-politica-diseñador.component').then(m => m.AdminPoliticaDiseñadorComponent) },
    { path: 'monitoreo', loadComponent: () => import('./monitoreo/admin-monitoreo.component').then(m => m.AdminMonitoreoComponent) },
    { path: 'clientes', loadComponent: () => import('../officer/clientes/officer-clientes.component').then(m => m.OfficerClientesComponent) },
    { path: 'tramites', loadComponent: () => import('../officer/tramites/officer-tramites.component').then(m => m.OfficerTramitesComponent) },
    { path: 'tramites/:id', loadComponent: () => import('../officer/tramites/officer-tramite-detalle.component').then(m => m.OfficerTramiteDetalleComponent) },
    { path: 'tareas', loadComponent: () => import('../officer/tareas/officer-tareas.component').then(m => m.OfficerTareasComponent) },
    { path: 'tareas/:id/completar', loadComponent: () => import('../officer/tareas/officer-completar-tarea.component').then(m => m.OfficerCompletarTareaComponent) },
    { path: 'perfil', loadChildren: () => import('../perfil/perfil.routes') },
] as Routes;
