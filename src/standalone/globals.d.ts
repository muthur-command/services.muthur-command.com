type ContinentCode = "AF" | "AN" | "AS" | "EU" | "NA" | "OC" | "SA";

interface IncomingRequestCfProperties {
  city?: string;
  continent?: ContinentCode;
  country?: string;
  latitude?: string;
  longitude?: string;
  postalCode?: string;
  region?: string;
  regionCode?: string;
  timezone?: string;
}

interface R2Object {
  key: string;
}

interface R2Bucket {
  put(
    key: string,
    value:
      | ReadableStream
      | ArrayBuffer
      | ArrayBufferView
      | string
      | null
      | Blob
  ): Promise<R2Object>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

declare module "geoip-lite" {
  export interface Lookup {
    range: [number, number];
    country: string;
    region: string;
    eu: "0" | "1";
    timezone: string;
    city: string;
    ll: [number, number];
    metro: number;
    area: number;
  }

  export function lookup(ip: string): Lookup | null;
}
