import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Location } from '../../shared/schema/location';
import { locationService } from '../services/locations';

export async function getLocations(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { limit, offset, city, country, search } = event.queryStringParameters || {};
    
    const filters = {
      city: city || undefined,
      country: country || undefined,
      search: search || undefined,
    };

    const locations = await locationService.getAll({
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
      body: JSON.stringify(locations),
    };
  } catch (error) {
    console.error('Error fetching locations:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch locations' }),
    };
  }
}

export async function getLocationById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Location ID is required' }),
      };
    }

    const location = await locationService.getById(id);
    if (!location) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Location not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(location),
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch location' }),
    };
  }
}

export async function createLocation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const requestData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const locationData = Location.parse(requestData);

    const newLocation = await locationService.create(locationData);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(newLocation),
    };
  } catch (error) {
    console.error('Error creating location:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create location' }),
    };
  }
}

export async function updateLocation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Location ID is required' }),
      };
    }

    const requestData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const locationData = Location.parse(requestData);

    const updatedLocation = await locationService.update(id, locationData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(updatedLocation),
    };
  } catch (error) {
    console.error('Error updating location:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update location' }),
    };
  }
}

export async function deleteLocation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Location ID is required' }),
      };
    }

    await locationService.delete(id);

    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: '',
    };
  } catch (error) {
    console.error('Error deleting location:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete location' }),
    };
  }
}

export async function getLocationsByCity(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const city = event.pathParameters?.city;
    if (!city) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'City is required' }),
      };
    }

    const { limit, offset } = event.queryStringParameters || {};

    const locations = await locationService.getByCity(city, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(locations),
    };
  } catch (error) {
    console.error('Error fetching locations by city:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch locations by city' }),
    };
  }
}

export async function searchLocations(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { q, limit, offset } = event.queryStringParameters || {};
    
    if (!q) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Search query is required' }),
      };
    }

    const locations = await locationService.search(q, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(locations),
    };
  } catch (error) {
    console.error('Error searching locations:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to search locations' }),
    };
  }
}