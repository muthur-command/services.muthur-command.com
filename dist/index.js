"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
const router_1 = require("./router");
exports.default = {
    fetch: async (request, env, ctx) => (0, router_1.routeRequest)((0, common_1.sentryClient)({ request, env, ctx }), { request, env, ctx }),
};
