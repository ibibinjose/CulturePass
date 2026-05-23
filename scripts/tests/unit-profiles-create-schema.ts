import assert from 'node:assert/strict';

import { createProfileSchema } from '../../functions/src/handlers/profiles';

const base = { name: 'Test Org', entityType: 'community' as const };

{
  const r = createProfileSchema.safeParse({ ...base, postcode: '' });
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.postcode, undefined);
}

{
  const r = createProfileSchema.safeParse({ ...base, latitude: '', longitude: '' });
  assert.equal(r.success, true);
  if (r.success) {
    assert.equal(r.data.latitude, undefined);
    assert.equal(r.data.longitude, undefined);
  }
}

{
  const r = createProfileSchema.safeParse({ ...base, postcode: 2000 });
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.postcode, 2000);
}

{
  const r = createProfileSchema.safeParse({ ...base, latitude: -33.86, longitude: 151.2 });
  assert.equal(r.success, true);
  if (r.success) {
    assert.equal(r.data.latitude, -33.86);
    assert.equal(r.data.longitude, 151.2);
  }
}

console.log('unit profiles createProfileSchema checks passed');
