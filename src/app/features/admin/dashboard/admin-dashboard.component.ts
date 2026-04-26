import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TooltipModule],
    templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent {
    router = inject(Router);
}
