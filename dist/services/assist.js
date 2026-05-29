"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assistHandler = void 0;
var TRIGGER_PATH;
(function (TRIGGER_PATH) {
    TRIGGER_PATH["WAKE_WORD_TRAINING_UPLOAD"] = "/assist/wake_word/training_data/upload";
})(TRIGGER_PATH || (TRIGGER_PATH = {}));
const WAKE_WORD_ALLOWED_CONTENT_TYPES = [
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/wav",
];
const WAKE_WORD_ALLOWED_NAMES = ["casita", "ok_nabu"];
const NEGATIVE_WAKE_WORD_ALLOWED_NAMES = ["ok_now"];
const WAKE_WORD_MAX_CONTENT_LENGTH = 250 * 1024;
const USER_CONTENT_MAX_CONTENT_LENGTH = 150;
const createResponse = (options) => new Response(JSON.stringify(options.content, null, 2), {
    status: options.status ?? 400,
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "PUT",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json;charset=UTF-8",
    },
});
const handleUploadAudioFile = async (event) => {
    const { request } = event;
    const contentType = request.headers.get("content-type")?.split(";")[0];
    const contentLengthHeaderValue = request.headers.get("content-length");
    const contentLength = contentLengthHeaderValue && parseInt(contentLengthHeaderValue, 10);
    const cfRay = request.headers.get("cf-ray");
    const { searchParams } = new URL(request.url);
    const wakeWord = searchParams.get("wake_word");
    const userContent = searchParams.get("user_content");
    const sanitizedUserContent = userContent
        ? userContent.replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        : "";
    if (request.method !== "PUT") {
        return createResponse({
            content: { message: "Invalid method" },
            status: 405,
        });
    }
    if (!contentType || !WAKE_WORD_ALLOWED_CONTENT_TYPES.includes(contentType)) {
        return createResponse({
            content: {
                message: `Invalid content-type, received: ${contentType}, allowed: ${WAKE_WORD_ALLOWED_CONTENT_TYPES}`,
            },
            status: 415,
        });
    }
    if (!contentLength || contentLength > WAKE_WORD_MAX_CONTENT_LENGTH) {
        return createResponse({
            content: {
                message: `Invalid content-length, received: ${contentLength}, allowed [<${WAKE_WORD_MAX_CONTENT_LENGTH}]`,
            },
            status: 413,
        });
    }
    if (!(wakeWord && sanitizedUserContent)) {
        return createResponse({
            content: {
                message: `Invalid parameters: missing user_content or wake_word`,
            },
        });
    }
    if (![...WAKE_WORD_ALLOWED_NAMES, ...NEGATIVE_WAKE_WORD_ALLOWED_NAMES].includes(wakeWord)) {
        return createResponse({
            content: { message: `Invalid wake word, received: ${wakeWord}` },
        });
    }
    if (sanitizedUserContent.length > USER_CONTENT_MAX_CONTENT_LENGTH) {
        return createResponse({
            content: {
                message: `Invalid user content length, received: ${sanitizedUserContent.length}, allowed [<${USER_CONTENT_MAX_CONTENT_LENGTH}]`,
            },
        });
    }
    const isNegative = NEGATIVE_WAKE_WORD_ALLOWED_NAMES.includes(wakeWord);
    const keyExtension = contentType.replace("audio/", "");
    const key = `${isNegative ? "negative-" : ""}${wakeWord}-${sanitizedUserContent}-${cfRay}.${keyExtension}`;
    await event.env.WAKEWORD_TRAINING_BUCKET.put(key, request.body);
    return createResponse({ content: { message: "success", key }, status: 201 });
};
async function assistHandler(requestUrl, event, _sentry) {
    if (event.request.method === "OPTIONS") {
        // CORS preflight request
        return createResponse({ content: "ok", status: 200 });
    }
    switch (requestUrl.pathname) {
        case TRIGGER_PATH.WAKE_WORD_TRAINING_UPLOAD:
            return await handleUploadAudioFile(event);
    }
    return createResponse({ content: "Not Found", status: 404 });
}
exports.assistHandler = assistHandler;
