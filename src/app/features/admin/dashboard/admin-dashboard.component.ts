import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BadgeModule } from 'primeng/badge';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardSummaryResponse } from './dashboard.model';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TooltipModule, ChartModule, ProgressSpinnerModule, BadgeModule],
    templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
    router = inject(Router);
    private dashboardService = inject(DashboardService);
    private authService = inject(AuthService);

    loading = signal(true);
    summary = signal<DashboardSummaryResponse | null>(null);
    chartData: any = null;
    chartOptions: any = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
        },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
    };

    private readonly statusColors: Record<string, string> = {
        IN_PROGRESS:    '#3b82f6',
        COMPLETED:      '#22c55e',
        CANCELLED:      '#ef4444',
        WAITING_CLIENT: '#f59e0b',
    };

    private readonly statusLabels: Record<string, string> = {
        IN_PROGRESS:    'En curso',
        COMPLETED:      'Completados',
        CANCELLED:      'Cancelados',
        WAITING_CLIENT: 'Esperando cliente',
    };

    ngOnInit(): void {
        const orgId = this.authService.currentUserSignal()?.organizationId;
        if (!orgId) { this.loading.set(false); return; }

        this.dashboardService.summary(orgId).subscribe({
            next: (s) => {
                this.summary.set(s);
                this.buildChart(s.proceduresByStatus);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    private buildChart(byStatus: Record<string, number>): void {
        const labels = Object.keys(byStatus).map(k => this.statusLabels[k] ?? k);
        const data = Object.values(byStatus);
        const bgColors = Object.keys(byStatus).map(k => this.statusColors[k] ?? '#94a3b8');
        this.chartData = {
            labels,
            datasets: [{
                label: 'Trámites',
                data,
                backgroundColor: bgColors,
                borderRadius: 6,
            }],
        };
    }
}
