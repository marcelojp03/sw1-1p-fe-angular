/**
 * Custom BPMN2 shapes for the workflow policy designer.
 * Extends @joint/plus bpmn2 shapes with project-specific defaults.
 */
import { shapes, util } from '@joint/plus';

// ── Layout constants ─────────────────────────────────────────────
export const POOL_HEADER_SIZE = 40;
export const LANE_HEADER_SIZE = 30;
export const LANE_CONTENT_MARGIN = 20;
export const MIN_LANE_SIZE = 60;
export const DEFAULT_POOL_WIDTH = 900;

// ── Pool ─────────────────────────────────────────────────────────

export class BPMNPool extends shapes.bpmn2.HeaderedHorizontalPool {
    override defaults() {
        return util.defaultsDeep({
            type: 'sw1.Pool',
            headerSide: 'top',
            padding: { top: POOL_HEADER_SIZE, left: 0 },
            headerTextMargin: 5,
            contentMargin: LANE_CONTENT_MARGIN,
            minimumLaneSize: MIN_LANE_SIZE,
            attrs: {
                header: { stroke: '#94a3b8', fill: '#e2e8f0' },
                headerText: { fill: '#1e293b', fontFamily: 'sans-serif', fontSize: 14, fontWeight: 'bold' },
            },
        }, super.defaults);
    }
    afterPhasesEmbedded() {
        (this as any).setStackingOrder?.();
    }
}

export const BPMNPoolView = shapes.bpmn2.HeaderedHorizontalPoolView;

// ── Lane (Swimlane) ───────────────────────────────────────────────

export class BPMNLane extends shapes.bpmn2.HorizontalSwimlane {
    override defaults() {
        return util.defaultsDeep({
            type: 'sw1.Lane',
            headerSide: 'left',
            headerSize: LANE_HEADER_SIZE,
            headerTextMargin: 5,
            contentMargin: LANE_CONTENT_MARGIN,
            minimumLaneSize: MIN_LANE_SIZE,
            attrs: {
                header: { stroke: '#cbd5e1', fill: '#f8fafc' },
                headerText: { fill: '#334155', fontFamily: 'sans-serif', fontSize: 12 },
            },
        }, super.defaults);
    }
}

export const BPMNLaneView = shapes.bpmn2.HorizontalSwimlaneView;

// ── Event (Start / End / Intermediate) ───────────────────────────
// Following the demo pattern from bpmn-pools-swimlanes-milestones

export class BPMNEvent extends shapes.bpmn2.Event {
    override defaults() {
        return util.defaultsDeep({
            type: 'sw1.Event',
            attrs: {
                root: {
                    highlighterSelector: 'border',
                    frameSelector: 'background',
                },
                label: {
                    fontFamily: 'sans-serif',
                    cursor: 'text',
                    textWrap: { width: 100, height: 60, ellipsis: true },
                },
            },
        }, super.defaults);
    }
}

// ── Activity (Task) ───────────────────────────────────────────────

export class BPMNActivity extends shapes.bpmn2.Activity {
    override defaults() {
        return util.defaultsDeep({
            type: 'sw1.Activity',
            attrs: {
                root: {
                    highlighterSelector: 'border',
                    frameSelector: 'background',
                },
                label: {
                    fontFamily: 'sans-serif',
                    cursor: 'text',
                    fontSize: 12,
                    textWrap: { height: -10 },
                },
            },
        }, super.defaults);
    }
}

// ── Gateway (Decision / Parallel) ────────────────────────────────

export class BPMNGateway extends shapes.bpmn2.Gateway {
    override defaults() {
        return util.defaultsDeep({
            type: 'sw1.Gateway',
            attrs: {
                root: {
                    frameSelector: 'body',
                },
                label: {
                    fontFamily: 'sans-serif',
                    cursor: 'text',
                    textWrap: { width: 100, height: 60, ellipsis: true },
                },
            },
        }, super.defaults);
    }
}

// ── Vertical Pool ─────────────────────────────────────────────────

export class BPMNVerticalPool extends shapes.bpmn2.HeaderedVerticalPool {
    override defaults() {
        return util.defaultsDeep({
            type: 'sw1.VerticalPool',
            headerSide: 'left',
            padding: { top: 0, left: POOL_HEADER_SIZE },
            headerTextMargin: 5,
            contentMargin: LANE_CONTENT_MARGIN,
            minimumLaneSize: MIN_LANE_SIZE,
            attrs: {
                header: { stroke: '#94a3b8', fill: '#e2e8f0' },
                headerText: { fill: '#1e293b', fontFamily: 'sans-serif', fontSize: 14, fontWeight: 'bold' },
            },
        }, super.defaults);
    }
    afterPhasesEmbedded() {
        (this as any).setStackingOrder?.();
    }
}

