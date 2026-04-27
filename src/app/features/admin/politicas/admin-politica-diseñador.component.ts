import {
    Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, signal, computed, ChangeDetectorRef,
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
import { dia, ui, shapes } from '@joint/plus';
import {
    BPMNPool, BPMNPoolView, BPMNLane, BPMNLaneView,
    APP_SHAPES, DEFAULT_POOL_WIDTH, MIN_LANE_SIZE, LANE_HEADER_SIZE,
} from './bpmn-shapes';
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

interface NodeDef { type: NodeType; label: string; icon: string; color: string; bpmnType: 'event' | 'activity' | 'gateway'; }
interface SelectedNodeData {
    cellId: string;
    nodeType: NodeType;
    label: string;
    assignedAreaId: number | null;
    estimatedMinutes: number | null;
    condition: string;
    formFields: FormField[];
}
interface SelectedLaneData {
    cellId: string;
    label: string;
    areaId: string;
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
        .canvas-wrapper { overflow: hidden; background: #f1f5f9; }
        .canvas-wrapper.link-mode { cursor: crosshair; }
        #joint-canvas { width: 100%; height: 100%; }
        .palette-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 8px 10px; border-radius: 6px; cursor: pointer;
            border: 1px solid #e2e8f0; background: #fff; font-size: 12px;
            transition: background 0.15s; text-align: left;
        }
        .palette-btn:hover { background: #f1f5f9; }
        .palette-btn .dot { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; }
        .palette-btn .sq  { width: 16px; height: 12px; border-radius: 3px; flex-shrink: 0; }
        .palette-btn .diamond { width: 14px; height: 14px; transform: rotate(45deg); border-radius: 2px; flex-shrink: 0; }
        .palette-btn.lane-btn { background: #f8fafc; border-style: dashed; }
        .palette-btn.lane-btn:hover { background: #e2e8f0; }
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
    selectedLane = signal<SelectedLaneData | null>(null);
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

    /** Política publicada o archivada → solo lectura */
    readonly isReadOnly = computed(() => {
        const s = this.politica()?.status;
        return s === 'PUBLISHED' || s === 'ARCHIVED';
    });

    fieldTypes = [
        { label: 'Texto', value: 'TEXT' },
        { label: 'Número', value: 'NUMBER' },
        { label: 'Área de texto', value: 'TEXTAREA' },
        { label: 'Fecha', value: 'DATE' },
        { label: 'Selección', value: 'SELECT' },
        { label: 'Booleano', value: 'BOOLEAN' },
        { label: 'Archivo', value: 'FILE' },
    ];

    private graph: dia.Graph;
    private paper: dia.Paper;
    private scroller: ui.PaperScroller;
    private pool: BPMNPool | null = null;
    private policyId!: string;
    private stompClient?: Client;
    private wsUrl = environment.api.baseUrl.replace('/api', '') + '/ws';
    private isReceivingPatch = false;

    nodeDefs: NodeDef[] = [
        { type: 'START',          label: 'Inicio',          icon: 'pi-play',      color: '#000',    bpmnType: 'event'    },
        { type: 'MANUAL_FORM',    label: 'Formulario',      icon: 'pi-file-edit', color: '#3B82F6', bpmnType: 'activity' },
        { type: 'MANUAL_ACTION',  label: 'Acción Manual',   icon: 'pi-user',      color: '#8B5CF6', bpmnType: 'activity' },
        { type: 'CLIENT_TASK',    label: 'Tarea Cliente',   icon: 'pi-mobile',    color: '#06B6D4', bpmnType: 'activity' },
        { type: 'CONDITION',      label: 'Condición',       icon: 'pi-code',      color: '#F59E0B', bpmnType: 'gateway'  },
        { type: 'NOTIFICATION',   label: 'Notificación',    icon: 'pi-bell',      color: '#10B981', bpmnType: 'activity' },
        { type: 'PARALLEL_SPLIT', label: 'Bifurcación',     icon: 'pi-share-alt', color: '#64748B', bpmnType: 'gateway'  },
        { type: 'PARALLEL_JOIN',  label: 'Unión',           icon: 'pi-sitemap',   color: '#64748B', bpmnType: 'gateway'  },
        { type: 'END',            label: 'Fin',             icon: 'pi-stop',      color: '#EF4444', bpmnType: 'event'    },
    ];

    ngOnInit(): void {
        this.policyId = this.route.snapshot.paramMap.get('id') ?? '';
        this.politicaService.get(this.policyId).subscribe({
            next: (p) => { this.politica.set(p); this.loading.set(false); this.cdr.detectChanges(); setTimeout(() => this.initCanvas(p), 0); },
            error: () => { this.loading.set(false); this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la política' }); },
        });
        this.conectarDiagramaWS();
    }

    ngAfterViewInit(): void { /* canvas initialized after data loads */ }

    ngOnDestroy(): void {
        this.scroller?.remove();
        this.stompClient?.deactivate();
    }

    private initCanvas(p: PolicyResponse): void {
        if (!this.canvasEl?.nativeElement) return;

        this.graph = new dia.Graph({}, { cellNamespace: APP_SHAPES });

        const el = this.canvasEl.nativeElement;
        const paperWidth = el.offsetWidth || 1600;
        const paperHeight = el.offsetHeight || 900;

        this.paper = new dia.Paper({
            model: this.graph,
            cellViewNamespace: APP_SHAPES,
            width: paperWidth,
            height: paperHeight,
            gridSize: 10,
            drawGrid: { name: 'dot', args: [{ color: '#cbd5e1', thickness: 1 }] } as any,
            background: { color: '#f1f5f9' },
            frozen: true,
            async: true,
            embeddingMode: true,
            findParentBy: 'center',
            frontParentOnly: false,
            linkPinning: false,
            defaultLink: () => new shapes.bpmn2.Flow() as unknown as dia.Link,
            validateConnection: (cvS: any, _mS: any, cvT: any) => {
                if (cvS === cvT) return false;
                const s = cvS.model, t = cvT.model;
                if (shapes.bpmn2.Swimlane.isSwimlane(s) || shapes.bpmn2.Swimlane.isSwimlane(t)) return false;
                if (shapes.bpmn2.CompositePool.isPool(s) || shapes.bpmn2.CompositePool.isPool(t)) return false;
                return true;
            },
            validateEmbedding: (childView: any, parentView: any) => {
                const child = childView.model, parent = parentView.model;
                if (shapes.bpmn2.CompositePool.isPool(child) || shapes.bpmn2.Swimlane.isSwimlane(child)) return false;
                return shapes.bpmn2.Swimlane.isSwimlane(parent);
            },
            interactive: (cellView: any) => {
                if (this.isReadOnly()) return false;
                const cell = cellView.model;
                if (shapes.bpmn2.Swimlane.isSwimlane(cell)) return { stopDelegation: false };
                return true;
            },
        } as any);

        this.scroller = new ui.PaperScroller({
            paper: this.paper,
            autoResizePaper: true,
            cursor: 'grab',
        });
        this.canvasEl.nativeElement.appendChild(this.scroller.el);
        this.scroller.render();

        // Load existing diagram or create initial pool
        if (p.diagram && Array.isArray(p.diagram.cells) && p.diagram.cells.length) {
            try {
                this.graph.fromJSON(p.diagram);
                const poolCell = this.graph.getCells().find(c => shapes.bpmn2.CompositePool.isPool(c));
                if (poolCell) this.pool = poolCell as unknown as BPMNPool;
            } catch { /* empty or incompatible */ }
        }
        if (!this.pool) {
            this.createInitialPool(p.name);
        }

        this.scroller.center();
        this.paper.unfreeze();

        // ── Paper events ──────────────────────────────────────────
        this.paper.on('element:pointerclick', (view: any) => {
            if (this.linkMode()) return;
            const el = view.model as dia.Element;
            if (shapes.bpmn2.CompositePool.isPool(el)) {
                this.selected.set(null); this.selectedLane.set(null); this.selectedLink.set(null);
            } else if (shapes.bpmn2.Swimlane.isSwimlane(el)) {
                this.selected.set(null); this.selectedLink.set(null);
                this.onSelectLane(el as unknown as shapes.bpmn2.Swimlane);
            } else {
                this.selectedLink.set(null); this.selectedLane.set(null);
                this.onSelectElement(el);
            }
        });
        this.paper.on('link:pointerclick', (view: any) => {
            if (this.linkMode()) return;
            this.selected.set(null); this.selectedLane.set(null);
            this.onSelectLink(view.model as dia.Link);
        });
        this.paper.on('blank:pointerclick', () => {
            this.selected.set(null); this.selectedLane.set(null); this.selectedLink.set(null);
        });
    }

    private createInitialPool(name: string): void {
        this.pool = new BPMNPool({
            size: { width: DEFAULT_POOL_WIDTH, height: 240 },
            position: { x: 60, y: 60 },
            attrs: { headerText: { text: name } },
        } as any);
        const lane = new BPMNLane({
            attrs: { headerText: { text: 'Área principal' } },
            data: { assignedAreaId: '', label: 'Área principal' },
        } as any);
        this.graph.addCell(this.pool);
        (this.pool as any).addSwimlane(lane);
    }

    addNode(nd: NodeDef): void {
        if (!this.graph) return;
        const lane = this.getActiveLane();
        let x = 200 + Math.random() * 200;
        let y = 100 + Math.random() * 80;
        if (lane) {
            const pos = lane.position();
            const sz = lane.size();
            x = pos.x + LANE_HEADER_SIZE + 60 + Math.random() * Math.max(sz.width - LANE_HEADER_SIZE - 200, 50);
            y = pos.y + 30 + Math.random() * Math.max(sz.height - 100, 40);
        }
        const el = this.buildBPMNShape(nd, x, y);
        this.graph.addCell(el);
        if (lane) (lane as any).embed(el);
    }

    addLane(): void {
        if (!this.pool || !this.graph) return;
        const lane = new BPMNLane({
            attrs: { headerText: { text: 'Nueva área' } },
            data: { assignedAreaId: '', label: 'Nueva área' },
        } as any);
        (this.pool as any).addSwimlane(lane);
    }

    private getActiveLane(): shapes.bpmn2.Swimlane | null {
        if (this.selectedLane()) {
            const cell = this.graph.getCell(this.selectedLane()!.cellId);
            if (cell && shapes.bpmn2.Swimlane.isSwimlane(cell)) return cell as unknown as shapes.bpmn2.Swimlane;
        }
        if (this.pool) {
            const lanes = (this.pool as any).getSwimlanes?.() as shapes.bpmn2.Swimlane[] ?? [];
            return lanes[0] ?? null;
        }
        return null;
    }

    private buildBPMNShape(nd: NodeDef, x: number, y: number): dia.Element {
        const data = { nodeType: nd.type, label: nd.label };

        if (nd.bpmnType === 'event') {
            const isEnd = nd.type === 'END';
            return new shapes.bpmn2.Event({
                position: { x, y },
                size: { width: 40, height: 40 },
                eventType: isEnd ? 'end' : 'start',
                attrs: {
                    label: { text: nd.label, fontFamily: 'sans-serif' },
                    background: isEnd ? { fill: '#fef2f2', stroke: '#ef4444', strokeWidth: 4 } : { fill: '#f0f9ff', stroke: '#000', strokeWidth: 1.5 },
                },
                data,
            } as any) as dia.Element;
        }

        if (nd.bpmnType === 'gateway') {
            const gatewayType = (nd.type === 'PARALLEL_SPLIT' || nd.type === 'PARALLEL_JOIN') ? 'parallel' : 'exclusive';
            return new shapes.bpmn2.Gateway({
                position: { x, y },
                size: { width: 56, height: 56 },
                gatewayType,
                attrs: {
                    label: { text: nd.label, fontFamily: 'sans-serif' },
                    body: { fill: '#fefce8', stroke: '#d97706', strokeWidth: 1.5 },
                },
                data,
            } as any) as dia.Element;
        }

        // Activity (task)
        const colorMap: Partial<Record<NodeType, { bg: string; border: string }>> = {
            MANUAL_FORM:   { bg: '#eff6ff', border: '#3b82f6' },
            MANUAL_ACTION: { bg: '#f3e8ff', border: '#8b5cf6' },
            CLIENT_TASK:   { bg: '#ecfeff', border: '#06b6d4' },
            NOTIFICATION:  { bg: '#ecfdf5', border: '#10b981' },
        };
        const c = colorMap[nd.type] ?? { bg: '#f8fafc', border: '#94a3b8' };
        return new shapes.bpmn2.Activity({
            position: { x, y },
            size: { width: 140, height: 56 },
            activityType: 'task',
            attrs: {
                label: { text: nd.label, fontFamily: 'sans-serif', fontSize: 12 },
                background: { fill: c.bg, stroke: c.border, strokeWidth: 1.5, rx: 8, ry: 8 },
            },
            data,
        } as any) as dia.Element;
    }

    private onSelectElement(el: dia.Element): void {
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

    private onSelectLane(lane: shapes.bpmn2.Swimlane): void {
        const data = (lane as any).get('data') ?? {};
        const label = (lane as any).attr('headerText/text') as string ?? data.label ?? '';
        this.selectedLane.set({
            cellId: (lane as any).id as string,
            label,
            areaId: data.assignedAreaId ?? '',
        });
    }

    private onSelectLink(lk: dia.Link): void {
        const data = (lk as any).get('data') ?? {};
        const labelEntry = (lk as any).label(0);
        const label = labelEntry?.attrs?.text?.text as string ?? '';
        this.selectedLink.set({ cellId: lk.id as string, label, condition: data.condition ?? '' });
    }

    updateLaneName(name: string): void {
        const sl = this.selectedLane();
        if (!sl) return;
        const lane = this.graph.getCell(sl.cellId) as dia.Element;
        if (!lane) return;
        (lane as any).attr('headerText/text', name);
        const data = (lane as any).get('data') ?? {};
        (lane as any).set('data', { ...data, label: name });
        this.selectedLane.set({ ...sl, label: name });
    }

    updateLaneAreaId(areaId: string): void {
        const sl = this.selectedLane();
        if (!sl) return;
        const lane = this.graph.getCell(sl.cellId);
        if (!lane) return;
        const data = (lane as any).get('data') ?? {};
        (lane as any).set('data', { ...data, assignedAreaId: areaId });
        this.selectedLane.set({ ...sl, areaId });
    }

    deleteLane(): void {
        const sl = this.selectedLane();
        if (!sl) return;
        const lane = this.graph.getCell(sl.cellId);
        if (lane) lane.remove();
        this.selectedLane.set(null);
    }

    updateLinkLabel(newLabel: string): void {
        const sl = this.selectedLink();
        if (!sl) return;
        const lk = this.graph.getCell(sl.cellId) as dia.Link;
        if (!lk) return;
        lk.label(0, { attrs: { text: { text: newLabel } } });
        this.selectedLink.set({ ...sl, label: newLabel });
    }

    updateLinkCondition(newCond: string): void {
        const sl = this.selectedLink();
        if (!sl) return;
        const lk = this.graph.getCell(sl.cellId) as dia.Link;
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
        const el = this.graph.getCell(cellId) as dia.Element;
        if (!el) return;
        const data = (el as any).get('data') ?? {};
        (el as any).set('data', { ...data, form: { fields } });
    }

    updateLabel(newLabel: string): void {
        const sel = this.selected();
        if (!sel) return;
        const el = this.graph.getCell(sel.cellId) as dia.Element;
        if (!el) return;
        el.attr('label/text', newLabel);
        const data = (el as any).get('data') ?? {};
        (el as any).set('data', { ...data, label: newLabel });
        this.selected.set({ ...sel, label: newLabel });
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
    }

    guardar(): void {
        if (!this.graph) return;
        this.saving.set(true);

        const cells = this.graph.getCells();

        // Exclude Pool/Lane cells from workflow nodes
        const elements = cells.filter(c =>
            c.isElement() &&
            !shapes.bpmn2.CompositePool.isPool(c) &&
            !shapes.bpmn2.Swimlane.isSwimlane(c)
        );

        // Exclude links from/to Pool/Lane from transitions
        const links = cells.filter(c => {
            if (!c.isLink()) return false;
            const srcId = (c as any).get('source')?.id;
            const tgtId = (c as any).get('target')?.id;
            if (!srcId || !tgtId) return false;
            const srcCell = this.graph.getCell(srcId);
            const tgtCell = this.graph.getCell(tgtId);
            if (!srcCell || !tgtCell) return false;
            if (shapes.bpmn2.CompositePool.isPool(srcCell) || shapes.bpmn2.Swimlane.isSwimlane(srcCell)) return false;
            if (shapes.bpmn2.CompositePool.isPool(tgtCell) || shapes.bpmn2.Swimlane.isSwimlane(tgtCell)) return false;
            return true;
        });

        const nodes: PolicyNode[] = elements.map(el => {
            const data = (el as any).get('data') ?? {};
            // Derive assignedAreaId from parent lane when not explicitly set on node
            const parent = el.getParentCell();
            const laneData = parent ? (parent as any).get('data') ?? {} : {};
            return {
                id: el.id as string,
                nodeType: data.nodeType ?? 'MANUAL_FORM',
                label: el.attr('label/text') as string ?? '',
                assignedAreaId: data.assignedAreaId ?? laneData.assignedAreaId ?? null,
                estimatedMinutes: data.estimatedMinutes,
                form: data.form,
                position: (el as dia.Element).position(),
                size: (el as dia.Element).size(),
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
                label: ((lk as dia.Link).label(0)?.attrs?.['text'] as any)?.text as string ?? '',
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
                    const poolCell = this.graph.getCells().find(c => shapes.bpmn2.CompositePool.isPool(c));
                    if (poolCell) this.pool = poolCell as unknown as BPMNPool;
                    this.isReceivingPatch = false;
                });
            },
        });
        this.stompClient.activate();
    }

    private get orgId(): string {
        return this.auth.currentUserSignal()?.organizationId ?? '';
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
            type: s.type as NodeType, label: s.label, icon: 'pi-box', color: '#94A3B8', bpmnType: 'activity' as const,
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
