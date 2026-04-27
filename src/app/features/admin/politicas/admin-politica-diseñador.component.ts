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
import { dia, ui, shapes, elementTools, linkTools, highlighters } from '@joint/plus';
import {
    BPMNPool, BPMNPoolView, BPMNLane, BPMNLaneView,
    BPMNVerticalPool, BPMNVerticalPoolView,
    BPMNVerticalLane, BPMNVerticalLaneView,
    BPMNVerticalPhase, BPMNVerticalPhaseView,
    BPMNHorizontalPhase, BPMNHorizontalPhaseView,
    BPMNEvent, BPMNActivity, BPMNGateway,
    APP_SHAPES, DEFAULT_POOL_WIDTH, MIN_LANE_SIZE, LANE_HEADER_SIZE,
    isPoolEl, isSwimlaneEl, isPhaseEl,
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
        .canvas-wrapper { overflow: hidden; background: #f1f5f9; position: relative; }
        .canvas-wrapper.link-mode { cursor: crosshair; }
        #joint-canvas { position: relative; width: 100%; height: 100%; }
        .stencil-host { width: 210px; height: 100%; }
        .stencil-host :deep(.joint-stencil) { height: 100% !important; overflow-y: auto; }
    `],
    templateUrl: './admin-politica-diseñador.component.html',
})
export class AdminPoliticaDiseñadorComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('canvas', { static: false }) canvasEl!: ElementRef<HTMLDivElement>;
    @ViewChild('stencilContainer', { static: false }) stencilContainerEl?: ElementRef<HTMLDivElement>;

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
    private stencil: ui.Stencil;
    private snaplines: ui.Snaplines;
    private commandManager: dia.CommandManager;
    private pool: BPMNPool | null = null;
    private _selectedCellId: dia.Cell.ID | null = null;
    private policyId!: string;
    private stompClient?: Client;
    private wsUrl = environment.api.baseUrl.replace('/api', '') + '/ws';
    private isReceivingPatch = false;
    private resizeObserver?: ResizeObserver;

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
        this.resizeObserver?.disconnect();
        this.snaplines?.stopListening();
        this.scroller?.remove();
        this.stencil?.remove();
        this.stompClient?.deactivate();
    }

    private initCanvas(p: PolicyResponse): void {
        if (!this.canvasEl?.nativeElement) return;

        // ── Graph + CommandManager ─────────────────────────────────
        this.graph = new dia.Graph({}, { cellNamespace: APP_SHAPES });
        this.commandManager = new dia.CommandManager({ graph: this.graph });

        // ── Canvas size fix via ResizeObserver ─────────────────────
        const canvasWrapper = this.canvasEl.nativeElement.parentElement!;
        const resizeCanvas = () => {
            const r = canvasWrapper.getBoundingClientRect();
            const w = Math.floor(r.width) || 900;
            const h = Math.floor(r.height) || 600;
            this.canvasEl.nativeElement.style.width = w + 'px';
            this.canvasEl.nativeElement.style.height = h + 'px';
        };
        resizeCanvas();
        this.resizeObserver = new ResizeObserver(resizeCanvas);
        this.resizeObserver.observe(canvasWrapper);

        // ── Paper ──────────────────────────────────────────────────
        this.paper = new dia.Paper({
            model: this.graph,
            cellViewNamespace: APP_SHAPES,
            width: 4000,
            height: 4000,
            gridSize: 10,
            drawGrid: { name: 'dot', args: [{ color: '#cbd5e1', thickness: 1 }] } as any,
            background: { color: '#F3F7F6' },
            frozen: true,
            async: true,
            sorting: dia.Paper.sorting.EXACT,
            clickThreshold: 10,
            preventDefaultBlankAction: false,
            preventDefaultViewAction: false,
            embeddingMode: true,
            findParentBy: 'center',
            frontParentOnly: false,
            linkPinning: false,
            defaultRouter: {
                name: 'manhattan',
                args: {
                    excludeTypes: [
                        'sw1.Pool', 'sw1.VerticalPool',
                        'sw1.Lane', 'sw1.VerticalLane',
                        'sw1.VerticalPhase', 'sw1.HorizontalPhase',
                    ],
                    padding: 10,
                },
            },
            defaultLink: () => new shapes.bpmn2.Flow() as unknown as dia.Link,
            validateConnection: (cvS: any, _mS: any, cvT: any) => {
                if (cvS === cvT) return false;
                const s = cvS.model, t = cvT.model;
                if (isSwimlaneEl(s) || isSwimlaneEl(t)) return false;
                if (isPoolEl(s) || isPoolEl(t)) return false;
                return true;
            },
            validateEmbedding: (childView: any, parentView: any) => {
                const child = childView.model, parent = parentView.model;
                // Pools, Swimlanes and Phases are managed programmatically via addSwimlane/addPhase
                if (isPoolEl(child)) return false;
                if (isSwimlaneEl(child)) return false;
                if (isPhaseEl(child)) return false;
                // Regular elements can only embed into Swimlanes
                return isSwimlaneEl(parent);
            },
            validateUnembedding: (childView: any) => {
                const child = childView.model;
                return (isPoolEl(child) || isSwimlaneEl(child) || isPhaseEl(child));
            },
            interactive: (cellView: any) => {
                if (this.isReadOnly()) return false;
                const cell = cellView.model;
                if (isSwimlaneEl(cell)) return { stopDelegation: false };
                if (isPhaseEl(cell)) return { stopDelegation: false };
                return true;
            },
            highlighting: {
                embedding: { name: 'addClass', options: { className: 'hgl-container' } },
                connecting: { name: 'addClass', options: { className: 'hgl-target' } },
            },
        } as any);

        // ── PaperScroller ──────────────────────────────────────────
        this.scroller = new ui.PaperScroller({
            paper: this.paper,
            autoResizePaper: true,
            padding: 100,
            cursor: 'grab',
        });
        Object.assign(this.scroller.el.style, {
            position: 'absolute', inset: '0', width: '100%', height: '100%',
        });
        this.canvasEl.nativeElement.appendChild(this.scroller.el);
        this.scroller.render();

        // ── Snaplines ──────────────────────────────────────────────
        this.snaplines = new ui.Snaplines({ paper: this.paper, tolerance: 5 });
        this.snaplines.startListening();

        // ── Stencil (edit mode only) ────────────────────────────────
        if (this.stencilContainerEl?.nativeElement && !this.isReadOnly()) {
            this.initStencil();
        }

        // ── Load diagram or create initial pool ────────────────────
        if (p.diagram && Array.isArray(p.diagram.cells) && p.diagram.cells.length) {
            try {
                this.graph.fromJSON(p.diagram);
                const poolCell = this.graph.getCells().find(c => isPoolEl(c as dia.Element));
                if (poolCell) this.pool = poolCell as unknown as BPMNPool;
            } catch { /* empty or incompatible */ }
        }
        if (!this.pool) {
            this.createInitialPool(p.name);
        }

        this.scroller.scrollToContent({ animation: false });
        this.paper.unfreeze();

        // ── Paper events ───────────────────────────────────────────
        // Sync Angular signals when a cell is removed (via tool, keyboard, etc.)
        this.graph.on('remove', (cell: dia.Cell) => {
            if (this.selected()?.cellId === cell.id) this.selected.set(null);
            if (this.selectedLane()?.cellId === cell.id) this.selectedLane.set(null);
            if (this.selectedLink()?.cellId === cell.id) this.selectedLink.set(null);
        });

        this.paper.on('element:pointerclick', (view: any) => {
            const el = view.model as dia.Element;
            const alreadySelected = this._selectedCellId === el.id;
            if (!alreadySelected) {
                this._selectedCellId = el.id;
                this.removeAllTools();
            }
            const bpmnFtOpts: ui.BPMNFreeTransform.Options = { cellView: view, theme: 'bpmn', resizeGrid: { width: 10, height: 10 }, minLaneSize: MIN_LANE_SIZE };
            const ftOpts: ui.FreeTransform.Options = { cellView: view, allowRotation: false, resizeGrid: { width: 10, height: 10 } };
            if (isPoolEl(el)) {
                this.selected.set(null); this.selectedLane.set(null); this.selectedLink.set(null);
                if (!alreadySelected) {
                    view.addTools(new dia.ToolsView({
                        tools: [new elementTools.Remove({ x: -15, y: 0 })],
                    }));
                    new ui.BPMNFreeTransform(bpmnFtOpts);
                }
            } else if (isSwimlaneEl(el)) {
                this.selected.set(null); this.selectedLink.set(null);
                this.onSelectLane(el as unknown as shapes.bpmn2.Swimlane);
                if (!alreadySelected) {
                    view.addTools(new dia.ToolsView({
                        tools: [new elementTools.Remove({ x: -15, y: 0 })],
                    }));
                    new ui.BPMNFreeTransform(bpmnFtOpts);
                }
            } else {
                this.selectedLink.set(null); this.selectedLane.set(null);
                this.onSelectElement(el);
                if (!alreadySelected) {
                    view.addTools(new dia.ToolsView({
                        tools: [
                            new elementTools.Remove({ x: -15, y: 0 }),
                            new elementTools.Connect({ x: 'calc(w + 15)', y: '50%' }),
                        ],
                    }));
                    new ui.FreeTransform(ftOpts).render();
                }
            }
        });

        // Double-click: inline label editing
        this.paper.on('element:pointerdblclick', (view: any, evt: any) => {
            this.editCellLabel(view, evt);
        });

        this.paper.on('link:pointerclick', (view: any) => {
            this.removeAllTools();
            this.selected.set(null); this.selectedLane.set(null);
            this.onSelectLink(view.model as dia.Link);
            view.addTools(new dia.ToolsView({
                name: 'link-tools',
                tools: [new linkTools.Vertices(), new linkTools.Remove()],
            }));
        });

        this.paper.on('link:mouseenter', (linkView: any, evt: any) => {
            if (evt.buttons !== 0) return;
            linkView.addTools(new dia.ToolsView({
                name: 'hover',
                tools: [new linkTools.Vertices(), new linkTools.Remove()],
            }));
        });

        this.paper.on('link:mouseleave', (linkView: any) => {
            linkView.removeTools();
        });

        this.paper.on('blank:pointerclick', () => {
            this._selectedCellId = null;
            this.removeAllTools();
            this.selected.set(null); this.selectedLane.set(null); this.selectedLink.set(null);
        });

        // When an existing lane/phase is moved on the canvas, highlight the target pool
        (this.paper as any).on('element:pointermove', (view: any, _evt: any, x: number, y: number) => {
            const el = view.model as dia.Element;
            if (!isSwimlaneEl(el) && !isPhaseEl(el)) return;
            this.clearLaneDropHighlight();
            const views = this.paper.findViewsFromPoint({ x, y });
            const poolView = views.find(
                (v: any) => isPoolEl(v.model) && v !== view
            );
            if (poolView) {
                highlighters.mask.add(poolView, 'body', '_lane_drop_', {
                    attrs: { stroke: '#0075f2', 'stroke-width': 3 },
                });
            }
        });

        // On pointer up: clear highlights, bring regular elements to front
        (this.paper as any).on('element:pointerup', (view: any) => {
            this.clearLaneDropHighlight();
            const el = view.model as dia.Element;
            if (!isPoolEl(el) && !isSwimlaneEl(el)) {
                el.toFront();
            }
        });

    }

    private initStencil(): void {
        this.stencil = new ui.Stencil({
            paper: this.paper,
            snaplines: this.snaplines,
            usePaperGrid: true,
            width: 200,
            groups: {
                pools: {
                    label: 'Estructura', index: 1,
                    layout: { columns: 1, rowHeight: 'compact', rowGap: 8, columnWidth: 170, marginY: 8, dx: 8, dy: 0, resizeToFit: false },
                },
                events:   { label: 'Eventos', index: 2 },
                tasks:    { label: 'Actividades', index: 3 },
                gateways: { label: 'Gateways', index: 4 },
            },
            paperOptions: () => ({
                model: new dia.Graph({}, { cellNamespace: APP_SHAPES }),
                cellViewNamespace: APP_SHAPES,
                background: { color: '#FCFCFC' },
            }),
            layout: {
                columns: 2,
                rowHeight: 'compact',
                rowGap: 10,
                columnWidth: 84,
                marginY: 10,
                resizeToFit: false,
                dx: 4, dy: 0,
            },
        });
        this.stencilContainerEl!.nativeElement.appendChild(this.stencil.el);
        this.stencil.render();

        this.stencil.load({
            pools: [
                // Pool horizontal: header top (40px) + content area
                new BPMNPool({
                    size: { width: 170, height: 80 },
                    attrs: { headerText: { text: 'Pool Horizontal', fontFamily: 'sans-serif', fontSize: 10 } },
                } as any),
                // Pool vertical: header left (40px) + content area
                new BPMNVerticalPool({
                    size: { width: 170, height: 80 },
                    attrs: { headerText: { text: 'Pool Vertical', fontFamily: 'sans-serif', fontSize: 10 } },
                } as any),
                // Lane horizontal (swimlane para pool horizontal)
                new BPMNLane({
                    size: { width: 170, height: 50 },
                    attrs: { headerText: { text: '+ Nueva área', fontFamily: 'sans-serif', fontSize: 10 } },
                } as any),
                // Phase vertical (etapa/milestone en pool horizontal)
                new BPMNVerticalPhase({
                    size: { width: 170, height: 50 },
                    attrs: { headerText: { text: '+ Fase', fontFamily: 'sans-serif', fontSize: 10 } },
                } as any),
            ],
            events: [
                new BPMNEvent({
                    size: { width: 44, height: 44 },
                    eventType: 'start',
                    attrs: { label: { text: 'Inicio' }, background: { fill: '#f0f9ff', stroke: '#334155', strokeWidth: 1.5 } },
                    data: { nodeType: 'START', label: 'Inicio' },
                } as any),
                new BPMNEvent({
                    size: { width: 44, height: 44 },
                    eventType: 'end',
                    attrs: { label: { text: 'Fin' }, background: { fill: '#fef2f2', stroke: '#ef4444', strokeWidth: 4 } },
                    data: { nodeType: 'END', label: 'Fin' },
                } as any),
            ],
            tasks: [
                new BPMNActivity({ size: { width: 80, height: 48 }, activityType: 'task',
                    attrs: { label: { text: 'Formulario' }, body: { fill: '#eff6ff', stroke: '#3b82f6', strokeWidth: 1.5 } },
                    data: { nodeType: 'MANUAL_FORM', label: 'Formulario' } } as any),
                new BPMNActivity({ size: { width: 80, height: 48 }, activityType: 'task',
                    attrs: { label: { text: 'Acción' }, body: { fill: '#f3e8ff', stroke: '#8b5cf6', strokeWidth: 1.5 } },
                    data: { nodeType: 'MANUAL_ACTION', label: 'Acción Manual' } } as any),
                new BPMNActivity({ size: { width: 80, height: 48 }, activityType: 'task',
                    attrs: { label: { text: 'Tarea\nCliente' }, body: { fill: '#ecfeff', stroke: '#06b6d4', strokeWidth: 1.5 } },
                    data: { nodeType: 'CLIENT_TASK', label: 'Tarea Cliente' } } as any),
                new BPMNActivity({ size: { width: 80, height: 48 }, activityType: 'task',
                    attrs: { label: { text: 'Notif.' }, body: { fill: '#ecfdf5', stroke: '#10b981', strokeWidth: 1.5 } },
                    data: { nodeType: 'NOTIFICATION', label: 'Notificación' } } as any),
            ],
            gateways: [
                new BPMNGateway({ size: { width: 54, height: 54 }, gatewayType: 'exclusive',
                    attrs: { label: { text: 'Condición' } },
                    data: { nodeType: 'CONDITION', label: 'Condición' } } as any),
                new BPMNGateway({ size: { width: 54, height: 54 }, gatewayType: 'parallel',
                    attrs: { label: { text: 'Paralelo' } },
                    data: { nodeType: 'PARALLEL_SPLIT', label: 'Bifurcación' } } as any),
            ],
        });

        // ── Stencil drag listeners: snap hints when dragging lanes/phases ──

        (this.stencil as any).on('element:dragstart', (_app: any, _cloneView: any, evt: any) => {
            evt.data = evt.data || {};
            evt.data.poolView = null;
        });

        (this.stencil as any).on('element:drag', (_app: any, cloneView: any, evt: any) => {
            const clone = cloneView?.model;
            if (!clone) return;
            evt.data = evt.data || {};
            if (!isSwimlaneEl(clone) && !isPhaseEl(clone)) return;
            this.clearLaneDropHighlight();
            const clientX = evt.clientX ?? (evt.originalEvent as MouseEvent)?.clientX ?? 0;
            const clientY = evt.clientY ?? (evt.originalEvent as MouseEvent)?.clientY ?? 0;
            const poolView = this.findPoolViewAtClientPoint(clientX, clientY);
            evt.data.poolView = poolView;
            if (poolView) {
                highlighters.mask.add(poolView, 'body', '_lane_drop_', {
                    attrs: { stroke: '#0075f2', 'stroke-width': 3 },
                });
            }
        });

        (this.stencil as any).on('element:dragend', () => { this.clearLaneDropHighlight(); });

        // ── Stencil element:drop ──────────────────────────────────────────

        (this.stencil as any).on('element:drop', (_appView: any, elementView: any, evt: any, x: number, y: number) => {
            this.clearLaneDropHighlight();
            const el = elementView?.model as dia.Element | undefined;
            if (!el) return;

            if (isPoolEl(el)) {
                // New pool dropped: set standard width + height and add a default swimlane
                const pool = el as unknown as shapes.bpmn2.CompositePool;
                pool.prop(['size', 'width'], DEFAULT_POOL_WIDTH);
                pool.prop(['size', 'height'], 240);
                const lane = pool.isHorizontal()
                    ? new BPMNLane({
                        attrs: { headerText: { text: 'Área 1', fontFamily: 'sans-serif' } },
                        data: { assignedAreaId: '', label: 'Área 1' },
                      } as any)
                    : new BPMNVerticalLane({
                        attrs: { headerText: { text: 'Área 1', fontFamily: 'sans-serif' } },
                        data: { assignedAreaId: '', label: 'Área 1' },
                      } as any);
                pool.addSwimlane(lane as shapes.bpmn2.Swimlane);
                this.pool = el as unknown as BPMNPool;

            } else if (isSwimlaneEl(el) || isPhaseEl(el)) {
                // Lane/phase dropped: use the pool highlighted during drag, or fallback to this.pool
                const poolView = evt?.data?.poolView;
                const targetPool = (poolView?.model ?? (this.pool as unknown as dia.Element)) as unknown as shapes.bpmn2.CompositePool;
                if (targetPool) {
                    if (isPhaseEl(el)) {
                        // Match the demo: replace the dropped clone with a properly-typed phase
                        el.remove();
                        const phase = targetPool.isHorizontal()
                            ? new BPMNVerticalPhase({
                                attrs: { headerText: { text: 'Etapa', fontFamily: 'sans-serif' } },
                              } as any)
                            : new BPMNHorizontalPhase({
                                attrs: { headerText: { text: 'Etapa', fontFamily: 'sans-serif' } },
                              } as any);
                        // addPhase(phase, position) – position is the orthogonal coord of the drop.
                        // Guard: if there are phases and no phase overlaps the drop point, skip.
                        const oCoord = (targetPool as any).getPhaseOrthogonalCoordinate?.() as 'x' | 'y' ?? 'x';
                        const dropPos = oCoord === 'x' ? x : y;
                        const overlapped = (targetPool as any).findPhaseFromOrthogonalCoord?.(dropPos);
                        const existingPhases: unknown[] = (targetPool as any).getPhases?.() ?? [];
                        if (existingPhases.length > 0 && !overlapped) {
                            // Would throw — drop is outside any existing phase column; silently skip
                        } else {
                            (targetPool as any).addPhase(phase, dropPos);
                        }
                    } else {
                        // Swimlane: use the original dropped element (compatible) or replace if needed
                        let compatibleLane = el as unknown as shapes.bpmn2.Swimlane;
                        if (!(el as unknown as shapes.bpmn2.Swimlane).isCompatibleWithPool?.(targetPool)) {
                            el.remove();
                            compatibleLane = targetPool.isHorizontal()
                                ? new BPMNLane({
                                    attrs: { headerText: { text: 'Nueva área', fontFamily: 'sans-serif' } },
                                    data: { assignedAreaId: '', label: 'Nueva área' },
                                  } as any) as unknown as shapes.bpmn2.Swimlane
                                : new BPMNVerticalLane({
                                    attrs: { headerText: { text: 'Nueva área', fontFamily: 'sans-serif' } },
                                    data: { assignedAreaId: '', label: 'Nueva área' },
                                  } as any) as unknown as shapes.bpmn2.Swimlane;
                        }
                        const insertIndex = targetPool.getSwimlaneInsertIndexFromPoint?.({ x, y }) ?? undefined;
                        targetPool.addSwimlane(compatibleLane, insertIndex);
                    }
                    this.pool = targetPool as unknown as BPMNPool;
                } else {
                    el.remove();
                }
            } else {
                // Regular BPMN element
                const parent = el?.getParentCell?.();
                if (parent && isSwimlaneEl(parent as dia.Element) && this.pool) {
                    (this.pool as any).adjustToContainElements(parent as shapes.bpmn2.Swimlane);
                }
                el.toFront();
            }
        });
    }

    // ── Snap-hint helpers ─────────────────────────────────────────

    /** Find the first pool view whose bounding box contains the given paper-coordinate point. */
    private findPoolViewAtPoint(x: number, y: number): dia.CellView | null {
        const views = this.paper.findViewsFromPoint({ x, y });
        const poolView = views.find((v: any) => isPoolEl(v.model));
        return poolView ?? null;
    }

    /** Find the pool view under the given client (screen) coordinates during stencil drag. */
    private findPoolViewAtClientPoint(clientX: number, clientY: number): dia.CellView | null {
        if (clientX == null || clientY == null) return null;
        const els = Array.from(document.elementsFromPoint(clientX, clientY));
        for (const el of els) {
            const view = this.paper.findView(el as SVGElement);
            if (view && isPoolEl((view as any).model)) {
                return view;
            }
        }
        return null;
    }

    /** Remove the lane-drop blue-border highlight from all pools on the canvas. */
    private clearLaneDropHighlight(): void {
        this.graph.getElements()
            .filter(e => isPoolEl(e))
            .forEach(e => {
                const v = e.findView(this.paper) as dia.CellView | undefined;
                if (v) highlighters.mask.remove(v, '_lane_drop_');
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

    // ── Toolbar actions ───────────────────────────────────────────
    undo(): void { this.commandManager?.undo(); }
    redo(): void { this.commandManager?.redo(); }
    zoomIn(): void { this.scroller?.zoom(0.1, { max: 2 } as any); }
    zoomOut(): void { this.scroller?.zoom(-0.1, { min: 0.2 } as any); }
    zoomFit(): void { this.scroller?.zoomToFit({ useModelGeometry: true, padding: 40 } as any); }

    exportPng(): void {
        if (!this.paper) return;
        (this.paper as any).exportToPNG((dataUrl: string) => {
            const link = document.createElement('a');
            link.download = (this.politica()?.name ?? 'diagrama') + '.png';
            link.href = dataUrl;
            link.click();
        }, { padding: 20 });
    }

    exportJson(): void {
        if (!this.graph) return;
        const json = JSON.stringify(this.graph.toJSON(), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = (this.politica()?.name ?? 'diagrama') + '.json';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
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

    /** Background color for activity palette icons */
    nodeColorBg(type: NodeType): string {
        const map: Partial<Record<NodeType, string>> = {
            MANUAL_FORM:   '#eff6ff',
            MANUAL_ACTION: '#f3e8ff',
            CLIENT_TASK:   '#ecfeff',
            NOTIFICATION:  '#ecfdf5',
        };
        return map[type] ?? '#f8fafc';
    }

    private getActiveLane(): shapes.bpmn2.Swimlane | null {
        if (this.selectedLane()) {
            const cell = this.graph.getCell(this.selectedLane()!.cellId);
            if (cell && isSwimlaneEl(cell as dia.Element)) return cell as unknown as shapes.bpmn2.Swimlane;
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
            return new BPMNEvent({
                position: { x, y },
                size: { width: 40, height: 40 },
                eventType: isEnd ? 'end' : 'start',
                attrs: {
                    label: { text: nd.label },
                    background: isEnd
                        ? { fill: '#fef2f2', stroke: '#ef4444', strokeWidth: 4 }
                        : { fill: '#f0f9ff', stroke: '#334155', strokeWidth: 1.5 },
                },
                data,
            } as any) as dia.Element;
        }

        if (nd.bpmnType === 'gateway') {
            const gatewayType = (nd.type === 'PARALLEL_SPLIT' || nd.type === 'PARALLEL_JOIN')
                ? 'parallel'
                : 'exclusive';
            return new BPMNGateway({
                position: { x, y },
                size: { width: 56, height: 56 },
                gatewayType,
                attrs: {
                    label: { text: nd.label },
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
        return new BPMNActivity({
            position: { x, y },
            size: { width: 140, height: 56 },
            activityType: 'task',
            attrs: {
                label: { text: nd.label },
                body: { fill: c.bg, stroke: c.border, strokeWidth: 1.5 },
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

    /**
     * Overlays a native <textarea> on top of the JointJS element so the user
     * can edit the label inline (same approach as the JointJS demo).
     * Uses the background node for accurate bbox (not the text node).
     */
    private editCellLabel(elementView: any, evt?: any): void {
        if (this.isReadOnly()) return;
        const paper = this.paper;
        const element = elementView.model as dia.Element;
        const isPool = isPoolEl(element);
        const isLane = isSwimlaneEl(element);

        // For pools/lanes: only allow editing when clicking on the header area
        if ((isPool || isLane) && evt) {
            const target = evt.target as Element;
            if (target.tagName !== 'tspan' && target.getAttribute('joint-selector') !== 'header') return;
        }

        let bgSelector: string;
        let textAttrPath: string;
        if (isPool || isLane) {
            bgSelector = 'header';
            textAttrPath = 'attrs/headerText/text';
        } else {
            const elemType = element.get('type') as string;
            textAttrPath = 'attrs/label/text';
            bgSelector = elemType === 'sw1.Gateway' ? 'body' : 'background';
        }

        const bgNode = elementView.findNode(bgSelector) as SVGElement | null;
        if (!bgNode) return;

        const currentText = (element.prop(textAttrPath) as string) ?? '';
        const bbox = elementView.getNodeBBox(bgNode) as { x: number; y: number; width: number; height: number };
        const m = paper.matrix();

        const textarea = document.createElement('textarea');
        textarea.style.cssText = [
            'position: absolute',
            `left: ${bbox.x * m.a + m.e}px`,
            `top: ${bbox.y * m.d + m.f}px`,
            `width: ${Math.max(bbox.width * m.a, 80)}px`,
            `height: ${Math.max(bbox.height * m.d, 28)}px`,
            'box-sizing: border-box',
            'z-index: 9999',
            'resize: none',
            'text-align: center',
            'border: 2px solid #3b82f6',
            'border-radius: 3px',
            'outline: none',
            'background: rgba(255,255,255,0.96)',
            `font-size: ${Math.max(Math.round(12 * m.a), 10)}px`,
            'font-family: sans-serif',
            'padding: 4px',
            'overflow: hidden',
        ].join('; ');
        textarea.value = currentText;

        paper.el.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const commit = () => {
            const newText = textarea.value.trim() || currentText;
            element.prop(textAttrPath, newText);
            if (!isPool) {
                const data = (element as any).get('data') ?? {};
                (element as any).set('data', { ...data, label: newText });
                if (isLane) {
                    const sl = this.selectedLane();
                    if (sl?.cellId === element.id) this.selectedLane.set({ ...sl, label: newText });
                } else {
                    const sel = this.selected();
                    if (sel?.cellId === element.id) this.selected.set({ ...sel, label: newText });
                }
            }
            textarea.remove();
        };

        textarea.addEventListener('blur', commit);
        textarea.addEventListener('keydown', (ev: KeyboardEvent) => {
            if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); textarea.blur(); }
            if (ev.key === 'Escape') { textarea.value = currentText; textarea.blur(); }
        });
    }

    toggleLinkMode(): void {
        this.linkMode.set(!this.linkMode());
    }

    private removeAllTools(): void {
        if (!this.paper) return;
        ui.FreeTransform.clear(this.paper);
        this.paper.removeTools();
    }

    guardar(): void {
        if (!this.graph) return;
        this.saving.set(true);

        const cells = this.graph.getCells();

        // Exclude Pool/Lane cells from workflow nodes
        const elements = cells.filter(c =>
            c.isElement() &&
            !isPoolEl(c as dia.Element) &&
            !isSwimlaneEl(c as dia.Element)
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
            if (isPoolEl(srcCell as dia.Element) || isSwimlaneEl(srcCell as dia.Element)) return false;
            if (isPoolEl(tgtCell as dia.Element) || isSwimlaneEl(tgtCell as dia.Element)) return false;
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
                    const poolCell = this.graph.getCells().find(c => isPoolEl(c as dia.Element));
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
