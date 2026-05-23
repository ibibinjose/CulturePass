import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Activity } from '../../shared/schema/activity';
import { activityService } from '../services/activities';

export async function getActivities(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const activities = await activityService.getAll();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(activities),
    };
  } catch (err) {
    console.error('Error fetching activities:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch activities' }),
    };
  }
}

export async function getActivityById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Activity ID is required' }),
      };
    }

    const activity = await activityService.getById(id);
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
    const requestData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const activityData = Activity.parse(requestData);

    const newActivity = await activityService.create(activityData);

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
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Activity ID is required' }),
      };
    }

    const requestData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const activityData = Activity.parse(requestData);

    const updatedActivity = await activityService.update(id, activityData);

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
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Activity ID is required' }),
      };
    }

    await activityService.delete(id);

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