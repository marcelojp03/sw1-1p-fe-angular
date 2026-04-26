import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/** @deprecated Legacy model for empresa features not used in SIA */
export interface EmpresaRol {
    empresaId: number;
    nombreEmpresa: string;
    rolEmpresaCodigo: string;
}

@Injectable({ providedIn: 'root' })
export class EmpresaService {
    private readonly EMPRESA_KEY = 'vpay_empresa_activa';

    private empresaActivaSubject = new BehaviorSubject<EmpresaRol | null>(this.getFromStorage());
    public empresaActiva$ = this.empresaActivaSubject.asObservable();

    setEmpresaActiva(empresa: EmpresaRol): void {
        localStorage.setItem(this.EMPRESA_KEY, JSON.stringify(empresa));
        this.empresaActivaSubject.next(empresa);
    }

    getEmpresaActiva(): EmpresaRol | null {
        return this.empresaActivaSubject.value;
    }

    getEmpresaId(): number | null {
        return this.empresaActivaSubject.value?.empresaId ?? null;
    }

    clear(): void {
        localStorage.removeItem(this.EMPRESA_KEY);
        this.empresaActivaSubject.next(null);
    }

    private getFromStorage(): EmpresaRol | null {
        const str = localStorage.getItem(this.EMPRESA_KEY);
        if (!str) return null;
        try {
            return JSON.parse(str);
        } catch {
            return null;
        }
    }
}
