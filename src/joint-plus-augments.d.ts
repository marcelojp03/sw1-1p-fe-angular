/**
 * Module augmentation for @joint/plus to expose the `highlighters` namespace
 * that is available at runtime but not always included in the TypeScript
 * type definitions of this build configuration.
 *
 * IMPORTANT: The `export {}` below makes this file a TypeScript "module"
 * so that `declare module` acts as an AUGMENTATION (not a replacement).
 */
export {};

declare module '@joint/plus' {
    /** JointJS highlighter utilities. Available at runtime via @joint/core. */
    export namespace highlighters {
        /** Mask highlighter – draws an SVG mask overlay on a cell view. */
        const mask: {
            add(
                cellView: import('@joint/plus').dia.CellView,
                selector: string,
                id: string,
                options?: { attrs?: Record<string, string | number> }
            ): void;
            remove(
                cellView: import('@joint/plus').dia.CellView,
                id: string
            ): void;
            removeAll(paper: import('@joint/plus').dia.Paper): void;
        };
        /** addClass highlighter – adds CSS class names to a cell view. */
        const addClass: {
            add(
                cellView: import('@joint/plus').dia.CellView,
                selector: string,
                id: string,
                options?: { className: string }
            ): void;
            remove(
                cellView: import('@joint/plus').dia.CellView,
                id: string
            ): void;
        };
        /** stroke highlighter – draws a stroke outline on a cell view. */
        const stroke: {
            add(
                cellView: import('@joint/plus').dia.CellView,
                selector: string,
                id: string,
                options?: Record<string, unknown>
            ): void;
            remove(
                cellView: import('@joint/plus').dia.CellView,
                id: string
            ): void;
        };
    }
}
