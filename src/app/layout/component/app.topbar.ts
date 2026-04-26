import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '@/core/services/auth.service';
import { CurrentUser } from '@/core/models/auth.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, MenuModule, AppConfigurator],
    templateUrl: './app.topbar.html'
})
export class AppTopbar implements OnInit, OnDestroy {
    @ViewChild('userMenu') userMenu!: Menu;
    usuario: CurrentUser | null = null;
    userMenuItems: MenuItem[] = [];
    layoutService = inject(LayoutService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private subs: Subscription[] = [];

    ngOnInit(): void {
        this.subs.push(
            this.authService.currentUser$.subscribe((user) => {
                this.usuario = user;
                this.buildUserMenu(user);
            })
        );
    }

    ngOnDestroy(): void { this.subs.forEach((s) => s.unsubscribe()); }

    private buildUserMenu(user: CurrentUser | null): void {
        const isAdmin = user?.roles.includes('ADMIN') ?? false;
        this.userMenuItems = [
            ...(user ? [{ label: user.fullName || user.email, disabled: true, styleClass: 'text-xs' }] : []),
            ...(isAdmin ? [{ label: 'Administrador', disabled: true, styleClass: 'text-xs text-primary' }] : []),
            { separator: true },
            { label: 'Mi perfil', icon: 'pi pi-user', command: () => this.router.navigate([isAdmin ? '/admin/perfil' : '/perfil']) },
            { separator: true },
            { label: 'Cerrar sesion', icon: 'pi pi-sign-out', command: () => this.authService.logout() }
        ];
    }

    toggleDarkMode(): void {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }
}