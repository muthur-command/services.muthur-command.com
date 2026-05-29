import geoip from "geoip-lite";

const CONTINENT_BY_COUNTRY: Record<string, string> = {
  CN: "AS",
  US: "NA",
  GB: "EU",
  DE: "EU",
  FR: "EU",
  JP: "AS",
  AU: "OC",
};

export function clientIpFromHeaders(
  headers: Headers,
  remoteAddress?: string
): string {
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || remoteAddress || "127.0.0.1";
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return remoteAddress?.replace(/^::ffff:/, "") || "127.0.0.1";
}

export function cfPropertiesFromIp(ip: string): IncomingRequestCfProperties {
  const lookup = geoip.lookup(ip);

  if (!lookup) {
    return {} as unknown as IncomingRequestCfProperties;
  }

  const continent = lookup.country
    ? CONTINENT_BY_COUNTRY[lookup.country]
    : undefined;

  return {
    city: lookup.city,
    country: lookup.country,
    continent,
    region: lookup.region,
    regionCode: lookup.region,
    timezone: lookup.timezone,
    latitude: lookup.ll?.[0]?.toString(),
    longitude: lookup.ll?.[1]?.toString(),
  } as unknown as IncomingRequestCfProperties;
}
