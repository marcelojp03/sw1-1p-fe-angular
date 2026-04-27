/**
 * BPMNController — gestiona los eventos de drag del stencil y del paper
 * para mostrar sugerencias visuales (SwimlanePreview, PhasePreview) y
 * manejar el embedding manual de swimlanes/phases en pools.
 *
 * Basado en el demo oficial de JointJS:
 * bpmn-pools-swimlanes-milestones/ts/src/events/BPMNController.ts
 */
import { dia, shapes, highlighters } from '@joint/plus';
import {
    BPMNLane, BPMNVerticalLane,
    BPMNVerticalPhase, BPMNHorizontalPhase,
} from './bpmn-shapes';

// ── Tipos de pool que esta app usa ────────────────────────────────
const POOL_TYPES = ['sw1.Pool', 'sw1.VerticalPool'];

// ── IDs de highlighter / efecto ───────────────────────────────────
const E = {
    TargetPool:     'bpmn-target-pool',
    PreviewLane:    'bpmn-preview-lane',
    PreviewPhase:   'bpmn-preview-phase',
    SourceLane:     'bpmn-source-lane',
    TargetPhase:    'bpmn-target-phase',
    InvalidDrop:    'bpmn-invalid-drop',
} as const;

// ── Utilidades ────────────────────────────────────────────────────

/** Encuentra la vista del pool que está bajo las coordenadas del evento. */
export function findPoolViewFromEvent(
    paper: dia.Paper,
    evt: MouseEvent | dia.Event,
): dia.ElementView | null {
    const { clientX, clientY } = evt as MouseEvent;
    const els = Array.from(document.elementsFromPoint(clientX, clientY));
    for (const el of els) {
        const view = paper.findView(el as Element);
        if (!view) continue;
        const type = (view.model as dia.Cell).get('type') as string;
        if (POOL_TYPES.includes(type)) return view as dia.ElementView;
    }
    return null;
}

export function isStencilEvent(evt: dia.Event): boolean {
    return !!(evt as any).data?.isStencilEvent;
}

export function setStencilEvent(evt: dia.Event, value: boolean): void {
    const e = evt as any;
    if (!e.data) e.data = {};
    e.data.isStencilEvent = value;
}

// ── SwimlanePreview ───────────────────────────────────────────────
// Dibuja flechas azules indicando dónde se insertará el lane.
const SwimlanePreview: any = (dia.HighlighterView as any).extend({
    tagName: 'path',
    attributes: { fill: 'none', stroke: '#0075f2', 'stroke-width': 3 },
    highlight(elementView: dia.ElementView) {
        const { index = 0 } = (this as any).options;
        const pool = elementView.model as shapes.bpmn2.CompositePool;
        if (!shapes.bpmn2.CompositePool.isPool(pool)) return;

        const swimlanes = pool.getSwimlanes();
        const swimlane  = swimlanes[index];
        const poolBBox  = pool.getBBox();
        const pad       = (pool as any).getPadding();
        const isH       = (pool as any).isHorizontal();

        if (isH) {
            const x = pad.left;
            const y = swimlane
                ? swimlane.position().y - poolBBox.y
                : poolBBox.height - pad.bottom;
            const w = poolBBox.width - pad.left - pad.right;
            (this as any).vel.attr({
                d: `M 0 0 l -20 -10 m 20 10 l -20 10 m 20 -10 H ${w} l 20 -10 m -20 10 l 20 10`,
                transform: `translate(${x}, ${y})`,
            });
        } else {
            const y = pad.top;
            const x = swimlane
                ? swimlane.position().x - poolBBox.x
                : poolBBox.width - pad.right;
            const h = poolBBox.height - pad.top - pad.bottom;
            (this as any).vel.attr({
                d: `M 0 0 l -10 -20 m 10 20 l 10 -20 m -10 20 V ${h} l -10 20 m 10 -20 l 10 20`,
                transform: `translate(${x}, ${y})`,
            });
        }
    },
});

