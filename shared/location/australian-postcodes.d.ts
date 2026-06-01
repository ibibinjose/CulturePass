export interface PostcodeData {
    postcode: number;
    place_name: string;
    state_name: string;
    state_code: string;
    latitude: number;
    longitude: number;
    accuracy: number;
}
export declare const australianPostcodes: PostcodeData[];
export declare function getPostcodesByState(stateCode: string): PostcodeData[];
export declare function getPostcodeData(postcode: number): PostcodeData | undefined;
export declare function getPostcodesByPlace(placeName: string): PostcodeData[];
export declare function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
export declare function findNearestPostcodes(latitude: number, longitude: number, count?: number): PostcodeData[];
export declare function filterByProximity<T extends {
    latitude: number;
    longitude: number;
}>(items: T[], userLatitude: number, userLongitude: number, radiusKm?: number): T[];
//# sourceMappingURL=australian-postcodes.d.ts.map