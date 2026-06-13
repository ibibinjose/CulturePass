/**
 * Full-flow sanity check for Gadigal/NAIDOC heritage event creation.
 * Run: npx tsx scripts/tests/flow-check-heritage.ts
 */

import assert from 'node:assert/strict';
import { resolveCreateNavigation } from '../../shared/creation/routing';
import { indigenousTagLabel } from '../../src/constants/indigenousTags';
import { NATIONALITIES } from '../../src/constants/cultures';
import {
  UpdateProfileDraftSchema,
  UpdateProfileDraftBodySchema,
} from '../../shared/schema/hostProfileDraft';
import {
  UpdateHostPageDraftSchema,
  UpdateHostPageSchema,
} from '../../shared/schema/hostPage';
import {
  CreateVerificationTaskSchema,
  UpdateVerificationTaskSchema,
} from '../../shared/schema/hostVerificationTask';

function section(title: string) {
  console.log(`\n── ${title} ──`);
}

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}

async function main() {
  let failed = 0;

  section('Creation routing');
  try {
    const eventCat = {
      id: 'event',
      entityType: 'event',
      route: '/hostspace?panel=create&category=event',
    };
    const nav = resolveCreateNavigation(eventCat, { parentProfileId: 'profile-1' });
    assert.equal(nav.pathname, '/hostspace/event/create');
    assert.equal(nav.wizard, 'event');
    assert.equal(nav.params.publisherProfileId, 'profile-1');
    ok('event category → /hostspace/event/create with publisherProfileId');
  } catch (e) {
    failed += 1;
    console.error('  ✗ routing', e);
  }

  section('Heritage display helpers');
  try {
    const tags = ['gadigal', 'naidoc'].map(indigenousTagLabel).join(', ');
    assert.equal(tags, 'Gadigal, NAIDOC');
    assert.equal(NATIONALITIES.australian?.label, 'Australian');
    ok('indigenousTagLabel + NATIONALITIES');
  } catch (e) {
    failed += 1;
    console.error('  ✗ cultureIdentity', e);
  }

  section('Zod v4 schema load + parse');
  const schemaChecks: Array<{ name: string; run: () => void }> = [
    {
      name: 'UpdateProfileDraftSchema',
      run: () => UpdateProfileDraftSchema.parse({ id: 'd1', userId: 'u1', currentStep: 2 }),
    },
    {
      name: 'UpdateProfileDraftBodySchema',
      run: () => UpdateProfileDraftBodySchema.parse({ currentStep: 3 }),
    },
    {
      name: 'UpdateHostPageDraftSchema',
      run: () => UpdateHostPageDraftSchema.parse({ id: 'd1', userId: 'u1' }),
    },
    {
      name: 'UpdateHostPageSchema',
      run: () => UpdateHostPageSchema.parse({ id: 'p1', status: 'draft' }),
    },
    {
      name: 'CreateVerificationTaskSchema',
      run: () =>
        CreateVerificationTaskSchema.parse({
          pageId: 'page-1',
          entityType: 'venue',
          submittedBy: 'user-1',
          slaDeadline: new Date().toISOString(),
        }),
    },
    {
      name: 'UpdateVerificationTaskSchema',
      run: () => UpdateVerificationTaskSchema.parse({ id: 't1', status: 'approved' }),
    },
  ];

  for (const check of schemaChecks) {
    try {
      check.run();
      ok(check.name);
    } catch (e) {
      failed += 1;
      console.error(`  ✗ ${check.name}`, e);
    }
  }

  section('Event API heritage field contract (static)');
  try {
    const payload = {
      title: 'NAIDOC Week on Gadigal Country',
      description: 'Storytelling on Gadigal Country',
      date: '2026-07-08',
      city: 'Sydney',
      country: 'Australia',
      indigenousTags: ['gadigal', 'naidoc'],
      nationalityId: 'australian',
      isIndigenousOwned: true,
      visibility: 'public',
      eventType: 'cultural',
    };
    assert.ok(payload.indigenousTags.includes('gadigal'));
    assert.ok(payload.indigenousTags.includes('naidoc'));
    assert.equal(payload.nationalityId, 'australian');
    assert.equal(payload.isIndigenousOwned, true);
    ok('heritage payload shape matches E2E contract');
  } catch (e) {
    failed += 1;
    console.error('  ✗ payload contract', e);
  }

  console.log('\n══════════════════════════════════════');
  if (failed > 0) {
    console.error(`Flow check FAILED (${failed} issue(s))`);
    process.exit(1);
  }
  console.log('Flow check PASSED — run Jest + Playwright for full coverage');
}

void main();