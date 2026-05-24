"use strict";
/**
 * Host Application — submitted by users who want to become organisers / hosts
 * on CulturePass. Reviewed by the team; approval upgrades the user's role to
 * 'organizer' and unlocks the Hostspace creation lab.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOST_TYPE_OPTIONS = void 0;
exports.HOST_TYPE_OPTIONS = [
    {
        id: 'creator',
        label: 'Individual Creator',
        desc: 'Artist, performer, musician, or cultural content creator.',
        icon: 'mic-outline',
    },
    {
        id: 'business',
        label: 'Business / Brand',
        desc: 'Cultural shop, restaurant, service provider, or brand.',
        icon: 'briefcase-outline',
    },
    {
        id: 'organizer',
        label: 'Event Organizer',
        desc: 'Producer of festivals, concerts, community events, or cultural experiences.',
        icon: 'calendar-outline',
    },
    {
        id: 'venue',
        label: 'Venue Owner',
        desc: 'Cultural hall, gallery, club, studio, or event space.',
        icon: 'location-outline',
    },
    {
        id: 'community',
        label: 'Community Leader',
        desc: 'Diaspora group, cultural association, or community organisation.',
        icon: 'people-outline',
    },
];
//# sourceMappingURL=hostApplication.js.map