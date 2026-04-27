/**
 * Custom BPMN2 shapes for the workflow policy designer.
 * Extends @joint/plus bpmn2 shapes with project-specific defaults.
 */
import { shapes, util } from '@joint/plus';

// ── Layout constants ─────────────────────────────────────────────
export const POOL_HEADER_SIZE = 40;
export const LANE_HEADER_SIZE = 32;
export const LANE_CONTENT_MARGIN = 20;
export const MIN_LANE_SIZE = 140;
export const DEFAULT_POOL_WIDTH = 1000;

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

// ── App shapes namespace ──────────────────────────────────────────
// Spread all default @joint/plus shapes and add our custom ones
// under the 'sw1' namespace so JointJS can deserialize them by type.

export const APP_SHAPES = {
    ...shapes,
    sw1: {
        Pool: BPMNPool,
        PoolView: BPMNPoolView,
        Lane: BPMNLane,
        LaneView: BPMNLaneView,
    },
} as typeof shapes & { sw1: { Pool: typeof BPMNPool; PoolView: typeof BPMNPoolView; Lane: typeof BPMNLane; LaneView: typeof BPMNLaneView } };
