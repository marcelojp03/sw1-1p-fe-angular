import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InstitucionService } from '@/core/services/institucion.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TooltipModule],
    templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
    private institucionService = inject(InstitucionService);
    router = inject(Router);

    totalInstituciones = signal(0);

    ngOnInit(): void {
        this.cargar();
    }

    cargar(): void {
        this.institucionService.listar().subscribe({
            next: (r) => { if (r.codigo === 200) this.totalInstituciones.set(r.data?.length ?? 0); }
        });
    }
}
