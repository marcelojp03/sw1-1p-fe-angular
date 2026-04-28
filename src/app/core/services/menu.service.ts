import { Injectable, inject, computed } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MenuService {
    private auth = inject(AuthService);

    readonly items = computed<MenuItem[]>(() => {
        const user = this.auth.currentUserSignal();
        if (!user) return [];
        if (user.roles.includes('ADMIN')) return this.menuAdmin();
        if (user.roles.includes('OFFICER')) return this.menuOfficer();
        return [];
    });

    private menuAdmin(): MenuItem[] {
        return [
            {
                label: 'Administración',
                items: [
                    { label: 'Inicio', icon: 'pi pi-fw pi-home', routerLink: ['/admin'] },
                    { label: 'Organización', icon: 'pi pi-fw pi-building', routerLink: ['/admin/organizacion'] },
                    { label: 'Usuarios', icon: 'pi pi-fw pi-users', routerLink: ['/admin/usuarios'] },
                ]
            },
            { separator: true },
            {
                label: 'Workflow',
                items: [
                    { label: 'Políticas', icon: 'pi pi-fw pi-sitemap', routerLink: ['/admin/politicas'] },
                    { label: 'Monitoreo', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/admin/monitoreo'] },
                ]
            },
            { separator: true },
            {
                label: 'Operación',
                items: [
                    { label: 'Clientes', icon: 'pi pi-fw pi-user', routerLink: ['/admin/clientes'] },
                    { label: 'Trámites', icon: 'pi pi-fw pi-file', routerLink: ['/admin/tramites'] },
                    { label: 'Bandeja de Tareas', icon: 'pi pi-fw pi-inbox', routerLink: ['/admin/tareas'] },
                ]
            },
        ];
    }

    private menuOfficer(): MenuItem[] {
        return [
            {
                label: 'Principal',
                items: [
                    { label: 'Inicio', icon: 'pi pi-fw pi-home', routerLink: ['/officer'] },
                ]
            },
            { separator: true },
            {
                label: 'Operación',
                items: [
                    { label: 'Clientes', icon: 'pi pi-fw pi-user', routerLink: ['/officer/clientes'] },
                    { label: 'Trámites', icon: 'pi pi-fw pi-file', routerLink: ['/officer/tramites'] },
                    { label: 'Bandeja de Tareas', icon: 'pi pi-fw pi-inbox', routerLink: ['/officer/tareas'] },
                ]
            },
        ];
    }
}
