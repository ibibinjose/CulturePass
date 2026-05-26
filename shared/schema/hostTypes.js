"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostEntityTypeSchema = void 0;
const zod_1 = require("zod");
// ============================================================================
// HostSpace Enterprise-Grade Form System - Common Types
// ============================================================================
exports.HostEntityTypeSchema = zod_1.z.enum([
    'community',
    'organiser',
    'venue',
    'business',
    'artist',
    'professional',
]);
//# sourceMappingURL=hostTypes.js.map