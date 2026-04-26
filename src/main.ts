import { provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

// JointJS requiere 'global' (variable Node.js) en entornos browser
(window as any)['global'] = window;

bootstrapApplication(AppComponent, { ...appConfig, providers: [provideZoneChangeDetection(), ...appConfig.providers] }).catch((err) => console.error(err));
