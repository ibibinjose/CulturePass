"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMUNITY_LEGAL_STATUS_LABELS = exports.REPRESENTATIVE_ROLE_LABELS = exports.CIVIC_TIER_LABELS = exports.REPRESENTATIVE_ROLE_COLORS = exports.CIVIC_TIER_COLORS = void 0;
/** Civic color token mapping — drives UI badge and card styling */
exports.CIVIC_TIER_COLORS = {
    federal: '#4F46E5', // CultureTokens.indigo — highest authority
    state: '#4F46E5', // CultureTokens.indigo
    local: '#0D9488', // CultureTokens.teal — most relevant for CulturePass
    ward: '#0D9488', // CultureTokens.teal
};
exports.REPRESENTATIVE_ROLE_COLORS = {
    federal_mp: '#4F46E5', // Indigo — trust
    state_mp: '#4F46E5', // Indigo
    mayor: '#0D9488', // Teal — stewardship
    deputy_mayor: '#0D9488',
    councillor: '#0D9488',
    community_leader: '#0D9488', // Teal — community
    artist: '#FF5E5B', // Coral — creative energy
};
exports.CIVIC_TIER_LABELS = {
    federal: 'Federal',
    state: 'State',
    local: 'Council',
    ward: 'Ward',
};
exports.REPRESENTATIVE_ROLE_LABELS = {
    federal_mp: 'Federal MP',
    state_mp: 'State MP',
    mayor: 'Mayor',
    deputy_mayor: 'Deputy Mayor',
    councillor: 'Councillor',
    community_leader: 'Community Leader',
    artist: 'Artist',
};
exports.COMMUNITY_LEGAL_STATUS_LABELS = {
    incorporated_association: 'Incorporated Association',
    nonprofit: 'Non-Profit Organisation',
    company_limited_by_guarantee: 'Company Limited by Guarantee',
    cooperative: 'Cooperative',
    indigenous_corporation: 'Indigenous Corporation (CATSI)',
    informal: 'Informal / Unincorporated Group',
    other: 'Other',
};
//# sourceMappingURL=profile.js.map