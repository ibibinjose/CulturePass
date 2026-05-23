import { api } from '@/lib/api';

export function fetchHubEvents() {
  return api.events.list({ country: 'Australia', pageSize: 120 });
}

export function fetchHubCommunities() {
  return api.communities.list({ country: 'Australia' });
}

export function fetchHubUpdates() {
  return api.updates.list({ limit: 80 });
}