// ── PhasePreview ──────────────────────────────────────────────────
// Resalta el área de la fase donde se insertará/expandirá.
const PhasePreview: any = (dia.HighlighterView as any).extend({
    tagName: 'path',
    attributes: {
        fill: '#0075f2', 'fill-opacity': 0.1,
        stroke: '#0075f2', 'stroke-width': 2, 'stroke-dasharray': '5 5',
    },
    highlight(elementView: dia.ElementView) {
        const { x = 0, y = 0 } = (this as any).options;
        const phase = elementView.model;
        if (!(shapes.bpmn2 as any).Phase?.isPhase?.(phase)) return;
        const pool = phase.getParentCell() as shapes.bpmn2.CompositePool;
        if (!pool) return;
        const bbox = phase.getBBox();
        const isH  = (pool as any).isHorizontal();
        if (isH) {
            const dx = x - bbox.x;
            (this as any).vel.attr({ d: `M ${dx} 0 V ${bbox.height} h ${bbox.width - dx} V 0 Z` });
        } else {
            const dy = y - bbox.y;
            (this as any).vel.attr({ d: `M 0 ${dy} H ${bbox.width} v ${bbox.height - dy} H 0 Z` });
        }
    },
});

// ── Interfaz pública ──────────────────────────────────────────────
export interface BPMNControllerOptions {
    paper: dia.Paper;
    stencil: any; // ui.Stencil
    defaultPoolWidth?: number;
    onPoolChange?: (pool: dia.Element) => void;
}

// ── BPMNController ────────────────────────────────────────────────
export class BPMNController {
    private listeners: Array<() => void> = [];

    constructor(private opts: BPMNControllerOptions) {}

    // ── Arranque / parada ─────────────────────────────────────────

    startListening(): void {
        const { paper, stencil } = this.opts;

        // ── Eventos del stencil ───────────────────────────────────
        const onDragStart = (_: any, cloneView: dia.ElementView, evt: dia.Event) => {
            setStencilEvent(evt, true);
            if (shapes.bpmn2.Swimlane.isSwimlane(cloneView.model)) {
                this.addSourceHighlight(cloneView);
            }
        };
        const onDrag = (_: any, cloneView: dia.ElementView, evt: dia.Event, cloneArea: any) => {
            const { x, y } = cloneArea.center();
            if (shapes.bpmn2.Swimlane.isSwimlane(cloneView.model)) {
                this.swimlaneDrag(paper, cloneView, evt, x, y);
            } else if ((shapes.bpmn2 as any).Phase?.isPhase?.(cloneView.model)) {
                this.phaseDrag(paper, cloneView, evt, x, y);
            }
        };
        const onDragEnd = (_: any, cloneView: dia.ElementView, evt: dia.Event) => {
            if (shapes.bpmn2.Swimlane.isSwimlane(cloneView.model)) {
                this.swimlaneCleanup(paper, cloneView, evt);
            } else if ((shapes.bpmn2 as any).Phase?.isPhase?.(cloneView.model)) {
                this.phaseCleanup(paper);
            }
        };
        const onDrop = (_: any, childView: dia.ElementView, evt: dia.Event, x: number, y: number) => {
            const child = childView.model;
            if (shapes.bpmn2.CompositePool.isPool(child)) {
                this.poolDrop(childView, evt, x, y);
            } else if (shapes.bpmn2.Swimlane.isSwimlane(child)) {
                this.swimlaneDrop(childView, evt, x, y);
            } else if ((shapes.bpmn2 as any).Phase?.isPhase?.(child)) {
                this.phaseDrop(childView, evt, x, y);
            } else {
                this.elementDrop(childView);
            }
        };

        stencil.on('element:dragstart', onDragStart);
        stencil.on('element:drag',      onDrag);
        stencil.on('element:dragend',   onDragEnd);
        stencil.on('element:drop',      onDrop);

        this.listeners.push(() => {
            stencil.off('element:dragstart', onDragStart);
            stencil.off('element:drag',      onDrag);
            stencil.off('element:dragend',   onDragEnd);
            stencil.off('element:drop',      onDrop);
        });

        // ── Eventos del paper ─────────────────────────────────────
        const onPointerDown = (elementView: dia.ElementView, evt: dia.Event) => {
            setStencilEvent(evt, false);
            if (shapes.bpmn2.Swimlane.isSwimlane(elementView.model)) {
                this.addSourceHighlight(elementView);
            }
        };
        const onPointerMove = (elementView: dia.ElementView, evt: dia.Event, x: number, y: number) => {
            const el = elementView.model;
            if (shapes.bpmn2.Swimlane.isSwimlane(el)) {
                this.swimlaneDrag(paper, elementView, evt, x, y);
            } else if ((shapes.bpmn2 as any).Phase?.isPhase?.(el)) {
                this.phaseDrag(paper, elementView, evt, x, y);
            }
        };
        const onPointerUp = (elementView: dia.ElementView, evt: dia.Event, x: number, y: number) => {
            const el = elementView.model;
            if (shapes.bpmn2.Swimlane.isSwimlane(el)) {
                this.swimlaneCleanup(paper, elementView, evt, x, y);
            } else if ((shapes.bpmn2 as any).Phase?.isPhase?.(el)) {
                this.phaseCleanup(paper);
            } else if (!shapes.bpmn2.CompositePool.isPool(el)) {
                el.toFront();
                this.adjustPoolToElement(el);
            }
        };

        paper.on('element:pointerdown', onPointerDown);
        paper.on('element:pointermove', onPointerMove);
        paper.on('element:pointerup',   onPointerUp);

        this.listeners.push(() => {
            paper.off('element:pointerdown', onPointerDown);
            paper.off('element:pointermove', onPointerMove);
            paper.off('element:pointerup',   onPointerUp);
        });
    }

