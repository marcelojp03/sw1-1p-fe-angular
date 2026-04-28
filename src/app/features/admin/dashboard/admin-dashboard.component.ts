import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BadgeModule } from 'primeng/badge';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { AiPoliticaService } from '../politicas/ai-politica.service';
import { DashboardSummaryResponse, AverageTimeByNodeItem } from './dashboard.model';
import { AnalyzeBottlenecksRequest, BottleneckItem } from '../politicas/ai-politica.model';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule, FormsModule, CardModule, ButtonModule, TooltipModule,
        ChartModule, ProgressSpinnerModule, BadgeModule, SelectModule, TableModule, TagModule,
    ],
    templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
    router = inject(Router);
    private dashboardService = inject(DashboardService);
    private authService = inject(AuthService);
    private http = inject(HttpClient);
    private aiService = inject(AiPoliticaService);

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

    avgTimeNodes = signal<AverageTimeByNodeItem[]>([]);
    avgTimeLoading = signal(false);
    policies = signal<{ id: string; name: string }[]>([]);
    selectedPolicyIdModel = '';

    bottlenecks = signal<BottleneckItem[]>([]);
    bottleneckRecommendations = signal<string[]>([]);
    bottleneckLoading = signal(false);
    connectedUsers = signal<number>(0);

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
        this.cargarPoliticas();
        this.cargarTiempoPromedio();
        this.cargarUsuariosConectados();
    }

    cargarPoliticas(): void {        const orgId = this.authService.currentUserSignal()?.organizationId;
        if (!orgId) return;
        this.http.get<any>(`${environment.api.baseUrl}/policies`, {
            params: { organizationId: String(orgId) },
        }).subscribe({
            next: (data) => {
                const items: any[] = Array.isArray(data) ? data : (data.content ?? []);
                this.policies.set(items.map(p => ({ id: p.id, name: p.name })));
            },
        });
    }

    cargarUsuariosConectados(): void {
        this.http.get<{ count: number }>(`${environment.api.baseUrl}/dashboard/connected-users`).subscribe({
            next: (res) => this.connectedUsers.set(res.count),
            error: () => {},
        });
    }

    cargarTiempoPromedio(): void {        const orgId = this.authService.currentUserSignal()?.organizationId;
        if (!orgId) return;
        this.avgTimeLoading.set(true);
        const policyId = this.selectedPolicyIdModel || undefined;
        this.dashboardService.averageTimeByNode(orgId, policyId).subscribe({
            next: (items) => { this.avgTimeNodes.set(items); this.avgTimeLoading.set(false); },
            error: () => this.avgTimeLoading.set(false),
        });
    }

    filtrarPorPolitica(): void {
        const orgId = this.authService.currentUserSignal()?.organizationId;
        if (!orgId) return;
        this.cargarTiempoPromedio();
        this.dashboardService.proceduresByStatus(orgId, this.selectedPolicyIdModel || undefined).subscribe({
            next: (data) => this.buildChart(
                data.items.reduce((acc, item) => ({ ...acc, [item.status]: item.count }), {} as Record<string, number>)
            ),
        });
    }

    analizarCuellos(): void {
        const nodes = this.avgTimeNodes();
        if (nodes.length === 0) return;
        const orgId = this.authService.currentUserSignal()?.organizationId;
        if (!orgId) return;
        this.bottleneckLoading.set(true);
        const selectedPolicy = this.policies().find(p => p.id === this.selectedPolicyIdModel);
        const req: AnalyzeBottlenecksRequest = {
            policyName: selectedPolicy?.name ?? 'Todas las políticas',
            metrics: nodes.map(n => ({
                nodeId: n.nodeId,
                label: n.nodeLabel,
                avgDurationHours: n.avgDurationHours,
                expectedHours: n.expectedHours ?? null,
                pendingTasks: 0,
                completedTasks: n.completedCount,
                cancelledTasks: 0,
            })),
            language: 'es',
        };
        this.aiService.analyzeBottlenecks(req, orgId).subscribe({
            next: (res) => {
                this.bottlenecks.set(res.bottlenecks);
                this.bottleneckRecommendations.set(res.generalRecommendations);
                this.bottleneckLoading.set(false);
            },
            error: () => this.bottleneckLoading.set(false),
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
