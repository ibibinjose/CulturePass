"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const hostProfile_1 = require("../hostProfile");
const hostTypes_1 = require("../hostTypes");
(0, globals_1.describe)('HostProfile Schema', () => {
    (0, globals_1.describe)('HostEntityTypeSchema', () => {
        (0, globals_1.it)('should validate valid entity types', () => {
            const validTypes = [
                'community',
                'organiser',
                'venue',
                'business',
                'artist',
                'professional',
            ];
            validTypes.forEach((type) => {
                (0, globals_1.expect)(() => hostTypes_1.HostEntityTypeSchema.parse(type)).not.toThrow();
            });
        });
        (0, globals_1.it)('should reject invalid entity types', () => {
            (0, globals_1.expect)(() => hostTypes_1.HostEntityTypeSchema.parse('invalid')).toThrow();
        });
    });
    (0, globals_1.describe)('CommunityDataSchema', () => {
        (0, globals_1.it)('should validate valid community data', () => {
            const validData = {
                membershipModel: 'free',
                membershipCount: 100,
                growthData: [
                    { date: '2024-01-01', memberCount: 50 },
                    { date: '2024-02-01', memberCount: 100 },
                ],
                guidelines: '<p>Community guidelines</p>',
            };
            (0, globals_1.expect)(() => hostProfile_1.CommunityDataSchema.parse(validData)).not.toThrow();
        });
        (0, globals_1.it)('should require monthly fee for paid membership model', () => {
            const paidData = {
                membershipModel: 'paid',
                monthlyFee: 999, // cents
                membershipCount: 50,
                growthData: [],
                guidelines: '<p>Guidelines</p>',
            };
            (0, globals_1.expect)(() => hostProfile_1.CommunityDataSchema.parse(paidData)).not.toThrow();
        });
    });
    (0, globals_1.describe)('VenueDataSchema', () => {
        (0, globals_1.it)('should validate valid venue data', () => {
            const validData = {
                capacity: {
                    seated: 100,
                    standing: 200,
                    fireSafetyMax: 250,
                },
                technicalRider: {
                    documentUrl: 'https://example.com/rider.pdf',
                    parsedSpecs: {
                        stageDimensions: '10m x 8m',
                        powerCapacity: '100A',
                    },
                },
                openingHours: {
                    monday: { open: '09:00', close: '17:00' },
                    tuesday: { open: '09:00', close: '17:00' },
                },
                exceptionDates: [],
                parking: {
                    available: true,
                    capacity: 50,
                    cost: '$5/hour',
                },
                evCharging: true,
                publicTransport: {
                    nearestStation: 'Central Station',
                    walkingDistance: '5 minutes',
                },
                accessibility: {
                    wheelchairAccess: true,
                    accessibleParking: true,
                    accessibleToilets: true,
                    hearingLoop: false,
                    brailleSignage: false,
                    serviceAnimalFriendly: true,
                },
                accessibilityScore: 75,
            };
            (0, globals_1.expect)(() => hostProfile_1.VenueDataSchema.parse(validData)).not.toThrow();
        });
    });
    (0, globals_1.describe)('ArtistDataSchema', () => {
        (0, globals_1.it)('should validate valid artist data with minimum portfolio items', () => {
            const validData = {
                portfolio: [
                    { type: 'image', url: 'https://example.com/1.jpg', order: 0 },
                    { type: 'image', url: 'https://example.com/2.jpg', order: 1 },
                    { type: 'video', url: 'https://youtube.com/watch?v=123', order: 2 },
                ],
                genres: ['Contemporary', 'Abstract'],
                availabilityCalendar: [],
                bookingLeadTime: 14,
            };
            (0, globals_1.expect)(() => hostProfile_1.ArtistDataSchema.parse(validData)).not.toThrow();
        });
        (0, globals_1.it)('should reject artist data with less than 3 portfolio items', () => {
            const invalidData = {
                portfolio: [
                    { type: 'image', url: 'https://example.com/1.jpg', order: 0 },
                    { type: 'image', url: 'https://example.com/2.jpg', order: 1 },
                ],
                genres: ['Contemporary'],
                availabilityCalendar: [],
                bookingLeadTime: 14,
            };
            (0, globals_1.expect)(() => hostProfile_1.ArtistDataSchema.parse(invalidData)).toThrow();
        });
    });
    (0, globals_1.describe)('ProfessionalDataSchema', () => {
        (0, globals_1.it)('should validate valid professional data', () => {
            const validData = {
                credentials: ['https://example.com/cert1.pdf', 'https://example.com/cert2.pdf'],
                credentialsVerified: false,
                expertiseAreas: ['Marketing', 'Social Media', 'Content Strategy'],
                availabilityStatus: 'available',
                rateCard: [
                    { type: 'hourly', rate: 150, description: 'Hourly consulting' },
                    { type: 'project-based', rate: 5000, description: 'Full campaign' },
                ],
                currency: 'AUD',
                responseTime: '24-hours',
            };
            (0, globals_1.expect)(() => hostProfile_1.ProfessionalDataSchema.parse(validData)).not.toThrow();
        });
        (0, globals_1.it)('should validate influencer licence when provided', () => {
            const dataWithInfluencer = {
                credentials: ['https://example.com/cert.pdf'],
                credentialsVerified: true,
                influencerLicence: {
                    platform: 'Instagram',
                    handle: '@example',
                    followerCount: 50000,
                    verified: true,
                },
                expertiseAreas: ['Influencer Marketing'],
                availabilityStatus: 'available',
                rateCard: [{ type: 'sponsorship', rate: 2000 }],
                currency: 'AUD',
                responseTime: '24-hours',
            };
            (0, globals_1.expect)(() => hostProfile_1.ProfessionalDataSchema.parse(dataWithInfluencer)).not.toThrow();
        });
    });
    (0, globals_1.describe)('HostProfileSchema', () => {
        (0, globals_1.it)('should validate a complete profile', () => {
            const validProfile = {
                id: 'profile-123',
                entityType: 'community',
                ownerId: 'user-456',
                handle: 'test-community',
                officialName: 'Test Community',
                foundingDate: '2020-01-01',
                logoUrl: 'https://example.com/logo.png',
                heroImageUrl: 'https://example.com/hero.jpg',
                galleryImages: [],
                publicEmail: 'contact@example.com',
                emailVerified: false,
                phoneNumber: '+61400000000',
                phoneVerified: false,
                socialLinks: [],
                primaryContactMethod: 'email',
                primaryAddress: {
                    street: '123 Test St',
                    city: 'Sydney',
                    state: 'NSW',
                    postcode: '2000',
                    country: 'Australia',
                    latitude: -33.8688,
                    longitude: 151.2093,
                    isPrimary: true,
                },
                additionalLocations: [],
                isOnlineOnly: false,
                tagline: 'A test community for testing',
                description: '<p>This is a test community</p>',
                categoryTags: ['test', 'community', 'example'],
                metaDescription: 'A test community for testing purposes',
                gstRegistered: false,
                licences: [],
                verificationStatus: 'pending',
                communityData: {
                    membershipModel: 'free',
                    membershipCount: 0,
                    growthData: [],
                    guidelines: '<p>Be respectful</p>',
                },
                status: 'draft',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
                lastModifiedBy: 'user-456',
                viewCount: 0,
                uniqueVisitorCount: 0,
                contactClickCount: 0,
                searchAppearances: 0,
                engagementScore: 0,
            };
            (0, globals_1.expect)(() => hostProfile_1.HostProfileSchema.parse(validProfile)).not.toThrow();
        });
        (0, globals_1.it)('should enforce handle format validation', () => {
            const invalidHandles = [
                'AB', // too short
                'a'.repeat(31), // too long
                'Test_Community', // uppercase and underscore
                'test community', // space
                'test@community', // special char
            ];
            invalidHandles.forEach((handle) => {
                const profile = {
                    id: 'profile-123',
                    entityType: 'community',
                    ownerId: 'user-456',
                    handle,
                    officialName: 'Test',
                    foundingDate: '2020-01-01',
                    logoUrl: 'https://example.com/logo.png',
                    heroImageUrl: 'https://example.com/hero.jpg',
                    publicEmail: 'test@example.com',
                    phoneNumber: '+61400000000',
                    socialLinks: [],
                    primaryContactMethod: 'email',
                    primaryAddress: {
                        street: '123 Test St',
                        city: 'Sydney',
                        state: 'NSW',
                        postcode: '2000',
                        country: 'Australia',
                        latitude: -33.8688,
                        longitude: 151.2093,
                        isPrimary: true,
                    },
                    additionalLocations: [],
                    isOnlineOnly: false,
                    tagline: 'Test',
                    description: 'Test',
                    categoryTags: ['test', 'example', 'demo'],
                    metaDescription: 'Test',
                    gstRegistered: false,
                    licences: [],
                    verificationStatus: 'pending',
                    status: 'draft',
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                    lastModifiedBy: 'user-456',
                    viewCount: 0,
                    uniqueVisitorCount: 0,
                    contactClickCount: 0,
                    searchAppearances: 0,
                    engagementScore: 0,
                };
                (0, globals_1.expect)(() => hostProfile_1.HostProfileSchema.parse(profile)).toThrow();
            });
        });
        (0, globals_1.it)('should enforce category tags min/max constraints', () => {
            const baseProfile = {
                id: 'profile-123',
                entityType: 'community',
                ownerId: 'user-456',
                handle: 'test-community',
                officialName: 'Test',
                foundingDate: '2020-01-01',
                logoUrl: 'https://example.com/logo.png',
                heroImageUrl: 'https://example.com/hero.jpg',
                publicEmail: 'test@example.com',
                phoneNumber: '+61400000000',
                socialLinks: [],
                primaryContactMethod: 'email',
                primaryAddress: {
                    street: '123 Test St',
                    city: 'Sydney',
                    state: 'NSW',
                    postcode: '2000',
                    country: 'Australia',
                    latitude: -33.8688,
                    longitude: 151.2093,
                    isPrimary: true,
                },
                additionalLocations: [],
                isOnlineOnly: false,
                tagline: 'Test',
                description: 'Test',
                metaDescription: 'Test',
                gstRegistered: false,
                licences: [],
                verificationStatus: 'pending',
                status: 'draft',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
                lastModifiedBy: 'user-456',
                viewCount: 0,
                uniqueVisitorCount: 0,
                contactClickCount: 0,
                searchAppearances: 0,
                engagementScore: 0,
            };
            // Too few tags (less than 3)
            (0, globals_1.expect)(() => hostProfile_1.HostProfileSchema.parse({ ...baseProfile, categoryTags: ['tag1', 'tag2'] })).toThrow();
            // Too many tags (more than 10)
            (0, globals_1.expect)(() => hostProfile_1.HostProfileSchema.parse({
                ...baseProfile,
                categoryTags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
            })).toThrow();
            // Valid number of tags
            (0, globals_1.expect)(() => hostProfile_1.HostProfileSchema.parse({
                ...baseProfile,
                categoryTags: ['tag1', 'tag2', 'tag3'],
            })).not.toThrow();
        });
    });
});
//# sourceMappingURL=hostProfile.test.js.map