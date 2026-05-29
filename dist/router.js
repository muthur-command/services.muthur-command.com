"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRequestWrapper = exports.routeRequest = void 0;
const common_1 = require("./common");
const assist_1 = require("./services/assist");
const whoami_1 = require("./services/whoami");
async function routeRequest(sentry, event) {
    let requestUrl = new URL(event.request.url);
    if (requestUrl.host.startsWith("whoami")) {
        // Legacy "rewrite" for old whoami address
        requestUrl = new URL(`${requestUrl.protocol}//services.muthur-command.com/whoami${requestUrl.pathname}`);
    }
    const service = requestUrl.pathname.split("/")[1];
    sentry.setTag("service", service);
    sentry.setExtra("requestUrl", {
        protocol: requestUrl.protocol,
        pathname: requestUrl.pathname,
        url: requestUrl,
    });
    switch (service) {
        case "whoami":
            return handleRequestWrapper(requestUrl, event, sentry, whoami_1.whoamiHandler);
        case "assist":
            return handleRequestWrapper(requestUrl, event, sentry, assist_1.assistHandler);
        default:
            return new Response(null, { status: 404 });
    }
}
exports.routeRequest = routeRequest;
async function handleRequestWrapper(requestUrl, event, sentry, serviceHandler) {
    try {
        return await serviceHandler(requestUrl, event, sentry);
    }
    catch (err) {
        if (!(err instanceof common_1.ServiceError)) {
            err = new common_1.ServiceError(err.message);
        }
        sentry.addBreadcrumb({ message: err.message });
        const captureId = sentry.captureException(err);
        let returnBody;
        const headers = {
            "Access-Control-Allow-Origin": "*",
        };
        if ((event.request.headers.get("accept") || "").includes("json")) {
            returnBody = JSON.stringify({ error: err.errorType });
            headers["content-type"] = "application/json;charset=UTF-8";
        }
        else {
            returnBody = `Error: ${err.errorType}`;
        }
        console.error(`[${err.code}] ${returnBody} (${captureId})`);
        return new Response(returnBody, {
            status: err.code,
            headers,
        });
    }
}
exports.handleRequestWrapper = handleRequestWrapper;
