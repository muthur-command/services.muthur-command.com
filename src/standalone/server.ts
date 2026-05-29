import { createServer, IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "crypto";
import { mkdir } from "fs/promises";
import { CfRequest, WorkerEnv, WorkerEvent } from "../common";
import { routeRequest } from "../router";
import { cfPropertiesFromIp, clientIpFromHeaders } from "./geo";
import { FilesystemBucket } from "./storage";
import { noopSentry } from "./sentry";

const DEFAULT_PORT = 3000;

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function headersFromNode(req: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(key, entry));
    } else {
      headers.set(key, value);
    }
  }
  return headers;
}

async function buildWorkerEvent(
  req: IncomingMessage,
  body: Buffer | undefined,
  env: WorkerEnv
): Promise<WorkerEvent> {
  const host = req.headers.host || `127.0.0.1:${process.env.PORT || DEFAULT_PORT}`;
  const url = new URL(req.url || "/", `http://${host}`);
  const headers = headersFromNode(req);

  if (!headers.has("cf-ray")) {
    headers.set("cf-ray", randomUUID());
  }

  const clientIp = clientIpFromHeaders(headers, req.socket.remoteAddress);
  if (!headers.has("cf-connecting-ip")) {
    headers.set("cf-connecting-ip", clientIp);
  }

  const requestInit: RequestInit = {
    method: req.method,
    headers,
  };
  if (body !== undefined && body.length > 0) {
    requestInit.body = body;
  }

  const request = new Request(url, requestInit) as CfRequest;
  request.cf = cfPropertiesFromIp(clientIp);

  return {
    request,
    env,
    ctx: {} as ExecutionContext,
  };
}

async function writeResponse(res: ServerResponse, response: Response): Promise<void> {
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

export async function createStandaloneEnv(): Promise<WorkerEnv> {
  const dataDir = process.env.WAKEWORD_DATA_DIR || "/data/wakeword";
  await mkdir(dataDir, { recursive: true });

  return {
    SENTRY_DSN: "",
    WORKER_ENV: process.env.WORKER_ENV || "production",
    MAILERLITE_API_KEY: "",
    WAKEWORD_TRAINING_BUCKET: new FilesystemBucket(dataDir),
  };
}

export async function startStandaloneServer(): Promise<void> {
  const port = Number(process.env.PORT || DEFAULT_PORT);
  const env = await createStandaloneEnv();
  const sentry = noopSentry();

  const server = createServer(async (req, res) => {
    try {
      const body = await readBody(req);
      const event = await buildWorkerEvent(req, body, env);
      const response = await routeRequest(sentry, event);
      await writeResponse(res, response);
    } catch (err) {
      console.error("Standalone server error:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(port, "0.0.0.0", resolve);
  });

  console.log(`services.muthur-command.com listening on http://0.0.0.0:${port}`);
}

if (require.main === module) {
  startStandaloneServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
