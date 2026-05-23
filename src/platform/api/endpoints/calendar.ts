import type { ApiRequestFn } from '../client';

export interface CalendarDot {
  date: string;
  style: 'solid' | 'outlined';
  eventId: string;
  cultureTag?: string;
}

export interface CalendarDotsResponse {
  dots: CalendarDot[];
  month: number;
  year: number;
}

export interface CalendarSubscribeResponse {
  webcalUrl: string;
  city: string;
}

export function createCalendarFlowNamespace(request: ApiRequestFn) {
  return {
    /** Calendar dot data for a given month/year */
    dots: (month: number, year: number) =>
      request<CalendarDotsResponse>(
        'GET',
        `api/calendar/dots?month=${month}&year=${year}`,
      ),

    /** Generate webcal:// subscription URL for a city */
    subscribe: (city: string) =>
      request<CalendarSubscribeResponse>(
        'GET',
        `api/calendar/subscribe?city=${encodeURIComponent(city)}`,
      ),
  };
}
