import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@/core/services/auth.service';
import { LayoutService } from '../../layout/service/layout.service';
import { AppConfigurator } from '../../layout/component/app.configurator';
import { StyleClassModule } from 'primeng/styleclass';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, ToastModule, FloatLabelModule, MessageModule, CommonModule, StyleClassModule, AppConfigurator],
    providers: [MessageService],
    template: `
        <p-toast position="top-center" />
        <div class="min-h-screen flex">

            <!-- Left branded panel -->
            <div class="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col items-center justify-center"
                 style="background: linear-gradient(160deg, #071225 0%, #0d2145 55%, #0a2e60 100%)">
                <!-- Decorative glow circles -->
                <div class="absolute top-[-8%] right-[-12%] w-96 h-96 rounded-full pointer-events-none"
                     style="background: radial-gradient(circle, rgba(79,195,247,0.12), transparent 70%)"></div>
                <div class="absolute bottom-[-12%] left-[-8%] w-80 h-80 rounded-full pointer-events-none"
                     style="background: radial-gradient(circle, rgba(41,121,255,0.10), transparent 70%)"></div>

                <div class="relative z-10 flex flex-col items-center text-center px-12 max-w-xs">
                    <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
                         style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12)">
                        <i class="pi pi-graduation-cap text-white" style="font-size: 2.2rem"></i>
                    </div>

                    <h1 class="text-white text-4xl font-bold mb-3 tracking-tight">SIA</h1>
                    <p class="text-white/70 text-base mb-2 font-medium">Sistema de Información Académica</p>

                    <div class="grid grid-cols-2 gap-3 w-full">
                        <div class="flex flex-col items-center gap-2 rounded-xl py-3 px-2 text-center"
                             style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08)">
                            <i class="pi pi-building text-white/60 text-lg"></i>
                            <span class="text-white/60 text-xs leading-tight">Instituciones</span>
                        </div>
                        <div class="flex flex-col items-center gap-2 rounded-xl py-3 px-2 text-center"
                             style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08)">
                            <i class="pi pi-calendar text-white/60 text-lg"></i>
                            <span class="text-white/60 text-xs leading-tight">Gestiones</span>
                        </div>
                        <div class="flex flex-col items-center gap-2 rounded-xl py-3 px-2 text-center"
                             style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08)">
                            <i class="pi pi-book text-white/60 text-lg"></i>
                            <span class="text-white/60 text-xs leading-tight">Cursos</span>
                        </div>
                        <div class="flex flex-col items-center gap-2 rounded-xl py-3 px-2 text-center"
                             style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08)">
                            <i class="pi pi-users text-white/60 text-lg"></i>
                            <span class="text-white/60 text-xs leading-tight">Estudiantes</span>
                        </div>
                    </div>
                </div>

                <!-- <div class="absolute bottom-8 text-white/20 text-xs">
                    UAGRM &mdash; Semestre 1 / 2026
                </div> -->
            </div>

            <!-- Right form panel -->
            <div class="w-full lg:w-7/12 flex items-center justify-center bg-surface-0 dark:bg-surface-950 p-8 relative">
                <!-- Dark mode toggle -->
                <button type="button" class="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }" class="text-lg"></i>
                </button>

                <div class="hidden">
                        <button
                            class="layout-topbar-action layout-topbar-action-highlight"
                            pStyleClass="@next"
                            enterFromClass="hidden"
                            enterActiveClass="animate-scalein"
                            leaveToClass="hidden"
                            leaveActiveClass="animate-fadeout"
                            [hideOnOutsideClick]="true"
                        >
                            <i class="pi pi-palette"></i>
                        </button>
                        <app-configurator />
                </div>
                <div class="w-full max-w-sm">

                    <!-- Logo -->
                    <div class="flex justify-center mb-10">
                        <div class="w-14 h-14 rounded-xl flex items-center justify-center"
                             style="background: linear-gradient(135deg, #0d2145, #0a2e60)">
                            <i class="pi pi-graduation-cap text-white text-2xl"></i>
                        </div>
                    </div>

                    <div class="flex justify-center mb-8">
                        <h2 class="text-surface-900 dark:text-surface-0 text-2xl font-bold mb-1">Iniciar sesión</h2>
                    </div>

                    @if (sessionExpired) {
                        <p-message severity="warn" styleClass="w-full mb-4">
                            <span class="flex items-center gap-2">
                                <i class="pi pi-clock"></i>
                                Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
                            </span>
                        </p-message>
                    }

                    <div class="flex flex-col gap-5">
                        <p-floatlabel variant="on">
                            <input pInputText id="username" type="text" class="w-full" autocomplete="username"
                                   [(ngModel)]="username" (keyup.enter)="onLogin()" />
                            <label for="username">Usuario</label>
                        </p-floatlabel>

                        <p-floatlabel variant="on">
                            <p-password id="password" [(ngModel)]="password" [toggleMask]="true"
                                        [fluid]="true" [feedback]="false" (keyup.enter)="onLogin()" />
                            <label for="password">Contraseña</label>
                        </p-floatlabel>

                        @if (errorMessage) {
                            <p-message severity="error" styleClass="w-full">
                                <span class="flex items-center gap-2">
                                    <i class="pi pi-times-circle"></i>
                                    {{ errorMessage }}
                                </span>
                            </p-message>
                        }

                        <p-button label="Ingresar" icon="pi pi-sign-in" styleClass="w-full mt-1"
                                  [loading]="loading" (onClick)="onLogin()" />
                    </div>

                </div>
            </div>
        </div>
    `
})
export class Login implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);
    layoutService = inject(LayoutService);

    username = '';
    password = '';
    loading = false;
    sessionExpired = false;
    errorMessage = '';

    ngOnInit(): void {
        this.sessionExpired = this.route.snapshot.queryParamMap.get('sessionExpired') === '1';
    }

    toggleDarkMode(): void {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    onLogin(): void {
        if (!this.username || !this.password) {
            this.errorMessage = 'Ingrese usuario y contraseña';
            return;
        }
        this.loading = true;
        this.errorMessage = '';
        this.authService.login(this.username, this.password).subscribe({
            next: (res) => {
                this.loading = false;
                const user = this.authService.getCurrentUser();
                this.messageService.add({ severity: 'success', summary: '¡Bienvenido!', detail: 'Inicio de sesión exitoso', life: 1500 });
                const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
                setTimeout(() => {
                    if (returnUrl) {
                        this.router.navigateByUrl(returnUrl);
                    } else if (user?.roles.includes('ADMIN')) {
                        this.router.navigate(['/admin']);
                    } else {
                        this.router.navigate(['/']);
                    }
                }, 1500);
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage = err.error?.message || err.error?.mensaje || 'Credenciales inválidas';
            }
        });
    }
}
