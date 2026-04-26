import { Component, OnInit, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { AuthService } from '@/core/services/auth.service';
import { CurrentUser } from '@/core/models/auth.model';

@Component({
    selector: 'app-perfil',
    standalone: true,
    imports: [CardModule, TagModule, DividerModule],
    templateUrl: './perfil.component.html'
})
export class PerfilComponent implements OnInit {
    private authService = inject(AuthService);

    user: CurrentUser | null = null;

    ngOnInit(): void {
        this.authService.currentUser$.subscribe((u) => (this.user = u));
    }
}
