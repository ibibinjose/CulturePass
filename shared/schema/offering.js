"use strict";
/**
 * Phase 5 — Unified “offering” view across domain collections.
 * Source of truth stays in restaurants / shops / activities / movies; this is a read model + mappers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OFFERING_KINDS = exports.OFFERING_DOMAINS = void 0;
exports.offeringsFromRestaurant = offeringsFromRestaurant;
exports.offeringsFromShop = offeringsFromShop;
exports.offeringFromActivity = offeringFromActivity;
exports.offeringsFromMovie = offeringsFromMovie;
exports.buildUnifiedOfferings = buildUnifiedOfferings;
exports.filterUnifiedOfferings = filterUnifiedOfferings;
exports.OFFERING_DOMAINS = [
    'restaurant',
    'shopping',
    'activity',
    'movie',
];
exports.OFFERING_KINDS = [
    'restaurant_deal',
    'restaurant_menu_highlight',
    'shopping_deal',
    'activity_listing',
    'movie_showtime',
];
function showtimePriceCents(price) {
    if (!Number.isFinite(price))
        return undefined;
    return Math.max(0, Math.round(price * 100));
}
function showtimePriceLabel(price, currency) {
    const sym = currency === 'AUD' ? '$' : `${currency} `;
    return `${sym}${Number(price).toFixed(Number.isInteger(price) ? 0 : 2)}`;
}
function offeringsFromRestaurant(r) {
    const base = { city: r.city, country: r.country, parentId: r.id, parentTitle: r.name, isPromoted: r.isPromoted };
    const href = `/r/${r.id}`;
    const out = [];
    for (const deal of r.deals ?? []) {
        if (deal.isActive === false)
            continue;
        out.push({
            id: `restaurant:${r.id}:deal:${deal.id}`,
            kind: 'restaurant_deal',
            domain: 'restaurant',
            ...base,
            title: deal.title,
            subtitle: deal.discount,
            description: deal.description,
            imageUrl: r.imageUrl,
            validTo: deal.validTill,
            href,
        });
    }
    (r.menuHighlights ?? []).forEach((line, idx) => {
        const title = line.trim();
        if (!title)
            return;
        out.push({
            id: `restaurant:${r.id}:menu:${idx}`,
            kind: 'restaurant_menu_highlight',
            domain: 'restaurant',
            ...base,
            title,
            subtitle: r.cuisine,
            imageUrl: r.imageUrl,
            href,
        });
    });
    return out;
}
function offeringsFromShop(s) {
    const base = { city: s.city, country: s.country, parentId: s.id, parentTitle: s.name, isPromoted: s.isPromoted };
    const href = `/s/${s.id}`;
    const out = [];
    for (const deal of s.deals ?? []) {
        if (deal.isActive === false)
            continue;
        out.push({
            id: `shopping:${s.id}:deal:${deal.id}`,
            kind: 'shopping_deal',
            domain: 'shopping',
            ...base,
            title: deal.title,
            subtitle: deal.discount,
            description: deal.description,
            imageUrl: s.imageUrl,
            validTo: deal.validTill,
            href,
        });
    }
    return out;
}
function offeringFromActivity(a) {
    if (a.status === 'draft' || a.status === 'archived')
        return null;
    return {
        id: `activity:${a.id}`,
        kind: 'activity_listing',
        domain: 'activity',
        parentId: a.id,
        parentTitle: a.name,
        title: a.name,
        subtitle: a.category,
        description: a.description,
        imageUrl: a.imageUrl,
        priceLabel: a.priceLabel,
        city: a.city,
        country: a.country,
        isPromoted: a.isPromoted === true,
        href: `/a/${a.id}`,
    };
}
function offeringsFromMovie(m, currency = 'AUD') {
    const base = {
        city: m.city,
        country: m.country,
        parentId: m.id,
        parentTitle: m.title,
        isPromoted: m.isPromoted,
    };
    const href = `/m/${m.id}`;
    const poster = m.posterUrl;
    return (m.showtimes ?? []).map((st) => ({
        id: `movie:${m.id}:showtime:${st.id}`,
        kind: 'movie_showtime',
        domain: 'movie',
        ...base,
        title: m.title,
        subtitle: `${st.venueName} · ${st.date} ${st.time}`,
        description: m.description,
        imageUrl: poster,
        priceCents: showtimePriceCents(st.price),
        priceLabel: showtimePriceLabel(st.price, currency),
        currency,
        validFrom: st.date,
        href,
        externalUrl: st.bookingUrl,
    }));
}
function buildUnifiedOfferings(input) {
    const rows = [
        ...input.restaurants.flatMap(offeringsFromRestaurant),
        ...input.shops.flatMap(offeringsFromShop),
        ...input.activities.map(offeringFromActivity).filter((o) => o !== null),
        ...input.movies.flatMap((m) => offeringsFromMovie(m)),
    ];
    rows.sort((a, b) => {
        const pr = Number(b.isPromoted) - Number(a.isPromoted);
        if (pr !== 0)
            return pr;
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    });
    return rows;
}
function filterUnifiedOfferings(rows, kinds, domains) {
    return rows.filter((o) => (!domains || domains.size === 0 || domains.has(o.domain)) &&
        (!kinds || kinds.size === 0 || kinds.has(o.kind)));
}
//# sourceMappingURL=offering.js.map