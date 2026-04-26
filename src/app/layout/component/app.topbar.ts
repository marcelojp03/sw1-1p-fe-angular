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
    template: `
        <p-menu #userMenu [model]="userMenuItems" [popup]="true" appendTo="body" />
        <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo" routerLink="/">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                             style="background: linear-gradient(135deg, #0d2145, #1a4080)">
                            <i class="pi pi-graduation-cap text-white text-sm"></i>
                        </div>
                        <span class="font-bold text-lg tracking-tight text-surface-900 dark:text-surface-0">SIA</span>
                    </div>
                </a>
            </div>
            <div class="layout-topbar-actions">
                <div class="layout-config-menu">
                    <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                        <i [ngClass]="{ 'pi': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                    </button>
                    <div class="hidden">
                        <button class="layout-topbar-action layout-topbar-action-highlight"
                            pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein"
                            leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                            <i class="pi pi-palette"></i>
                        </button>
                        <app-configurator />
                    </div>
                </div>
                <button class="layout-topbar-menu-button layout-topbar-action"
                        pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein"
                        leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                    <i class="pi pi-ellipsis-v"></i>
                </button>
                <div class="layout-topbar-menu hidden lg:block">
                    <div class="layout-topbar-menu-content">
                        <button type="button" class="layout-topbar-action" (click)="userMenu.toggle($event)">
                            <i class="pi pi-user"></i>
                            <span>{{ usuario?.username || 'Perfil' }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
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
            ...(user ? [{ label: user.fullName || user.username, disabled: true, styleClass: 'text-xs' }] : []),
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