export const BPMNVerticalPoolView = shapes.bpmn2.HeaderedVerticalPoolView;

// ── Vertical Lane ─────────────────────────────────────────────────

export class BPMNVerticalLane extends shapes.bpmn2.VerticalSwimlane {
    override defaults() {
        return util.defaultsDeep({
            type: 'sw1.VerticalLane',
            headerSide: 'top',
            headerSize: LANE_HEADER_SIZE,
            headerTextMargin: 5,
            contentMargin: LANE_CONTENT_MARGIN,
            minimumLaneSize: MIN_LANE_SIZE,
            attrs: {
                header: { stroke: '#cbd5e1', fill: '#f8fafc' },
                headerText: { fill: '#334155', fontFamily: 'sans-serif', fontSize: 12 },
            },
        }, super.defaults);
    }
}

export const BPMNVerticalLaneView = shapes.bpmn2.VerticalSwimlaneView;

// ── Vertical Phase (usado en horizontal pools como columna/etapa) ─
// HorizontalPool contiene VerticalPhases

export class BPMNVerticalPhase extends shapes.bpmn2.VerticalPhase {
    override defaults() {
        return util.defaultsDeep({
            type: 'sw1.VerticalPhase',
            headerSide: 'top',
            headerSize: LANE_HEADER_SIZE,
            headerTextMargin: 5,
            attrs: {
                header: { stroke: '#94a3b8', fill: '#dbeafe', strokeDasharray: '5,3' },
                headerText: { fill: '#1e3a8a', fontFamily: 'sans-serif', fontSize: 12 },
                body:   { stroke: '#94a3b8', fill: '#f0f9ff' },
            },
        }, super.defaults);
    }
}

export const BPMNVerticalPhaseView = shapes.bpmn2.VerticalPhaseView;

// ── Horizontal Phase (usado en vertical pools como fila/etapa) ────
// VerticalPool contiene HorizontalPhases

export class BPMNHorizontalPhase extends shapes.bpmn2.HorizontalPhase {
    override defaults() {
        return util.defaultsDeep({
            type: 'sw1.HorizontalPhase',
            headerSide: 'left',
            headerSize: LANE_HEADER_SIZE,
            headerTextMargin: 5,
            attrs: {
                header: { stroke: '#94a3b8', fill: '#dbeafe', strokeDasharray: '5,3' },
                headerText: { fill: '#1e3a8a', fontFamily: 'sans-serif', fontSize: 12 },
                body:   { stroke: '#94a3b8', fill: '#f0f9ff' },
            },
        }, super.defaults);
    }
}

export const BPMNHorizontalPhaseView = shapes.bpmn2.HorizontalPhaseView;

// ── App shapes namespace ──────────────────────────────────────────
// Spread all default @joint/plus shapes and add our custom ones
// under the 'sw1' namespace so JointJS can deserialize them by type.

export const APP_SHAPES = {
    ...shapes,
    sw1: {
        Pool: BPMNPool,
        PoolView: BPMNPoolView,
        VerticalPool: BPMNVerticalPool,
        VerticalPoolView: BPMNVerticalPoolView,
        Lane: BPMNLane,
        LaneView: BPMNLaneView,
        VerticalLane: BPMNVerticalLane,
        VerticalLaneView: BPMNVerticalLaneView,
        VerticalPhase: BPMNVerticalPhase,
        VerticalPhaseView: BPMNVerticalPhaseView,
        HorizontalPhase: BPMNHorizontalPhase,
        HorizontalPhaseView: BPMNHorizontalPhaseView,
        Event: BPMNEvent,
        Activity: BPMNActivity,
        Gateway: BPMNGateway,
    },
} as typeof shapes & {
    sw1: {
        Pool: typeof BPMNPool;
        PoolView: typeof BPMNPoolView;
        VerticalPool: typeof BPMNVerticalPool;
        VerticalPoolView: typeof BPMNVerticalPoolView;
        Lane: typeof BPMNLane;
        LaneView: typeof BPMNLaneView;
        VerticalLane: typeof BPMNVerticalLane;
        VerticalLaneView: typeof BPMNVerticalLaneView;
        VerticalPhase: typeof BPMNVerticalPhase;
        VerticalPhaseView: typeof BPMNVerticalPhaseView;
        HorizontalPhase: typeof BPMNHorizontalPhase;
        HorizontalPhaseView: typeof BPMNHorizontalPhaseView;
        Event: typeof BPMNEvent;
        Activity: typeof BPMNActivity;
        Gateway: typeof BPMNGateway;
    };
};