    stopListening(): void {
        this.listeners.forEach(fn => fn());
        this.listeners = [];
    }

    // ── Efectos visuales ──────────────────────────────────────────

    private addSourceHighlight(view: dia.ElementView) {
        highlighters.addClass.add(view as any, 'root', E.SourceLane, {
            className: 'joint-bpmn-source-lane',
        });
    }

    private addTargetPool(poolView: dia.ElementView) {
        highlighters.mask.add(poolView as any, 'body', E.TargetPool, {
            attrs: { stroke: '#0075f2', 'stroke-width': 3 },
        });
    }

    private clearAll(paper: dia.Paper) {
        highlighters.mask.removeAll(paper, E.TargetPool);
        highlighters.addClass.removeAll(paper, E.SourceLane);
        highlighters.addClass.removeAll(paper, E.TargetPhase);
        highlighters.addClass.removeAll(paper, E.InvalidDrop);
        SwimlanePreview.removeAll(paper, E.PreviewLane);
        PhasePreview.removeAll(paper, E.PreviewPhase);
    }

    // ── Drag de lane ──────────────────────────────────────────────

    private swimlaneDrag(
        paper: dia.Paper,
        elementView: dia.ElementView,
        evt: dia.Event,
        x: number,
        y: number,
    ) {
        highlighters.mask.removeAll(paper, E.TargetPool);
        SwimlanePreview.removeAll(paper, E.PreviewLane);

        const poolView = findPoolViewFromEvent(paper, evt);
        const data = (evt as any).data ?? {};
        (evt as any).data = data;

        if (!poolView) {
            data.poolView = null;
            highlighters.addClass.add(elementView as any, 'root', E.InvalidDrop, {
                className: 'joint-bpmn-invalid-drop',
            });
            return;
        }

        const lane = elementView.model as shapes.bpmn2.Swimlane;
        const pool = poolView.model as shapes.bpmn2.CompositePool;

        if (!isStencilEvent(evt) && !(lane as any).isCompatibleWithPool?.(pool)) {
            data.poolView = null;
            highlighters.addClass.add(elementView as any, 'root', E.InvalidDrop, {
                className: 'joint-bpmn-invalid-drop',
            });
            return;
        }

        data.poolView = poolView;
        highlighters.addClass.removeAll(paper, E.InvalidDrop);

        const lanes = pool.getSwimlanes();
        if (lanes.length === 0) {
            this.addTargetPool(poolView);
        } else {
            const current = lanes.indexOf(lane);
            const idx = pool.getSwimlaneInsertIndexFromPoint({ x, y });
            if (current === -1 || (current !== idx && current !== idx - 1)) {
                SwimlanePreview.add(poolView as any, 'root', E.PreviewLane, {
                    index: idx,
                    layer: dia.Paper.Layers.FRONT,
                });
            }
        }
    }

