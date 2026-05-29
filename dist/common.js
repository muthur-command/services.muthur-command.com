"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentryClient = exports.ServiceError = void 0;
const toucan_js_1 = require("toucan-js");
class ServiceError extends Error {
    constructor(message, errorType, code) {
        super(message);
        this.name = `ServiceError - ${errorType || message}`;
        this.code = code || 500;
        this.errorType = errorType;
    }
}
exports.ServiceError = ServiceError;
const sentryClient = (event) => {
    const client = new toucan_js_1.Toucan({
        dsn: event.env.SENTRY_DSN,
        requestDataOptions: {
            allowedHeaders: ["user-agent", "cf-ray"],
        },
        context: event.ctx,
        request: event.request,
        environment: event.env.WORKER_ENV,
    });
    return client;
};
exports.sentryClient = sentryClient;
