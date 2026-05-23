import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ActivityData as Activity } from '../../../shared/schema/activity';
import { activitiesService } from '../services/activities';

export async function getAllActivities(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { limit, offset, city, country, search } = event.queryStringParameters || {};
    
    // Use list method instead of getAll - this matches the actual service API
    const activities = await activitiesService.list({
      city,
      category: search, // Using search as category filter for simplicity
    });
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({
        items: activities,
        total: activities.length,
        page: 1,
        pageSize: activities.length,
        hasNextPage: false
      }),
    };
  } catch (error: any) {
    console.error('Activities Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch activities', details: error.message }),
    };
  }
}

export async function getActivities(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return getAllActivities(event);
}

export async function getActivityById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { id } = event.pathParameters || {};
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Activity ID is required' }),
      };
    }

    const activity = await activitiesService.getById(id);
    if (!activity) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Activity not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(activity),
    };
  } catch (err) {
    console.error('Error fetching activity:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch activity' }),
    };
  }
}

export async function createActivity(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const activityData = JSON.parse(event.body || '{}');
    const newActivity = await activitiesService.create(activityData);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(newActivity),
    };
  } catch (err) {
    console.error('Error creating activity:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create activity' }),
    };
  }
}

export async function updateActivity(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { id } = event.pathParameters || {};
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Activity ID is required' }),
      };
    }

    const activityData = JSON.parse(event.body || '{}');
    const updatedActivity = await activitiesService.update(id, activityData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(updatedActivity),
    };
  } catch (err) {
    console.error('Error updating activity:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update activity' }),
    };
  }
}

export async function deleteActivity(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { id } = event.pathParameters || {};
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Activity ID is required' }),
      };
    }

    await activitiesService.delete(id);

    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: '',
    };
  } catch (err) {
    console.error('Error deleting activity:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete activity' }),
    };
  }
}