    private swimlaneCleanup(
        paper: dia.Paper,
        elementView: dia.ElementView,
        evt: dia.Event,
        x?: number,
        y?: number,
    ) {
        this.clearAll(paper);
        if (isStencilEvent(evt)) return; // stencil drop handled by 'element:drop'

        // Reordenar lane en el canvas
        const swimlane = elementView.model as shapes.bpmn2.Swimlane;
        const pool = ((evt as any).data?.poolView?.model) as shapes.bpmn2.CompositePool | null;
        if (x !== undefined && y !== undefined) {
            this.doSwimlaneDrop(swimlane, pool, x, y);
        }
    }

    // ── Drag de phase ─────────────────────────────────────────────

    private phaseDrag(
        paper: dia.Paper,
        elementView: dia.ElementView,
        evt: dia.Event,
        x: number,
        y: number,
    ) {
        highlighters.mask.removeAll(paper, E.TargetPool);
        PhasePreview.removeAll(paper, E.PreviewPhase);

        const poolView = findPoolViewFromEvent(paper, evt);
        const data = (evt as any).data ?? {};
        (evt as any).data = data;
        data.poolView = poolView;

        if (!poolView) {
            highlighters.addClass.add(elementView as any, 'root', E.InvalidDrop, {
                className: 'joint-bpmn-invalid-drop',
            });
            return;
        }

        highlighters.addClass.removeAll(paper, E.InvalidDrop);
        const pool = poolView.model as shapes.bpmn2.CompositePool;
        const oCoord = (pool as any).getPhaseOrthogonalCoordinate() as 'x' | 'y';
        const phase  = pool.findPhaseFromOrthogonalCoord(oCoord === 'x' ? x : y);

        if (phase) {
            if (data.phase !== phase) {
                highlighters.addClass.removeAll(paper, E.TargetPhase);
                highlighters.addClass.add(phase.findView(paper) as any, 'root', E.TargetPhase, {
                    className: 'joint-bpmn-phase-target',
                });
                data.phase = phase;
            }
            PhasePreview.add(phase.findView(paper) as any, 'root', E.PreviewPhase, {
                x, y,
                layer: dia.Paper.Layers.FRONT,
            });
        } else {
            highlighters.addClass.removeAll(paper, E.TargetPhase);
            this.addTargetPool(poolView);
            data.phase = null;
        }
    }

    private phaseCleanup(paper: dia.Paper) {
        this.clearAll(paper);
    }

    // ── Drop handlers ─────────────────────────────────────────────

    private poolDrop(poolView: dia.ElementView, _evt: dia.Event, _x: number, _y: number) {
        const { defaultPoolWidth = 900, onPoolChange } = this.opts;
        const pool = poolView.model as shapes.bpmn2.CompositePool;
        pool.prop(['size', 'width'], defaultPoolWidth);

        const isVertical = pool.get('type') === 'sw1.VerticalPool';
        const lane = isVertical
            ? new BPMNVerticalLane({
                attrs: { headerText: { text: 'Área 1', fontFamily: 'sans-serif' } },
                data:  { assignedAreaId: '', label: 'Área 1' },
            } as any)
            : new BPMNLane({
                attrs: { headerText: { text: 'Área 1', fontFamily: 'sans-serif' } },
                data:  { assignedAreaId: '', label: 'Área 1' },
            } as any);
        pool.addSwimlane(lane as any);
        onPoolChange?.(pool as any);
    }

