"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cfPropertiesFromIp = exports.clientIpFromHeaders = void 0;
const geoip_lite_1 = __importDefault(require("geoip-lite"));
const CONTINENT_BY_COUNTRY = {
    CN: "AS",
    US: "NA",
    GB: "EU",
    DE: "EU",
    FR: "EU",
    JP: "AS",
    AU: "OC",
};
function clientIpFromHeaders(headers, remoteAddress) {
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
exports.clientIpFromHeaders = clientIpFromHeaders;
function cfPropertiesFromIp(ip) {
    const lookup = geoip_lite_1.default.lookup(ip);
    if (!lookup) {
        return {};
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
    };
}
exports.cfPropertiesFromIp = cfPropertiesFromIp;
