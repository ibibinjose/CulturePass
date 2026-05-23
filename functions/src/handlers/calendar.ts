import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CalendarEvent } from '../../shared/schema/calendar';
import { eventsService } from '../services/events';
import { db } from '../admin';
import { type FirestoreEvent } from '../services/events';

// Simple calendar service implementation for user events
const calendarService = {
  getUserEvents: async (userId: string, options?: { limit?: number; offset?: number; filters?: any }) => {
    // This is a simplified implementation - in a real app you'd have proper calendar service
    // For now, we'll return events related to the user (attending, created, etc.)
    const { limit, offset, filters } = options || {};
    
    // In a real implementation, this would query user's calendar events
    // For now, we'll return an empty list to allow compilation
    return {
      items: [] as any[],
      total: 0,
      hasMore: false,
    };
  }
};

export async function getCalendarEvents(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { userId, startDate, endDate, limit, offset } = event.queryStringParameters || {};
    
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const calendarEvents = await calendarService.getUserEvents(userId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      filters,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(calendarEvents),
    };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch calendar events' }),
    };
  }
}

export async function getCalendarEventById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const eventId = event.pathParameters?.eventId;
    const userId = event.queryStringParameters?.userId;

    if (!eventId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Event ID is required' }),
      };
    }

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    const calendarEvent = await calendarService.getEventById(eventId, userId);
    if (!calendarEvent) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Calendar event not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(calendarEvent),
    };
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch calendar event' }),
    };
  }
}

export async function createCalendarEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const requestData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const calendarEventData = CalendarEvent.parse(requestData);

    // Verify user owns the event they're adding to calendar
    const userEvent = await calendarService.verifyUserEvent(
      calendarEventData.eventId,
      calendarEventData.userId
    );

    if (!userEvent) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'User does not have permission to add this event to calendar' }),
      };
    }

    const newCalendarEvent = await calendarService.create(calendarEventData);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(newCalendarEvent),
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create calendar event' }),
    };
  }
}

export async function updateCalendarEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const eventId = event.pathParameters?.eventId;
    const userId = event.queryStringParameters?.userId;

    if (!eventId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Event ID is required' }),
      };
    }

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    const requestData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const calendarEventData = CalendarEvent.parse(requestData);

    // Ensure the user can only update their own calendar events
    if (calendarEventData.userId !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Cannot update calendar event for another user' }),
      };
    }

    const updatedCalendarEvent = await calendarService.update(eventId, calendarEventData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(updatedCalendarEvent),
    };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update calendar event' }),
    };
  }
}

export async function deleteCalendarEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const eventId = event.pathParameters?.eventId;
    const userId = event.queryStringParameters?.userId;

    if (!eventId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Event ID is required' }),
      };
    }

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    await calendarService.delete(eventId, userId);

    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: '',
    };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete calendar event' }),
    };
  }
}

export async function getCalendarEventsByDateRange(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.queryStringParameters?.userId;
    const startDateParam = event.queryStringParameters?.startDate;
    const endDateParam = event.queryStringParameters?.endDate;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    if (!startDateParam || !endDateParam) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Start date and end date are required' }),
      };
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    const calendarEvents = await calendarService.getEventsByDateRange(userId, startDate, endDate);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(calendarEvents),
    };
  } catch (error) {
    console.error('Error fetching calendar events by date range:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch calendar events by date range' }),
    };
  }
}