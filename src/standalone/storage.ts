import { mkdir, writeFile } from "fs/promises";
import path from "path";

export class FilesystemBucket implements R2Bucket {
  constructor(private readonly rootDir: string) {}

  async put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null
  ): Promise<R2Object> {
    const safeKey = key.replace(/(\.\.|\/)/g, "_");
    const filePath = path.join(this.rootDir, safeKey);
    await mkdir(path.dirname(filePath), { recursive: true });

    if (value === null) {
      await writeFile(filePath, "");
      return { key: safeKey } as R2Object;
    }

    if (typeof value === "string") {
      await writeFile(filePath, value);
      return { key: safeKey } as R2Object;
    }

    if (value instanceof ArrayBuffer) {
      await writeFile(filePath, Buffer.from(value));
      return { key: safeKey } as R2Object;
    }

    if (ArrayBuffer.isView(value)) {
      await writeFile(
        filePath,
        Buffer.from(value.buffer, value.byteOffset, value.byteLength)
      );
      return { key: safeKey } as R2Object;
    }

    const chunks: Buffer[] = [];
    const reader = value.getReader();
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(Buffer.from(chunk));
    }
    await writeFile(filePath, Buffer.concat(chunks));
    return { key: safeKey } as R2Object;
  }
}
