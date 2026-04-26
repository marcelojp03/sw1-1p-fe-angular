import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'tareas', pathMatch: 'full' },
    { path: 'clientes', loadComponent: () => import('./clientes/officer-clientes.component').then(m => m.OfficerClientesComponent) },
    { path: 'tramites', loadComponent: () => import('./tramites/officer-tramites.component').then(m => m.OfficerTramitesComponent) },
    { path: 'tramites/nuevo', loadComponent: () => import('./tramites/officer-nuevo-tramite.component').then(m => m.OfficerNuevoTramiteComponent) },
    { path: 'tareas', loadComponent: () => import('./tareas/officer-tareas.component').then(m => m.OfficerTareasComponent) },
] as Routes;
