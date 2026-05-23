import assert from 'node:assert/strict';
import { isReservedHandle, RESERVED_HANDLES_LIST } from '../../shared/constants/reservedHandles';
import { isReservedHandle as clientIsReserved } from '../../src/modules/host/schemas/validationRules';

// Client re-export must match shared canonical list
assert.equal(clientIsReserved('admin'), true);
assert.equal(clientIsReserved('marketplace'), true);
assert.equal(clientIsReserved('culture-pass'), true);

// Functions import path (same module)
assert.equal(isReservedHandle('superuser'), true);
assert.equal(isReservedHandle('localhost'), true);
assert.equal(isReservedHandle('my-community'), false);

assert.ok(RESERVED_HANDLES_LIST.length >= 40, 'expected merged reserved handle list');

console.log('reserved handles parity checks passed');
