import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-sia-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="col-span-full">
                <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 mb-1">Panel académico</h2>
                <p class="text-surface-500 text-sm">Gestión integral del sistema de información académica</p>
            </div>

            @for (card of cards; track card.label) {
                <a [routerLink]="card.route"
                   class="group flex items-center gap-4 p-5 rounded-2xl border border-surface bg-surface-0 dark:bg-surface-900 hover:border-primary hover:shadow-md transition-all cursor-pointer no-underline">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                         [style]="'background:' + card.bg">
                        <i [class]="'pi ' + card.icon + ' text-white text-xl'"></i>
                    </div>
                    <div>
                        <p class="font-semibold text-surface-900 dark:text-surface-0 group-hover:text-primary transition-colors">{{ card.label }}</p>
                        <p class="text-surface-400 text-xs mt-0.5">{{ card.desc }}</p>
                    </div>
                </a>
            }
        </div>
    `
})
export class SiaDashboardComponent {
    cards = [
        { label: 'Gestiones Académicas', desc: 'Años y periodos académicos', icon: 'pi-calendar', route: '/gestiones', bg: '#3b82f6' },
        { label: 'Cursos y Paralelos', desc: 'Niveles y divisiones por gestión', icon: 'pi-book', route: '/cursos', bg: '#8b5cf6' },
        { label: 'Materias', desc: 'Asignaturas del plan de estudios', icon: 'pi-list', route: '/materias', bg: '#06b6d4' },
        { label: 'Docentes', desc: 'Personal docente de la institución', icon: 'pi-id-card', route: '/docentes', bg: '#10b981' },
        { label: 'Estudiantes', desc: 'Alumnos matriculados', icon: 'pi-user-plus', route: '/estudiantes', bg: '#f59e0b' },
        { label: 'Usuarios', desc: 'Gestión de accesos del sistema', icon: 'pi-users', route: '/usuarios', bg: '#ef4444' },
    ];
}
