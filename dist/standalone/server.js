"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startStandaloneServer = exports.createStandaloneEnv = void 0;
const http_1 = require("http");
const crypto_1 = require("crypto");
const promises_1 = require("fs/promises");
const router_1 = require("../router");
const geo_1 = require("./geo");
const storage_1 = require("./storage");
const sentry_1 = require("./sentry");
const DEFAULT_PORT = 3000;
async function readBody(req) {
    if (req.method === "GET" || req.method === "HEAD") {
        return undefined;
    }
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}
function headersFromNode(req) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (value === undefined) {
            continue;
        }
        if (Array.isArray(value)) {
            value.forEach((entry) => headers.append(key, entry));
        }
        else {
            headers.set(key, value);
        }
    }
    return headers;
}
async function buildWorkerEvent(req, body, env) {
    const host = req.headers.host || `127.0.0.1:${process.env.PORT || DEFAULT_PORT}`;
    const url = new URL(req.url || "/", `http://${host}`);
    const headers = headersFromNode(req);
    if (!headers.has("cf-ray")) {
        headers.set("cf-ray", (0, crypto_1.randomUUID)());
    }
    const clientIp = (0, geo_1.clientIpFromHeaders)(headers, req.socket.remoteAddress);
    if (!headers.has("cf-connecting-ip")) {
        headers.set("cf-connecting-ip", clientIp);
    }
    const requestInit = {
        method: req.method,
        headers,
    };
    if (body !== undefined && body.length > 0) {
        requestInit.body = body;
    }
    const request = new Request(url, requestInit);
    request.cf = (0, geo_1.cfPropertiesFromIp)(clientIp);
    return {
        request,
        env,
        ctx: {},
    };
}
async function writeResponse(res, response) {
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
        res.setHeader(key, value);
    });
    if (response.body) {
        const buffer = Buffer.from(await response.arrayBuffer());
        res.end(buffer);
        return;
    }
    res.end();
}
async function createStandaloneEnv() {
    const dataDir = process.env.WAKEWORD_DATA_DIR || "/data/wakeword";
    await (0, promises_1.mkdir)(dataDir, { recursive: true });
    return {
        SENTRY_DSN: "",
        WORKER_ENV: process.env.WORKER_ENV || "production",
        MAILERLITE_API_KEY: "",
        WAKEWORD_TRAINING_BUCKET: new storage_1.FilesystemBucket(dataDir),
    };
}
exports.createStandaloneEnv = createStandaloneEnv;
async function startStandaloneServer() {
    const port = Number(process.env.PORT || DEFAULT_PORT);
    const env = await createStandaloneEnv();
    const sentry = (0, sentry_1.noopSentry)();
    const server = (0, http_1.createServer)(async (req, res) => {
        try {
            const body = await readBody(req);
            const event = await buildWorkerEvent(req, body, env);
            const response = await (0, router_1.routeRequest)(sentry, event);
            await writeResponse(res, response);
        }
        catch (err) {
            console.error("Standalone server error:", err);
            res.statusCode = 500;
            res.end("Internal Server Error");
        }
    });
    await new Promise((resolve) => {
        server.listen(port, "0.0.0.0", resolve);
    });
    console.log(`services.muthur-command.com listening on http://0.0.0.0:${port}`);
}
exports.startStandaloneServer = startStandaloneServer;
if (require.main === module) {
    startStandaloneServer().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
