import { Injectable, inject, computed } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MenuService {
    private auth = inject(AuthService);

    /**
     * Retorna los items del menú lateral según el rol del usuario autenticado.
     * Computed se recalcula automáticamente si cambia currentUser$.
     */
    readonly items = computed<MenuItem[]>(() => {
        const user = this.auth.currentUserSignal();

        if (!user) return [];

        if (user.roles.includes('SUPER_ADMIN')) {
            return this.menuSuperAdmin();
        }

        return this.menuInstitucion(user.roles);
    });

    private menuSuperAdmin(): MenuItem[] {
        return [
            {
                label: 'Administración Global',
                items: [
                    { label: 'Inicio', icon: 'pi pi-fw pi-home', routerLink: ['/admin'] },
                    { label: 'Instituciones', icon: 'pi pi-fw pi-building', routerLink: ['/admin/instituciones'] },
                    { label: 'Usuarios', icon: 'pi pi-fw pi-users', routerLink: ['/admin/usuarios'] },
                ]
            }
        ];
    }

    private menuInstitucion(roles: string[]): MenuItem[] {
        const isAdmin = roles.includes('ADMIN_INSTITUCION');
        const isDirector = roles.includes('DIRECTOR');
        const isSecretario = roles.includes('SECRETARIO');
        const isDocente = roles.includes('DOCENTE');

        const canGestionAcademica = isAdmin || isDirector || isSecretario;
        const canPersonas = isAdmin || isDirector || isSecretario;
        const canOperacion = isAdmin || isDirector || isSecretario;

        const menu: MenuItem[] = [
            {
                label: 'Principal',
                items: [
                    { label: 'Inicio', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
                ]
            }
        ];

        if (isAdmin) {
            menu.push({ separator: true });
            menu.push({
                label: 'Configuración',
                items: [
                    { label: 'Usuarios', icon: 'pi pi-fw pi-users', routerLink: ['/usuarios'] },
                    { label: 'Configuración Institución', icon: 'pi pi-fw pi-cog', routerLink: ['/configuracion'] },
                ]
            });
        }

        if (canGestionAcademica) {
            menu.push({ separator: true });
            menu.push({
                label: 'Gestión Académica',
                items: [
                    { label: 'Gestiones', icon: 'pi pi-fw pi-calendar', routerLink: ['/gestiones'] },
                    { label: 'Cursos', icon: 'pi pi-fw pi-book', routerLink: ['/cursos'] },
                    { label: 'Paralelos', icon: 'pi pi-fw pi-table', routerLink: ['/paralelos'] },
                    { label: 'Materias', icon: 'pi pi-fw pi-list', routerLink: ['/materias'] },
                    { label: 'Asig. Materias a Cursos', icon: 'pi pi-fw pi-link', routerLink: ['/materias-curso'] },
                ]
            });
        }

        if (canPersonas) {
            menu.push({ separator: true });
            menu.push({
                label: 'Personas',
                items: [
                    { label: 'Docentes', icon: 'pi pi-fw pi-id-card', routerLink: ['/docentes'] },
                    { label: 'Estudiantes', icon: 'pi pi-fw pi-user-plus', routerLink: ['/estudiantes'] },
                    { label: 'Tutores', icon: 'pi pi-fw pi-users', routerLink: ['/tutores'] },
                ]
            });
        }

        if (canOperacion) {
            menu.push({ separator: true });
            menu.push({
                label: 'Operación Académica',
                items: [
                    { label: 'Inscripciones', icon: 'pi pi-fw pi-file-edit', routerLink: ['/inscripciones'] },
                    { label: 'Asignaciones Docentes', icon: 'pi pi-fw pi-graduation-cap', routerLink: ['/asignaciones'] },
                ]
            });
        }

        if (isDocente) {
            menu.push({ separator: true });
            menu.push({
                label: 'Mi área',
                items: [
                    { label: 'Mis asignaciones', icon: 'pi pi-fw pi-graduation-cap', routerLink: ['/asignaciones'] },
                ]
            });
        }

        return menu;
    }
}
