import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'tareas', pathMatch: 'full' },
    { path: 'clientes', loadComponent: () => import('./clientes/officer-clientes.component').then(m => m.OfficerClientesComponent) },
    { path: 'tramites', loadComponent: () => import('./tramites/officer-tramites.component').then(m => m.OfficerTramitesComponent) },
    { path: 'tramites/:id', loadComponent: () => import('./tramites/officer-tramite-detalle.component').then(m => m.OfficerTramiteDetalleComponent) },
    { path: 'tareas', loadComponent: () => import('./tareas/officer-tareas.component').then(m => m.OfficerTareasComponent) },
    { path: 'tareas/:id/completar', loadComponent: () => import('./tareas/officer-completar-tarea.component').then(m => m.OfficerCompletarTareaComponent) },
] as Routes;
