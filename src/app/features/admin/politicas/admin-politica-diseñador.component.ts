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
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import * as joint from 'jointjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { PoliticaService } from './politicas.service';
import { AuthService } from '../../../core/services/auth.service';
import {
    PolicyResponse, PolicyNode, PolicyTransition, NodeType,
} from './politica.model';
import { FormField } from '../../officer/tareas/tarea.model';
import { AiPoliticaService } from './ai-politica.service';
import {
    NodeSuggestion, TransitionSuggestion, FieldSuggestion,
} from './ai-politica.model';
import { DiagramPatchMessage } from '../../../shared/models/chat.model';
import { environment } from '../../../../environments/environment';

interface NodeDef { type: NodeType; label: string; icon: string; color: string; shape: string; }
interface SelectedNodeData {
    cellId: string;
    nodeType: NodeType;
    label: string;
    assignedAreaId: number | null;
    estimatedMinutes: number | null;
    condition: string;
    formFields: FormField[];
}

@Component({
    selector: 'app-admin-politica-diseñador',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ToastModule, ButtonModule, InputTextModule,
        InputNumberModule, SelectModule, CardModule, ProgressSpinnerModule,
        TagModule, DividerModule, TooltipModule, DialogModule, CheckboxModule,
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
    templateUrl: './admin-politica-diseñador.component.html',
})
export class AdminPoliticaDiseñadorComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('canvas', { static: false }) canvasEl!: ElementRef<HTMLDivElement>;

    private route = inject(ActivatedRoute);
    private politicaService = inject(PoliticaService);
    private auth = inject(AuthService);
    private message = inject(MessageService);
    private cdr = inject(ChangeDetectorRef);
    private aiService = inject(AiPoliticaService);
    router = inject(Router);

    loading = signal(true);
    saving = signal(false);
    publishing = signal(false);
    linkMode = signal(false);
    politica = signal<PolicyResponse | null>(null);
    selected = signal<SelectedNodeData | null>(null);
    selectedLink = signal<{ cellId: string; label: string; condition: string } | null>(null);
    formDialogVisible = false;
    newField = { name: '', label: '', type: 'TEXT', required: false, optionsStr: '' };

    // IA signals
    aiLoading = signal(false);
    aiFieldsLoading = signal(false);
    aiDialogVisible = false;
    aiFieldsDialogVisible = false;
    aiSuggestions = signal<NodeSuggestion[]>([]);
    aiTransitions = signal<TransitionSuggestion[]>([]);
    aiFieldSuggestions = signal<FieldSuggestion[]>([]);
    aiCalled = signal(false);
    fieldTypes = [
        { label: 'Texto', value: 'TEXT' },
        { label: 'Número', value: 'NUMBER' },
        { label: 'Área de texto', value: 'TEXTAREA' },
        { label: 'Fecha', value: 'DATE' },
        { label: 'Selección', value: 'SELECT' },
        { label: 'Booleano', value: 'BOOLEAN' },
        { label: 'Archivo', value: 'FILE' },
    ];

    private graph!: joint.dia.Graph;
    private paper!: joint.dia.Paper;
    private policyId!: number;
    private stompClient?: Client;
    private wsUrl = environment.api.baseUrl.replace('/api', '') + '/ws';
    private isReceivingPatch = false;

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
        this.conectarDiagramaWS();
    }

    ngAfterViewInit(): void { /* canvas initialized after data loads */ }
    ngOnDestroy(): void {
        if (this.paper) { (this.paper as any).remove?.(); }
        this.stompClient?.deactivate();
    }

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
            this.selectedLink.set(null);
            this.onSelectElement(view.model as joint.dia.Element);
        });
        this.paper.on('link:pointerclick', (view: any) => {
            if (this.linkMode()) return;
            this.selected.set(null);
            this.onSelectLink(view.model as joint.dia.Link);
        });
        this.paper.on('blank:pointerclick', () => {
            this.selected.set(null);
            this.selectedLink.set(null);
        });
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
            formFields: (data.form?.fields ?? []) as FormField[],
        });
    }

    private onSelectLink(lk: joint.dia.Link): void {
        const data = (lk as any).get('data') ?? {};
        const labelEntry = (lk as any).label(0);
        const label = labelEntry?.attrs?.text?.text as string ?? '';
        this.selectedLink.set({
            cellId: lk.id as string,
            label,
            condition: data.condition ?? '',
        });
    }

    updateLinkLabel(newLabel: string): void {
        const sl = this.selectedLink();
        if (!sl) return;
        const lk = this.graph.getCell(sl.cellId) as joint.dia.Link;
        if (!lk) return;
        lk.label(0, { attrs: { text: { text: newLabel } } });
        this.selectedLink.set({ ...sl, label: newLabel });
    }

    updateLinkCondition(newCond: string): void {
        const sl = this.selectedLink();
        if (!sl) return;
        const lk = this.graph.getCell(sl.cellId) as joint.dia.Link;
        if (!lk) return;
        const data = (lk as any).get('data') ?? {};
        (lk as any).set('data', { ...data, condition: newCond });
        this.selectedLink.set({ ...sl, condition: newCond });
    }

    deleteSelectedLink(): void {
        const sl = this.selectedLink();
        if (!sl) return;
        const lk = this.graph.getCell(sl.cellId);
        if (lk) lk.remove();
        this.selectedLink.set(null);
    }

    openFormFieldDialog(): void {
        this.newField = { name: '', label: '', type: 'TEXT', required: false, optionsStr: '' };
        this.formDialogVisible = true;
    }

    saveNewFormField(): void {
        if (!this.newField.name.trim() || !this.newField.label.trim()) return;
        const sel = this.selected();
        if (!sel) return;
        const field: FormField = {
            name: this.newField.name.trim(),
            label: this.newField.label.trim(),
            type: this.newField.type as any,
            required: this.newField.required,
            options: this.newField.type === 'SELECT'
                ? this.newField.optionsStr.split(',').map(s => s.trim()).filter(Boolean)
                : undefined,
        };
        const updatedFields = [...sel.formFields, field];
        this.updateNodeFormData(sel.cellId, updatedFields);
        this.selected.set({ ...sel, formFields: updatedFields });
        this.formDialogVisible = false;
    }

    removeFormField(index: number): void {
        const sel = this.selected();
        if (!sel) return;
        const updatedFields = sel.formFields.filter((_, i) => i !== index);
        this.updateNodeFormData(sel.cellId, updatedFields);
        this.selected.set({ ...sel, formFields: updatedFields });
    }

    private updateNodeFormData(cellId: string, fields: FormField[]): void {
        const el = this.graph.getCell(cellId) as joint.dia.Element;
        if (!el) return;
        const data = (el as any).get('data') ?? {};
        (el as any).set('data', { ...data, form: { fields } });
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
                form: data.form,
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
                if (this.stompClient?.connected && !this.isReceivingPatch) {
                    const patch: DiagramPatchMessage = {
                        policyId: String(this.policyId),
                        senderUserId: String(this.auth.currentUserSignal()?.id ?? ''),
                        cells: diagram.cells ?? [],
                        sentAt: new Date().toISOString(),
                    };
                    this.stompClient.publish({
                        destination: `/app/diagram/${this.policyId}`,
                        body: JSON.stringify(patch),
                    });
                }
            },
            error: () => {
                this.saving.set(false);
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el diagrama' });
            },
        });
    }

    private conectarDiagramaWS(): void {
        this.stompClient = new Client({
            webSocketFactory: () => new SockJS(this.wsUrl) as any,
            reconnectDelay: 5000,
            onConnect: () => {
                this.stompClient!.subscribe(`/topic/diagram/${this.policyId}`, (frame) => {
                    const patch: DiagramPatchMessage = JSON.parse(frame.body);
                    const currentUserId = String(this.auth.currentUserSignal()?.id ?? '');
                    if (patch.senderUserId === currentUserId) return;
                    if (!this.graph || !patch.cells?.length) return;
                    this.isReceivingPatch = true;
                    this.graph.fromJSON({ cells: patch.cells });
                    this.isReceivingPatch = false;
                });
            },
        });
        this.stompClient.activate();
    }

    private get orgId(): number {
        return this.auth.currentUserSignal()?.organizationId ?? 0;
    }

    abrirDialogoAI(): void {
        const p = this.politica();
        if (!p) return;
        this.aiDialogVisible = true;
        this.aiLoading.set(true);
        this.aiCalled.set(false);
        this.aiSuggestions.set([]);
        this.aiTransitions.set([]);

        const existingNodes = this.graph?.getElements().map(el => ({
            nodeId: el.id as string,
            type: (el as any).get('data')?.nodeType ?? '',
            label: el.attr('label/text') as string ?? '',
        })) ?? [];

        this.aiService.suggestWorkflow({
            organizationName: '',
            policyName: p.name,
            policyDescription: (p as any).description ?? '',
            existingNodes,
            language: 'es',
        }, this.orgId).subscribe({
            next: (res) => {
                this.aiSuggestions.set(res.suggestions ?? []);
                this.aiTransitions.set(res.suggestedTransitions ?? []);
                this.aiLoading.set(false);
                this.aiCalled.set(true);
            },
            error: (err) => {
                this.aiLoading.set(false);
                this.aiCalled.set(true);
                this.message.add({ severity: 'error', summary: 'Error IA', detail: err?.error?.message ?? 'No se pudo obtener sugerencias' });
            },
        });
    }

    agregarNodoDesdeIA(s: NodeSuggestion): void {
        const nd = this.nodeDefs.find(n => n.type === (s.type as NodeType)) ?? {
            type: s.type as NodeType, label: s.label, icon: 'pi-box', color: '#94A3B8', shape: 'rect',
        };
        this.addNode({ ...nd, label: s.label });
    }

    sugerirCamposIA(): void {
        const sel = this.selected();
        const p = this.politica();
        if (!sel || !p) return;
        this.aiFieldsDialogVisible = true;
        this.aiFieldsLoading.set(true);
        this.aiFieldSuggestions.set([]);

        this.aiService.suggestFormFields({
            policyName: p.name,
            nodeLabel: sel.label,
            nodeType: sel.nodeType,
            areaName: '',
            existingFields: sel.formFields.map(f => f.label),
            language: 'es',
        }, this.orgId).subscribe({
            next: (res) => {
                this.aiFieldSuggestions.set(res.suggestions ?? []);
                this.aiFieldsLoading.set(false);
            },
            error: (err) => {
                this.aiFieldsLoading.set(false);
                this.message.add({ severity: 'error', summary: 'Error IA', detail: err?.error?.message ?? 'No se pudo obtener sugerencias de campos' });
            },
        });
    }

    agregarCampoDesdeIA(f: FieldSuggestion): void {
        const sel = this.selected();
        if (!sel) return;
        const field: FormField = {
            name: f.fieldId,
            label: f.label,
            type: f.type as any,
            required: f.required,
            options: f.options,
        };
        const updatedFields = [...sel.formFields, field];
        this.updateNodeFormData(sel.cellId, updatedFields);
        this.selected.set({ ...sel, formFields: updatedFields });
        this.aiFieldsDialogVisible = false;
    }

    publicar(): void {        this.publishing.set(true);
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
