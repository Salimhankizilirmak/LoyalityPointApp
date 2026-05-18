"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
var libsql_1 = require("drizzle-orm/libsql");
var client_1 = require("@libsql/client");
var schema = require("./schema");
var url = ((_a = process.env.TURSO_DATABASE_URL) === null || _a === void 0 ? void 0 : _a.trim()) || "";
var authToken = ((_b = process.env.TURSO_AUTH_TOKEN) === null || _b === void 0 ? void 0 : _b.trim()) || "";
// Turso için libsql:// bazen HTTP transport'ta sorun çıkarabilir, https:// daha garantidir
var finalUrl = url.startsWith("libsql://")
    ? url.replace("libsql://", "https://")
    : url;
var client = (0, client_1.createClient)({
    url: finalUrl,
    authToken: authToken,
});
exports.db = (0, libsql_1.drizzle)(client, { schema: schema });
