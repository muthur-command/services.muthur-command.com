"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noopSentry = void 0;
function noopSentry() {
    return {
        setTag: () => undefined,
        setExtra: () => undefined,
        setExtras: () => undefined,
        addBreadcrumb: () => undefined,
        captureException: () => "standalone",
    };
}
exports.noopSentry = noopSentry;
