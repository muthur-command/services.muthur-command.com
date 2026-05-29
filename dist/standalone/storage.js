"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesystemBucket = void 0;
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
class FilesystemBucket {
    constructor(rootDir) {
        this.rootDir = rootDir;
    }
    async put(key, value) {
        const safeKey = key.replace(/(\.\.|\/)/g, "_");
        const filePath = path_1.default.join(this.rootDir, safeKey);
        await (0, promises_1.mkdir)(path_1.default.dirname(filePath), { recursive: true });
        if (value === null) {
            await (0, promises_1.writeFile)(filePath, "");
            return { key: safeKey };
        }
        if (typeof value === "string") {
            await (0, promises_1.writeFile)(filePath, value);
            return { key: safeKey };
        }
        if (value instanceof ArrayBuffer) {
            await (0, promises_1.writeFile)(filePath, Buffer.from(value));
            return { key: safeKey };
        }
        if (ArrayBuffer.isView(value)) {
            await (0, promises_1.writeFile)(filePath, Buffer.from(value.buffer, value.byteOffset, value.byteLength));
            return { key: safeKey };
        }
        const chunks = [];
        const reader = value.getReader();
        while (true) {
            const { done, value: chunk } = await reader.read();
            if (done) {
                break;
            }
            chunks.push(Buffer.from(chunk));
        }
        await (0, promises_1.writeFile)(filePath, Buffer.concat(chunks));
        return { key: safeKey };
    }
}
exports.FilesystemBucket = FilesystemBucket;
