import { Toucan } from "toucan-js";

export function noopSentry(): Toucan {
  return {
    setTag: () => undefined,
    setExtra: () => undefined,
    setExtras: () => undefined,
    addBreadcrumb: () => undefined,
    captureException: () => "standalone",
  } as unknown as Toucan;
}
