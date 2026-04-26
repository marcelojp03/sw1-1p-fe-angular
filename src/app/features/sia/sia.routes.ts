import { Routes } from '@angular/router';

export default [
    { path: '', loadComponent: () => import('./dashboard/sia-dashboard.component').then(m => m.SiaDashboardComponent) },
    { path: 'usuarios', loadComponent: () => import('../admin/usuarios/admin-usuarios.component').then(m => m.AdminUsuariosComponent) },
    { path: 'gestiones', loadComponent: () => import('./gestiones/gestiones.component').then(m => m.GestionesComponent) },
    { path: 'cursos', loadComponent: () => import('./cursos/cursos.component').then(m => m.CursosComponent) },
    { path: 'paralelos', loadComponent: () => import('./paralelos/paralelos.component').then(m => m.ParalelosComponent) },
    { path: 'materias', loadComponent: () => import('./materias/materias.component').then(m => m.MateriasComponent) },
    { path: 'materias-curso', loadComponent: () => import('./materias-curso/materias-curso.component').then(m => m.MateriasCursoComponent) },
    { path: 'docentes', loadComponent: () => import('./docentes/docentes.component').then(m => m.DocentesComponent) },
    { path: 'estudiantes', loadComponent: () => import('./estudiantes/estudiantes.component').then(m => m.EstudiantesComponent) },
    { path: 'tutores', loadComponent: () => import('./tutores/tutores.component').then(m => m.TutoresComponent) },
    { path: 'inscripciones', loadComponent: () => import('./inscripciones/inscripciones.component').then(m => m.InscripcionesComponent) },
    { path: 'asignaciones', loadComponent: () => import('./asignaciones/asignaciones.component').then(m => m.AsignacionesComponent) },
    { path: 'configuracion', loadComponent: () => import('./configuracion/configuracion.component').then(m => m.ConfiguracionComponent) },
    { path: 'perfil', loadChildren: () => import('../perfil/perfil.routes') },
] as Routes;
