import request from 'supertest';
import { app } from './src/app';
const draftPayload = {
  entityType: 'business',
  formData: { officialName: 'My Business', handle: 'my-business' },
  currentStep: 3,
  completedSteps: [1, 2],
  deviceInfo: { platform: 'web', userAgent: 'Mozilla/5.0' },
};
const res = await request(app).post('/api/profiles/profile-1/draft').set('Authorization','Bearer valid-token').send(draftPayload);
console.log('status', res.status, JSON.stringify(res.body));
