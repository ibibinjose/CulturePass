import { ContentStatus } from './common';

export interface MovieData {
  id: string;
  title: string;
  originalTitle?: string;
  description: string;
  language: string;
  duration: string; // e.g. "2h 15m"
  rating: string;   // e.g. "PG-13"
  posterUrl: string;
  backdropUrl?: string;
  trailerUrl?: string;
  imdbScore: number;
  releaseDate: string;
  genre: string[];
  cast: string[];
  director: string;
  showtimes: MovieShowtime[];
  isPromoted: boolean;
  city: string;
  country: string;
  ownerId?: string;
  status: ContentStatus;
  culturePassId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MovieShowtime {
  id: string;
  venueId?: string;
  venueName: string;
  date: string;
  time: string;
  price: number;
  bookingUrl?: string;
}

export interface MovieInput extends Omit<MovieData, 'id' | 'createdAt' | 'updatedAt' | 'status'> {
  status?: ContentStatus;
}
