import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from './app.menuitem';
import { MenuService } from '@/core/services/menu.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [AppMenuitem, RouterModule],
    templateUrl: './app.menu.html'
})
export class AppMenu {
    readonly menuService = inject(MenuService);
}
