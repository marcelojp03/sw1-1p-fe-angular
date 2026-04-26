import {
    Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, signal, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import * as joint from 'jointjs';
import { PoliticaService } from '../../../core/services/politica.service';
import { AuthService } from '../../../core/services/auth.service';
import {
    PolicyResponse, PolicyNode, PolicyTransition, NodeType,
} from '../../../core/models/wf.models';

interface NodeDef { type: NodeType; label: string; icon: string; color: string; shape: string; }
interface SelectedNodeData {
    cellId: string;
    nodeType: NodeType;
    label: string;
    assignedAreaId: number | null;
    estimatedMinutes: number | null;
    condition: string;
}

@Component({
    selector: 'app-admin-politica-diseñador',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ToastModule, ButtonModule, InputTextModule,
        InputNumberModule, SelectModule, CardModule, ProgressSpinnerModule,
        TagModule, DividerModule, TooltipModule,
    ],
    providers: [MessageService],
    styles: [`
        :host { display: block; height: 100%; }
        .canvas-wrapper { cursor: default; background: #f8fafc; }
        .canvas-wrapper.link-mode { cursor: crosshair; }
        #joint-canvas { width: 100%; min-height: 600px; }
        .palette-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 8px 12px; border-radius: 6px; cursor: pointer;
            border: 1px solid #e2e8f0; background: #fff; font-size: 13px;
            transition: background 0.15s;
        }
        .palette-btn:hover { background: #f1f5f9; }
        .palette-btn .dot { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; }
        .palette-btn .sq { width: 16px; height: 12px; border-radius: 3px; flex-shrink: 0; }
        .palette-btn .diamond { width: 14px; height: 14px; transform: rotate(45deg); border-radius: 2px; flex-shrink: 0; }
        .palette-btn .bar { width: 16px; height: 6px; border-radius: 1px; flex-shrink: 0; }
    `],
    template: `
    <div class="flex flex-col h-full">
      <p-toast />

      <!-- Toolbar -->
      <div class="flex items-center justify-between px-4 py-3 bg-surface-0 border-b border-surface-200">
        <div class="flex items-center gap-3">
          <p-button icon="pi pi-arrow-left" severity="secondary" [text]="true"
            (onClick)="router.navigate(['/admin/politicas'])" />
          @if (politica()) {
            <div>
              <span class="font-semibold">{{ politica()!.name }}</span>
              <span class="text-surface-400 text-sm ml-2">v{{ politica()!.version }}</span>
              <p-tag class="ml-2" [value]="politica()!.status"
                [severity]="politica()!.status === 'PUBLISHED' ? 'success' : politica()!.status === 'DRAFT' ? 'warn' : 'secondary'" />
            </div>
          }
        </div>
        <div class="flex items-center gap-2">
          <p-button
            [label]="linkMode() ? 'Modo: Conectar' : 'Modo: Mover'"
            [icon]="linkMode() ? 'pi pi-arrows-h' : 'pi pi-arrows-alt'"
            [severity]="linkMode() ? 'warn' : 'secondary'"
            size="small"
            [outlined]="true"
            (onClick)="toggleLinkMode()"
            pTooltip="Cambiar entre modo mover y modo conectar"
          />
          <p-button label="Guardar" icon="pi pi-save" size="small" [loading]="saving()"
            (onClick)="guardar()" />
          @if (politica()?.status === 'DRAFT') {
            <p-button label="Publicar" icon="pi pi-send" size="small" severity="success"
              [loading]="publishing()" (onClick)="publicar()" />
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center flex-1">
          <p-progressspinner />
        </div>
      }

      @if (!loading()) {
        <!-- Designer layout -->
        <div class="flex flex-1 overflow-hidden">

          <!-- Left: Palette -->
          <div class="w-52 flex-shrink-0 overflow-y-auto bg-surface-50 border-r border-surface-200 p-3">
            <p class="text-xs font-semibold text-surface-400 uppercase mb-3">Nodos</p>
            <div class="flex flex-col gap-2">
              @for (nd of nodeDefs; track nd.type) {
                <button class="palette-btn" (click)="addNode(nd)">
                  @switch (nd.shape) {
                    @case ('circle') { <span class="dot" [style.background]="nd.color"></span> }
                    @case ('diamond') { <span class="diamond" [style.background]="nd.color"></span> }
                    @case ('bar') { <span class="bar" [style.background]="nd.color"></span> }
                    @default { <span class="sq" [style.background]="nd.color"></span> }
                  }
                  <span>{{ nd.label }}</span>
                </button>
              }
            </div>
            <p-divider />
            <p class="text-xs font-semibold text-surface-400 uppercase mb-2">Ayuda</p>
            <p class="text-xs text-surface-400 leading-relaxed">
              Haz clic en un tipo para agregar al canvas.<br/>
              En <strong>modo conectar</strong>, arrastra desde un nodo origen al nodo destino.<br/>
              Selecciona un nodo para editar sus propiedades.
            </p>
          </div>

          <!-- Center: Canvas -->
          <div class="flex-1 overflow-auto canvas-wrapper" [class.link-mode]="linkMode()">
            <div #canvas id="joint-canvas"></div>
          </div>

          <!-- Right: Properties -->
          <div class="w-72 flex-shrink-0 overflow-y-auto bg-surface-50 border-l border-surface-200 p-3">
            @if (selected()) {
              <p class="text-xs font-semibold text-surface-400 uppercase mb-3">Propiedades del Nodo</p>

              <div class="flex flex-col gap-3">
                <div>
                  <label class="text-xs font-medium text-surface-500 block mb-1">Tipo</label>
                  <p-tag [value]="selected()!.nodeType" severity="info" />
                </div>

                <div>
                  <label class="text-xs font-medium text-surface-500 block mb-1">Etiqueta</label>
                  <input pInputText [(ngModel)]="selected()!.label" class="w-full text-sm"
                    (ngModelChange)="updateLabel($event)" />
                </div>

                @if (!['START','END','PARALLEL_SPLIT','PARALLEL_JOIN'].includes(selected()!.nodeType)) {
                  <div>
                    <label class="text-xs font-medium text-surface-500 block mb-1">Área asignada (ID)</label>
                    <p-inputnumber [(ngModel)]="selected()!.assignedAreaId"
                      [min]="1" class="w-full" inputStyleClass="w-full text-sm" />
                  </div>
                  <div>
                    <label class="text-xs font-medium text-surface-500 block mb-1">Tiempo estimado (min)</label>
                    <p-inputnumber [(ngModel)]="selected()!.estimatedMinutes"
                      [min]="1" class="w-full" inputStyleClass="w-full text-sm" />
                  </div>
                }

                @if (selected()!.nodeType === 'CONDITION') {
                  <div>
                    <label class="text-xs font-medium text-surface-500 block mb-1">Condición (expresión)</label>
                    <input pInputText [(ngModel)]="selected()!.condition" class="w-full text-sm"
                      placeholder="ej: amount > 1000" />
                  </div>
                }

                <p-button label="Eliminar nodo" icon="pi pi-trash" severity="danger"
                  size="small" [outlined]="true" class="w-full" (onClick)="deleteSelected()" />
              </div>
            } @else {
              <div class="flex flex-col items-center justify-center h-40 text-surface-400 text-sm text-center">
                <i class="pi pi-mouse text-2xl mb-2"></i>
                Selecciona un nodo para editar sus propiedades
              </div>
            }
          </div>
        </div>
      }
    </div>
    `,
})
export class AdminPoliticaDiseñadorComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('canvas', { static: false }) canvasEl!: ElementRef<HTMLDivElement>;

    private route = inject(ActivatedRoute);
    private politicaService = inject(PoliticaService);
    private auth = inject(AuthService);
    private message = inject(MessageService);
    private cdr = inject(ChangeDetectorRef);
    router = inject(Router);

    loading = signal(true);
    saving = signal(false);
    publishing = signal(false);
    linkMode = signal(false);
    politica = signal<PolicyResponse | null>(null);
    selected = signal<SelectedNodeData | null>(null);

    private graph!: joint.dia.Graph;
    private paper!: joint.dia.Paper;
    private policyId!: number;

    nodeDefs: NodeDef[] = [
        { type: 'START',          label: 'Inicio',          icon: 'pi-play',      color: '#000',    shape: 'circle'  },
        { type: 'MANUAL_FORM',    label: 'Formulario',      icon: 'pi-file-edit', color: '#3B82F6', shape: 'rect'    },
        { type: 'MANUAL_ACTION',  label: 'Acción Manual',   icon: 'pi-user',      color: '#8B5CF6', shape: 'rect'    },
        { type: 'CLIENT_TASK',    label: 'Tarea Cliente',   icon: 'pi-mobile',    color: '#06B6D4', shape: 'rect'    },
        { type: 'CONDITION',      label: 'Condición',       icon: 'pi-code',      color: '#F59E0B', shape: 'diamond' },
        { type: 'NOTIFICATION',   label: 'Notificación',    icon: 'pi-bell',      color: '#10B981', shape: 'rect'    },
        { type: 'PARALLEL_SPLIT', label: 'Bifurcación',     icon: 'pi-share-alt', color: '#64748B', shape: 'bar'     },
        { type: 'PARALLEL_JOIN',  label: 'Unión',           icon: 'pi-sitemap',   color: '#64748B', shape: 'bar'     },
        { type: 'END',            label: 'Fin',             icon: 'pi-stop',      color: '#EF4444', shape: 'circle'  },
    ];

    ngOnInit(): void {
        this.policyId = Number(this.route.snapshot.paramMap.get('id'));
        this.politicaService.get(this.policyId).subscribe({
            next: (p) => { this.politica.set(p); this.loading.set(false); this.cdr.detectChanges(); setTimeout(() => this.initCanvas(p), 0); },
            error: () => { this.loading.set(false); this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la política' }); },
        });
    }

    ngAfterViewInit(): void { /* canvas initialized after data loads */ }
    ngOnDestroy(): void { if (this.paper) { (this.paper as any).remove?.(); } }

    private initCanvas(p: PolicyResponse): void {
        if (!this.canvasEl?.nativeElement) return;
        this.graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        this.paper = new joint.dia.Paper({
            el: this.canvasEl.nativeElement,
            model: this.graph,
            width: '100%',
            height: 600,
            gridSize: 10,
            drawGrid: { name: 'dot', args: [{ color: '#cbd5e1', thickness: 1 }] } as any,
            background: { color: '#f8fafc' },
            cellViewNamespace: joint.shapes,
            interactive: () => !this.linkMode(),
            defaultLink: () => new joint.shapes.standard.Link({
                attrs: { line: { stroke: '#64748b', strokeWidth: 2, targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 Z' } } },
            }),
            linkPinning: false,
            validateConnection: (cvS: any, _mS: any, cvT: any) => cvS.model !== cvT.model,
        } as any);

        // Load existing diagram
        if (p.diagram && p.diagram.cells?.length) {
            this.graph.fromJSON(p.diagram);
        }

        // Events
        this.paper.on('element:pointerclick', (view: any) => {
            if (this.linkMode()) return;
            this.onSelectElement(view.model as joint.dia.Element);
        });
        this.paper.on('blank:pointerclick', () => { this.selected.set(null); });
    }

    addNode(nd: NodeDef): void {
        if (!this.graph) return;
        const el = this.buildShape(nd, 80 + Math.random() * 300, 80 + Math.random() * 300);
        this.graph.addCell(el);
    }

    private buildShape(nd: NodeDef, x: number, y: number): joint.dia.Element {
        const data = { nodeType: nd.type, label: nd.label };

        if (nd.shape === 'circle') {
            const isEnd = nd.type === 'END';
            return new joint.shapes.standard.Circle({
                position: { x, y },
                size: { width: 48, height: 48 },
                attrs: {
                    body: { fill: nd.type === 'START' ? '#000' : '#fff', stroke: '#000', strokeWidth: isEnd ? 6 : 1.5 },
                    label: { text: nd.label, fill: nd.type === 'START' ? '#fff' : '#000', fontSize: 10, textAnchor: 'middle', refX: '50%', refY: '130%' },
                },
                data,
            } as any);
        }

        if (nd.shape === 'diamond') {
            return new joint.shapes.standard.Polygon({
                position: { x, y },
                size: { width: 90, height: 70 },
                attrs: {
                    body: { refPoints: '45 0, 90 35, 45 70, 0 35', fill: '#FEF3C7', stroke: '#D97706', strokeWidth: 1.5 },
                    label: { text: nd.label, fill: '#92400E', fontSize: 11, textAnchor: 'middle', refX: '50%', refY: '50%' },
                },
                data,
            } as any);
        }

        if (nd.shape === 'bar') {
            return new joint.shapes.standard.Rectangle({
                position: { x, y },
                size: { width: 120, height: 12 },
                attrs: {
                    body: { fill: '#334155', stroke: '#334155', rx: 0 },
                    label: { text: nd.label, fill: '#fff', fontSize: 9, textAnchor: 'middle', refX: '50%', refY: '-150%' },
                },
                data,
            } as any);
        }

        // Default: rect
        const colorMap: Partial<Record<NodeType, { bg: string; border: string; text: string }>> = {
            MANUAL_FORM:   { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
            MANUAL_ACTION: { bg: '#F3E8FF', border: '#8B5CF6', text: '#6B21A8' },
            CLIENT_TASK:   { bg: '#ECFEFF', border: '#06B6D4', text: '#155E75' },
            NOTIFICATION:  { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
        };
        const c = colorMap[nd.type] ?? { bg: '#F8FAFC', border: '#94A3B8', text: '#0F172A' };
        const isDashed = nd.type === 'CLIENT_TASK';
        return new joint.shapes.standard.Rectangle({
            position: { x, y },
            size: { width: 130, height: 50 },
            attrs: {
                body: { fill: c.bg, stroke: c.border, strokeWidth: 1.5, rx: 8, strokeDasharray: isDashed ? '5,3' : '' },
                label: { text: nd.label, fill: c.text, fontSize: 12, textAnchor: 'middle', refX: '50%', refY: '50%', textWrap: { width: 120, height: 40 } },
            },
            data,
        } as any);
    }

    private onSelectElement(el: joint.dia.Element): void {
        const data = (el as any).get('data') ?? {};
        const label = el.attr('label/text') as string ?? '';
        this.selected.set({
            cellId: el.id as string,
            nodeType: data.nodeType ?? 'MANUAL_FORM',
            label,
            assignedAreaId: data.assignedAreaId ?? null,
            estimatedMinutes: data.estimatedMinutes ?? null,
            condition: data.condition ?? '',
        });
    }

    updateLabel(newLabel: string): void {
        const sel = this.selected();
        if (!sel) return;
        const el = this.graph.getCell(sel.cellId) as joint.dia.Element;
        if (!el) return;
        el.attr('label/text', newLabel);
    }

    deleteSelected(): void {
        const sel = this.selected();
        if (!sel) return;
        const el = this.graph.getCell(sel.cellId);
        if (el) el.remove();
        this.selected.set(null);
    }

    toggleLinkMode(): void {
        this.linkMode.set(!this.linkMode());
        if (this.paper) {
            (this.paper as any).setInteractivity(!this.linkMode());
        }
    }

    guardar(): void {
        if (!this.graph) return;
        this.saving.set(true);

        const cells = this.graph.getCells();
        const elements = cells.filter(c => c.isElement());
        const links = cells.filter(c => c.isLink());

        const nodes: PolicyNode[] = elements.map(el => {
            const data = (el as any).get('data') ?? {};
            return {
                id: el.id as string,
                nodeType: data.nodeType ?? 'MANUAL_FORM',
                label: el.attr('label/text') as string ?? '',
                assignedAreaId: data.assignedAreaId,
                estimatedMinutes: data.estimatedMinutes,
                position: (el as joint.dia.Element).position(),
                size: (el as joint.dia.Element).size(),
            };
        });

        const transitions: PolicyTransition[] = links.map(lk => {
            const src = (lk as any).get('source') as { id?: string };
            const tgt = (lk as any).get('target') as { id?: string };
            const data = (lk as any).get('data') ?? {};
            return {
                id: lk.id as string,
                from: src?.id ?? '',
                to: tgt?.id ?? '',
                label: lk.attr('labels/0/attrs/text/text') as string ?? '',
                condition: data.condition ?? '',
            };
        });

        const diagram = this.graph.toJSON();

        this.politicaService.updateDiagram(this.policyId, { diagram, nodes, transitions, swimlanes: [] }).subscribe({
            next: (p) => {
                this.saving.set(false);
                this.politica.set(p);
                this.message.add({ severity: 'success', summary: 'Guardado', detail: 'Diagrama guardado correctamente' });
            },
            error: () => {
                this.saving.set(false);
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el diagrama' });
            },
        });
    }

    publicar(): void {
        this.publishing.set(true);
        this.politicaService.publish(this.policyId).subscribe({
            next: (p) => {
                this.publishing.set(false);
                this.politica.set(p);
                this.message.add({ severity: 'success', summary: 'Publicada', detail: 'Política publicada exitosamente' });
            },
            error: () => {
                this.publishing.set(false);
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo publicar la política' });
            },
        });
    }
}
