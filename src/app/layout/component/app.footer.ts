import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        Sistemas de Informacion II &copy; {{ currentYear }}
    </div>`
})
export class AppFooter {
    currentYear = new Date().getFullYear();
}
