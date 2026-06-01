import { z } from 'zod';
export declare const SocialLinkSchema: z.ZodObject<{
    platform: z.ZodEnum<{
        facebook: "facebook";
        instagram: "instagram";
        twitter: "twitter";
        linkedin: "linkedin";
        tiktok: "tiktok";
        youtube: "youtube";
        website: "website";
        other: "other";
    }>;
    url: z.ZodString;
    verified: z.ZodDefault<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        image: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SocialLink = z.infer<typeof SocialLinkSchema>;
export declare const AddressSchema: z.ZodObject<{
    street: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    postcode: z.ZodString;
    country: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    lgaCode: z.ZodOptional<z.ZodString>;
    placeId: z.ZodOptional<z.ZodString>;
    isPrimary: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type Address = z.infer<typeof AddressSchema>;
export declare const LicenceSchema: z.ZodObject<{
    type: z.ZodString;
    number: z.ZodString;
    documentUrl: z.ZodString;
    expiryDate: z.ZodOptional<z.ZodString>;
    verified: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type Licence = z.infer<typeof LicenceSchema>;
export declare const GrowthDataPointSchema: z.ZodObject<{
    date: z.ZodString;
    memberCount: z.ZodNumber;
}, z.core.$strip>;
export declare const CommunityDataSchema: z.ZodObject<{
    membershipModel: z.ZodEnum<{
        free: "free";
        paid: "paid";
        "invite-only": "invite-only";
    }>;
    monthlyFee: z.ZodOptional<z.ZodNumber>;
    membershipCount: z.ZodDefault<z.ZodNumber>;
    growthData: z.ZodDefault<z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        memberCount: z.ZodNumber;
    }, z.core.$strip>>>;
    guidelines: z.ZodString;
    communityLogoUrl: z.ZodOptional<z.ZodString>;
    communityBannerUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CommunityData = z.infer<typeof CommunityDataSchema>;
export type GrowthDataPoint = z.infer<typeof GrowthDataPointSchema>;
export declare const PastEventSchema: z.ZodObject<{
    name: z.ZodString;
    date: z.ZodString;
    venue: z.ZodString;
    attendance: z.ZodNumber;
    culturePassEventId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const OrganiserDataSchema: z.ZodObject<{
    pastEvents: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        date: z.ZodString;
        venue: z.ZodString;
        attendance: z.ZodNumber;
        culturePassEventId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    insuranceCertificate: z.ZodOptional<z.ZodObject<{
        documentUrl: z.ZodString;
        expiryDate: z.ZodString;
        verified: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    producerCredentials: z.ZodDefault<z.ZodString>;
    credentialDocuments: z.ZodDefault<z.ZodArray<z.ZodString>>;
    eventsHostedCount: z.ZodDefault<z.ZodNumber>;
    totalAttendance: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type OrganiserData = z.infer<typeof OrganiserDataSchema>;
export type PastEvent = z.infer<typeof PastEventSchema>;
export declare const TechnicalSpecsSchema: z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodString>>;
export declare const TimeRangeSchema: z.ZodObject<{
    open: z.ZodString;
    close: z.ZodString;
}, z.core.$strip>;
export declare const RecurringScheduleSchema: z.ZodObject<{
    monday: z.ZodOptional<z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
    }, z.core.$strip>>;
    tuesday: z.ZodOptional<z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
    }, z.core.$strip>>;
    wednesday: z.ZodOptional<z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
    }, z.core.$strip>>;
    thursday: z.ZodOptional<z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
    }, z.core.$strip>>;
    friday: z.ZodOptional<z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
    }, z.core.$strip>>;
    saturday: z.ZodOptional<z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
    }, z.core.$strip>>;
    sunday: z.ZodOptional<z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ExceptionDateSchema: z.ZodObject<{
    date: z.ZodString;
    reason: z.ZodString;
    closed: z.ZodBoolean;
}, z.core.$strip>;
export declare const AccessibilityFeaturesSchema: z.ZodObject<{
    wheelchairAccess: z.ZodDefault<z.ZodBoolean>;
    accessibleParking: z.ZodDefault<z.ZodBoolean>;
    accessibleToilets: z.ZodDefault<z.ZodBoolean>;
    hearingLoop: z.ZodDefault<z.ZodBoolean>;
    brailleSignage: z.ZodDefault<z.ZodBoolean>;
    serviceAnimalFriendly: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const VenueDataSchema: z.ZodObject<{
    capacity: z.ZodObject<{
        seated: z.ZodNumber;
        standing: z.ZodNumber;
        fireSafetyMax: z.ZodNumber;
    }, z.core.$strip>;
    technicalRider: z.ZodObject<{
        documentUrl: z.ZodString;
        parsedSpecs: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodString>>>;
    }, z.core.$strip>;
    openingHours: z.ZodObject<{
        monday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
        tuesday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
        wednesday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
        thursday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
        friday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
        saturday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
        sunday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    exceptionDates: z.ZodDefault<z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        reason: z.ZodString;
        closed: z.ZodBoolean;
    }, z.core.$strip>>>;
    parking: z.ZodObject<{
        available: z.ZodBoolean;
        capacity: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    evCharging: z.ZodDefault<z.ZodBoolean>;
    publicTransport: z.ZodObject<{
        nearestStation: z.ZodString;
        walkingDistance: z.ZodString;
    }, z.core.$strip>;
    accessibility: z.ZodObject<{
        wheelchairAccess: z.ZodDefault<z.ZodBoolean>;
        accessibleParking: z.ZodDefault<z.ZodBoolean>;
        accessibleToilets: z.ZodDefault<z.ZodBoolean>;
        hearingLoop: z.ZodDefault<z.ZodBoolean>;
        brailleSignage: z.ZodDefault<z.ZodBoolean>;
        serviceAnimalFriendly: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
    accessibilityScore: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type VenueData = z.infer<typeof VenueDataSchema>;
export type TechnicalSpecs = z.infer<typeof TechnicalSpecsSchema>;
export type TimeRange = z.infer<typeof TimeRangeSchema>;
export type RecurringSchedule = z.infer<typeof RecurringScheduleSchema>;
export type ExceptionDate = z.infer<typeof ExceptionDateSchema>;
export type AccessibilityFeatures = z.infer<typeof AccessibilityFeaturesSchema>;
export declare const CatalogueItemSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    price: z.ZodNumber;
    imageUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const PaymentMethodSchema: z.ZodEnum<{
    cash: "cash";
    card: "card";
    "digital-wallet": "digital-wallet";
    "bank-transfer": "bank-transfer";
    crypto: "crypto";
}>;
export declare const BusinessDataSchema: z.ZodObject<{
    catalogue: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        price: z.ZodNumber;
        imageUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    priceRange: z.ZodEnum<{
        budget: "budget";
        moderate: "moderate";
        premium: "premium";
        luxury: "luxury";
    }>;
    paymentMethods: z.ZodArray<z.ZodEnum<{
        cash: "cash";
        card: "card";
        "digital-wallet": "digital-wallet";
        "bank-transfer": "bank-transfer";
        crypto: "crypto";
    }>>;
    businessHours: z.ZodObject<{
        monday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
        tuesday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
        wednesday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
        thursday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
        friday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
        saturday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
        sunday: z.ZodOptional<z.ZodObject<{
            open: z.ZodString;
            close: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    holidayCalendar: z.ZodDefault<z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        reason: z.ZodString;
        closed: z.ZodBoolean;
    }, z.core.$strip>>>;
    partners: z.ZodDefault<z.ZodArray<z.ZodString>>;
    category: z.ZodString;
}, z.core.$strip>;
export type BusinessData = z.infer<typeof BusinessDataSchema>;
export type CatalogueItem = z.infer<typeof CatalogueItemSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export declare const PortfolioItemSchema: z.ZodObject<{
    type: z.ZodEnum<{
        image: "image";
        video: "video";
    }>;
    url: z.ZodString;
    caption: z.ZodOptional<z.ZodString>;
    order: z.ZodNumber;
}, z.core.$strip>;
export declare const AvailabilityDateSchema: z.ZodObject<{
    date: z.ZodString;
    status: z.ZodEnum<{
        available: "available";
        booked: "booked";
        unavailable: "unavailable";
    }>;
}, z.core.$strip>;
export declare const ArtistDataSchema: z.ZodObject<{
    portfolio: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            image: "image";
            video: "video";
        }>;
        url: z.ZodString;
        caption: z.ZodOptional<z.ZodString>;
        order: z.ZodNumber;
    }, z.core.$strip>>;
    genres: z.ZodArray<z.ZodString>;
    representation: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        phone: z.ZodString;
    }, z.core.$strip>>;
    availabilityCalendar: z.ZodDefault<z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        status: z.ZodEnum<{
            available: "available";
            booked: "booked";
            unavailable: "unavailable";
        }>;
    }, z.core.$strip>>>;
    bookingLeadTime: z.ZodNumber;
}, z.core.$strip>;
export type ArtistData = z.infer<typeof ArtistDataSchema>;
export type PortfolioItem = z.infer<typeof PortfolioItemSchema>;
export type AvailabilityDate = z.infer<typeof AvailabilityDateSchema>;
export declare const RateCardTierSchema: z.ZodObject<{
    type: z.ZodEnum<{
        hourly: "hourly";
        "project-based": "project-based";
        sponsorship: "sponsorship";
    }>;
    rate: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ProfessionalDataSchema: z.ZodObject<{
    credentials: z.ZodDefault<z.ZodArray<z.ZodString>>;
    credentialsVerified: z.ZodDefault<z.ZodBoolean>;
    influencerLicence: z.ZodOptional<z.ZodObject<{
        platform: z.ZodString;
        handle: z.ZodString;
        followerCount: z.ZodNumber;
        verified: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    expertiseAreas: z.ZodArray<z.ZodString>;
    availabilityStatus: z.ZodEnum<{
        available: "available";
        "not-available": "not-available";
        "by-request": "by-request";
    }>;
    rateCard: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            hourly: "hourly";
            "project-based": "project-based";
            sponsorship: "sponsorship";
        }>;
        rate: z.ZodNumber;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    currency: z.ZodEnum<{
        AUD: "AUD";
        USD: "USD";
        GBP: "GBP";
        EUR: "EUR";
        NZD: "NZD";
        AED: "AED";
    }>;
    responseTime: z.ZodEnum<{
        "24-hours": "24-hours";
        "2-3-days": "2-3-days";
        "1-week": "1-week";
    }>;
}, z.core.$strip>;
export type ProfessionalData = z.infer<typeof ProfessionalDataSchema>;
export type RateCardTier = z.infer<typeof RateCardTierSchema>;
export declare const HostProfileSchema: z.ZodObject<{
    id: z.ZodString;
    entityType: z.ZodEnum<{
        venue: "venue";
        community: "community";
        organiser: "organiser";
        business: "business";
        artist: "artist";
        professional: "professional";
    }>;
    ownerId: z.ZodString;
    handle: z.ZodString;
    officialName: z.ZodString;
    tradingName: z.ZodOptional<z.ZodString>;
    foundingDate: z.ZodString;
    logoUrl: z.ZodString;
    heroImageUrl: z.ZodString;
    galleryImages: z.ZodDefault<z.ZodArray<z.ZodString>>;
    videoUrl: z.ZodOptional<z.ZodString>;
    publicEmail: z.ZodString;
    emailVerified: z.ZodDefault<z.ZodBoolean>;
    phoneNumber: z.ZodString;
    phoneVerified: z.ZodDefault<z.ZodBoolean>;
    whatsappNumber: z.ZodOptional<z.ZodString>;
    socialLinks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        platform: z.ZodEnum<{
            facebook: "facebook";
            instagram: "instagram";
            twitter: "twitter";
            linkedin: "linkedin";
            tiktok: "tiktok";
            youtube: "youtube";
            website: "website";
            other: "other";
        }>;
        url: z.ZodString;
        verified: z.ZodDefault<z.ZodBoolean>;
        metadata: z.ZodOptional<z.ZodObject<{
            title: z.ZodString;
            description: z.ZodString;
            image: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    primaryContactMethod: z.ZodEnum<{
        email: "email";
        phone: "phone";
        whatsapp: "whatsapp";
    }>;
    primaryAddress: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        postcode: z.ZodString;
        country: z.ZodString;
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        lgaCode: z.ZodOptional<z.ZodString>;
        placeId: z.ZodOptional<z.ZodString>;
        isPrimary: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
    additionalLocations: z.ZodDefault<z.ZodArray<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        postcode: z.ZodString;
        country: z.ZodString;
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        lgaCode: z.ZodOptional<z.ZodString>;
        placeId: z.ZodOptional<z.ZodString>;
        isPrimary: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    isOnlineOnly: z.ZodDefault<z.ZodBoolean>;
    lgaCode: z.ZodOptional<z.ZodString>;
    tagline: z.ZodString;
    description: z.ZodString;
    categoryTags: z.ZodArray<z.ZodString>;
    indigenousTags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    metaDescription: z.ZodString;
    abn: z.ZodOptional<z.ZodString>;
    acn: z.ZodOptional<z.ZodString>;
    gstRegistered: z.ZodDefault<z.ZodBoolean>;
    gstId: z.ZodOptional<z.ZodString>;
    licences: z.ZodDefault<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        number: z.ZodString;
        documentUrl: z.ZodString;
        expiryDate: z.ZodOptional<z.ZodString>;
        verified: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    verificationStatus: z.ZodDefault<z.ZodEnum<{
        verified: "verified";
        pending: "pending";
        rejected: "rejected";
    }>>;
    verificationNotes: z.ZodOptional<z.ZodString>;
    communityData: z.ZodOptional<z.ZodObject<{
        membershipModel: z.ZodEnum<{
            free: "free";
            paid: "paid";
            "invite-only": "invite-only";
        }>;
        monthlyFee: z.ZodOptional<z.ZodNumber>;
        membershipCount: z.ZodDefault<z.ZodNumber>;
        growthData: z.ZodDefault<z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            memberCount: z.ZodNumber;
        }, z.core.$strip>>>;
        guidelines: z.ZodString;
        communityLogoUrl: z.ZodOptional<z.ZodString>;
        communityBannerUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    organiserData: z.ZodOptional<z.ZodObject<{
        pastEvents: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            date: z.ZodString;
            venue: z.ZodString;
            attendance: z.ZodNumber;
            culturePassEventId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        insuranceCertificate: z.ZodOptional<z.ZodObject<{
            documentUrl: z.ZodString;
            expiryDate: z.ZodString;
            verified: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
        producerCredentials: z.ZodDefault<z.ZodString>;
        credentialDocuments: z.ZodDefault<z.ZodArray<z.ZodString>>;
        eventsHostedCount: z.ZodDefault<z.ZodNumber>;
        totalAttendance: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    venueData: z.ZodOptional<z.ZodObject<{
        capacity: z.ZodObject<{
            seated: z.ZodNumber;
            standing: z.ZodNumber;
            fireSafetyMax: z.ZodNumber;
        }, z.core.$strip>;
        technicalRider: z.ZodObject<{
            documentUrl: z.ZodString;
            parsedSpecs: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodString>>>;
        }, z.core.$strip>;
        openingHours: z.ZodObject<{
            monday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
            tuesday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
            wednesday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
            thursday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
            friday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
            saturday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
            sunday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        exceptionDates: z.ZodDefault<z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            reason: z.ZodString;
            closed: z.ZodBoolean;
        }, z.core.$strip>>>;
        parking: z.ZodObject<{
            available: z.ZodBoolean;
            capacity: z.ZodOptional<z.ZodNumber>;
            cost: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        evCharging: z.ZodDefault<z.ZodBoolean>;
        publicTransport: z.ZodObject<{
            nearestStation: z.ZodString;
            walkingDistance: z.ZodString;
        }, z.core.$strip>;
        accessibility: z.ZodObject<{
            wheelchairAccess: z.ZodDefault<z.ZodBoolean>;
            accessibleParking: z.ZodDefault<z.ZodBoolean>;
            accessibleToilets: z.ZodDefault<z.ZodBoolean>;
            hearingLoop: z.ZodDefault<z.ZodBoolean>;
            brailleSignage: z.ZodDefault<z.ZodBoolean>;
            serviceAnimalFriendly: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>;
        accessibilityScore: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    businessData: z.ZodOptional<z.ZodObject<{
        catalogue: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            price: z.ZodNumber;
            imageUrl: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        priceRange: z.ZodEnum<{
            budget: "budget";
            moderate: "moderate";
            premium: "premium";
            luxury: "luxury";
        }>;
        paymentMethods: z.ZodArray<z.ZodEnum<{
            cash: "cash";
            card: "card";
            "digital-wallet": "digital-wallet";
            "bank-transfer": "bank-transfer";
            crypto: "crypto";
        }>>;
        businessHours: z.ZodObject<{
            monday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
            tuesday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
            wednesday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
            thursday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
            friday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
            saturday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
            sunday: z.ZodOptional<z.ZodObject<{
                open: z.ZodString;
                close: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        holidayCalendar: z.ZodDefault<z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            reason: z.ZodString;
            closed: z.ZodBoolean;
        }, z.core.$strip>>>;
        partners: z.ZodDefault<z.ZodArray<z.ZodString>>;
        category: z.ZodString;
    }, z.core.$strip>>;
    artistData: z.ZodOptional<z.ZodObject<{
        portfolio: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<{
                image: "image";
                video: "video";
            }>;
            url: z.ZodString;
            caption: z.ZodOptional<z.ZodString>;
            order: z.ZodNumber;
        }, z.core.$strip>>;
        genres: z.ZodArray<z.ZodString>;
        representation: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            email: z.ZodString;
            phone: z.ZodString;
        }, z.core.$strip>>;
        availabilityCalendar: z.ZodDefault<z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            status: z.ZodEnum<{
                available: "available";
                booked: "booked";
                unavailable: "unavailable";
            }>;
        }, z.core.$strip>>>;
        bookingLeadTime: z.ZodNumber;
    }, z.core.$strip>>;
    professionalData: z.ZodOptional<z.ZodObject<{
        credentials: z.ZodDefault<z.ZodArray<z.ZodString>>;
        credentialsVerified: z.ZodDefault<z.ZodBoolean>;
        influencerLicence: z.ZodOptional<z.ZodObject<{
            platform: z.ZodString;
            handle: z.ZodString;
            followerCount: z.ZodNumber;
            verified: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
        expertiseAreas: z.ZodArray<z.ZodString>;
        availabilityStatus: z.ZodEnum<{
            available: "available";
            "not-available": "not-available";
            "by-request": "by-request";
        }>;
        rateCard: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<{
                hourly: "hourly";
                "project-based": "project-based";
                sponsorship: "sponsorship";
            }>;
            rate: z.ZodNumber;
            description: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        currency: z.ZodEnum<{
            AUD: "AUD";
            USD: "USD";
            GBP: "GBP";
            EUR: "EUR";
            NZD: "NZD";
            AED: "AED";
        }>;
        responseTime: z.ZodEnum<{
            "24-hours": "24-hours";
            "2-3-days": "2-3-days";
            "1-week": "1-week";
        }>;
    }, z.core.$strip>>;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        published: "published";
        pending_verification: "pending_verification";
        suspended: "suspended";
    }>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    publishedAt: z.ZodOptional<z.ZodString>;
    lastModifiedBy: z.ZodString;
    viewCount: z.ZodDefault<z.ZodNumber>;
    uniqueVisitorCount: z.ZodDefault<z.ZodNumber>;
    contactClickCount: z.ZodDefault<z.ZodNumber>;
    searchAppearances: z.ZodDefault<z.ZodNumber>;
    engagementScore: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type HostProfile = z.infer<typeof HostProfileSchema>;
export declare const HostProfileFormDataSchema: z.ZodAny;
export type HostProfileFormData = z.infer<typeof HostProfileFormDataSchema>;
//# sourceMappingURL=hostProfile.d.ts.map