    private swimlaneDrop(elementView: dia.ElementView, evt: dia.Event, x: number, y: number) {
        const swimlane = elementView.model as shapes.bpmn2.Swimlane;
        const pool = ((evt as any).data?.poolView?.model) as shapes.bpmn2.CompositePool | null;
        this.doSwimlaneDrop(swimlane, pool, x, y);
    }

    private doSwimlaneDrop(
        swimlane: shapes.bpmn2.Swimlane,
        pool: shapes.bpmn2.CompositePool | null,
        x: number,
        y: number,
    ) {
        const { onPoolChange } = this.opts;
        if (!pool) {
            if (!(swimlane as any).isEmbedded?.()) swimlane.remove();
            return;
        }

        let target: shapes.bpmn2.Swimlane = swimlane;
        if (!(swimlane as any).isCompatibleWithPool?.(pool)) {
            swimlane.remove();
            target = ((pool as any).isHorizontal()
                ? new BPMNLane({
                    attrs: { headerText: { text: 'Nueva área', fontFamily: 'sans-serif' } },
                    data:  { assignedAreaId: '', label: 'Nueva área' },
                } as any)
                : new BPMNVerticalLane({
                    attrs: { headerText: { text: 'Nueva área', fontFamily: 'sans-serif' } },
                    data:  { assignedAreaId: '', label: 'Nueva área' },
                } as any)) as unknown as shapes.bpmn2.Swimlane;
        }
        const idx = pool.getSwimlaneInsertIndexFromPoint({ x, y });
        pool.addSwimlane(target, idx);
        onPoolChange?.(pool as any);
    }

    private phaseDrop(phaseView: dia.ElementView, evt: dia.Event, x: number, y: number) {
        const { onPoolChange } = this.opts;
        const phase   = phaseView.model;
        const poolView = (evt as any).data?.poolView;

        if (!poolView) {
            if (!(phase as any).isEmbedded?.()) phase.remove();
            return;
        }

        const pool = poolView.model as shapes.bpmn2.CompositePool;
        let target: any = phase;

        if (!(phase as any).isCompatibleWithPool?.(pool)) {
            phase.remove();
            target = (pool as any).isHorizontal()
                ? new BPMNVerticalPhase({
                    attrs: { headerText: { text: 'Etapa', fontFamily: 'sans-serif' } },
                } as any)
                : new BPMNHorizontalPhase({
                    attrs: { headerText: { text: 'Etapa', fontFamily: 'sans-serif' } },
                } as any);
        }

        const oCoord = (pool as any).getPhaseOrthogonalCoordinate() as 'x' | 'y';
        const overlapped = pool.findPhaseFromOrthogonalCoord(oCoord === 'x' ? x : y);
        const phases = pool.getPhases();

        if (phases.length > 0 && !overlapped) {
            target.remove?.();
        } else {
            pool.addPhase(target, oCoord === 'x' ? x : y);
        }
        onPoolChange?.(pool as any);
    }

    private elementDrop(elementView: dia.ElementView) {
        const el = elementView.model;
        el.toFront();
        this.adjustPoolToElement(el);
    }

    // ── Helpers ───────────────────────────────────────────────────

    private adjustPoolToElement(el: dia.Element) {
        const lane = el.getParentCell();
        if (!lane || !shapes.bpmn2.Swimlane.isSwimlane(lane)) return;
        const pool = lane.getParentCell();
        if (!pool || !shapes.bpmn2.CompositePool.isPool(pool)) return;
        (pool as any).adjustToContainElements(lane);
    }
}
