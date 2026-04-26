import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppMenuitem } from './app.menuitem';
import { MenuService } from '@/core/services/menu.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of menuService.items(); track item; let i = $index) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [index]="i" [root]="true"></li>
            }
            @if (item.separator) {
                <li class="menu-separator"></li>
            }
        }
    </ul>`
})
export class AppMenu {
    readonly menuService = inject(MenuService);
}
