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
    templateUrl: './login.html'
})
export class Login implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);
    layoutService = inject(LayoutService);

    email = '';
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
        if (!this.email || !this.password) {
            this.errorMessage = 'Ingrese correo y contraseña';
            return;
        }
        this.loading = true;
        this.errorMessage = '';
        this.authService.login(this.email, this.password).subscribe({
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
