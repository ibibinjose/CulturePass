"use strict";
/**
 * Canonical reserved profile handles — used by client validation and Cloud Functions.
 * Keep this list in sync across the app; do not duplicate elsewhere.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESERVED_HANDLES = exports.RESERVED_HANDLES_LIST = void 0;
exports.isReservedHandle = isReservedHandle;
/** Sorted, deduplicated reserved handles (lowercase). */
exports.RESERVED_HANDLES_LIST = [
    'admin',
    'administrator',
    'api',
    'app',
    'billing',
    'blog',
    'community',
    'contact',
    'culture-pass',
    'culturepass',
    'dashboard',
    'docs',
    'events',
    'explore',
    'ftp',
    'help',
    'home',
    'host-space',
    'hostspace',
    'info',
    'localhost',
    'login',
    'logout',
    'mail',
    'marketplace',
    'me',
    'moderator',
    'notifications',
    'official',
    'privacy',
    'profile',
    'register',
    'root',
    'search',
    'security',
    'settings',
    'signup',
    'staff',
    'status',
    'superuser',
    'support',
    'system',
    'team',
    'terms',
    'test',
    'user',
    'users',
    'verified',
    'www',
];
exports.RESERVED_HANDLES = new Set(exports.RESERVED_HANDLES_LIST);
function isReservedHandle(handle) {
    const normalized = handle.trim().toLowerCase();
    if (!normalized)
        return false;
    return exports.RESERVED_HANDLES.has(normalized);
}
//# sourceMappingURL=reservedHandles.js.map