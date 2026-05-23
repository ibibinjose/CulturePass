import {
  applyQuestEvent,
  computeBonusPoints,
  evaluateBadgeTier,
  eventMatchesQuest,
  nextBadgeMilestone,
  pickEventCultureTag,
  qualifiesForExplorerBonus,
  tagify,
} from './cultureExplorerRules';
import { BADGE_TIER_THRESHOLDS, CULTURE_EXPLORER_POINT_MULTIPLIER } from '../../../shared/schema';

describe('cultureExplorerRules', () => {
  describe('tagify', () => {
    it('lowercases and trims', () => {
      expect(tagify(' Diwali ')).toBe('diwali');
    });
    it('handles null/undefined', () => {
      expect(tagify(null)).toBe('');
      expect(tagify(undefined)).toBe('');
    });
  });

  describe('pickEventCultureTag', () => {
    it('returns first cultureTag entry, lowercased', () => {
      expect(pickEventCultureTag({ cultureTag: ['Malayali', 'tamil'] })).toBe('malayali');
    });
    it('falls back to cultureTags when cultureTag is missing', () => {
      expect(pickEventCultureTag({ cultureTags: ['Diwali'] })).toBe('diwali');
    });
    it('returns null when both arrays are empty', () => {
      expect(pickEventCultureTag({ cultureTag: [], cultureTags: [] })).toBeNull();
    });
    it('returns null when no tags present', () => {
      expect(pickEventCultureTag({})).toBeNull();
    });
  });

  describe('qualifiesForExplorerBonus', () => {
    it('qualifies when tag is in exploring and not in roots', () => {
      expect(qualifiesForExplorerBonus('korean', ['korean'], ['malayali'])).toBe(true);
    });

    it('does NOT qualify when tag is also a root culture (avoid double-bonus)', () => {
      expect(qualifiesForExplorerBonus('malayali', ['malayali'], ['malayali'])).toBe(false);
    });

    it('does NOT qualify when tag is not in exploring', () => {
      expect(qualifiesForExplorerBonus('korean', ['japanese'], ['malayali'])).toBe(false);
    });

    it('does NOT qualify when eventCultureTag is null', () => {
      expect(qualifiesForExplorerBonus(null, ['korean'], [])).toBe(false);
    });

    it('is case-insensitive on all sides', () => {
      expect(qualifiesForExplorerBonus('Korean', ['korean'], ['MALAYALI'])).toBe(true);
    });

    it('handles undefined exploring/roots safely', () => {
      expect(qualifiesForExplorerBonus('korean', undefined, undefined)).toBe(false);
    });
  });

  describe('computeBonusPoints', () => {
    it('returns the multiplier delta, not the total', () => {
      // $50 ticket -> base 50 pts -> total 100 pts (2x) -> bonus 50
      expect(computeBonusPoints(5000)).toBe(50 * (CULTURE_EXPLORER_POINT_MULTIPLIER - 1));
    });

    it('returns 0 for free tickets', () => {
      expect(computeBonusPoints(0)).toBe(0);
    });

    it('returns 0 for sub-dollar amounts', () => {
      expect(computeBonusPoints(50)).toBe(0); // floor($0.50) = 0
    });

    it('returns 0 for negative or invalid amounts', () => {
      expect(computeBonusPoints(-100)).toBe(0);
      expect(computeBonusPoints(NaN)).toBe(0);
    });
  });

  describe('evaluateBadgeTier', () => {
    it('returns "none" for 0 events', () => {
      expect(evaluateBadgeTier(0)).toBe('none');
    });

    it('crosses each threshold exactly', () => {
      expect(evaluateBadgeTier(BADGE_TIER_THRESHOLDS.explorer)).toBe('explorer');
      expect(evaluateBadgeTier(BADGE_TIER_THRESHOLDS.insider)).toBe('insider');
      expect(evaluateBadgeTier(BADGE_TIER_THRESHOLDS.local)).toBe('local');
      expect(evaluateBadgeTier(BADGE_TIER_THRESHOLDS.champion)).toBe('champion');
    });

    it('stays at champion above the top threshold', () => {
      expect(evaluateBadgeTier(BADGE_TIER_THRESHOLDS.champion + 50)).toBe('champion');
    });

    it('stays at the lower tier just below a boundary', () => {
      expect(evaluateBadgeTier(BADGE_TIER_THRESHOLDS.insider - 1)).toBe('explorer');
      expect(evaluateBadgeTier(BADGE_TIER_THRESHOLDS.local - 1)).toBe('insider');
    });
  });

  describe('nextBadgeMilestone', () => {
    it('points to the explorer milestone when at 0 events', () => {
      const next = nextBadgeMilestone(0);
      expect(next).toEqual({ at: BADGE_TIER_THRESHOLDS.explorer, label: 'explorer' });
    });

    it('points to insider after the first event', () => {
      const next = nextBadgeMilestone(1);
      expect(next?.label).toBe('insider');
    });

    it('returns null when the user has reached champion', () => {
      expect(nextBadgeMilestone(BADGE_TIER_THRESHOLDS.champion)).toBeNull();
      expect(nextBadgeMilestone(BADGE_TIER_THRESHOLDS.champion + 1)).toBeNull();
    });
  });

  describe('eventMatchesQuest', () => {
    const baseQuest = {
      cultureTag: 'lunar-new-year',
      city: 'Sydney',
      country: 'Australia',
    };

    it('matches when tag, city and country all match', () => {
      const event = { cultureTag: ['lunar-new-year'], city: 'Sydney', country: 'Australia' };
      expect(eventMatchesQuest(baseQuest, event)).toBe(true);
    });

    it('rejects when culture tag does not match', () => {
      const event = { cultureTag: ['diwali'], city: 'Sydney', country: 'Australia' };
      expect(eventMatchesQuest(baseQuest, event)).toBe(false);
    });

    it('rejects when city scope does not match', () => {
      const event = { cultureTag: ['lunar-new-year'], city: 'Melbourne', country: 'Australia' };
      expect(eventMatchesQuest(baseQuest, event)).toBe(false);
    });

    it('rejects when country scope does not match', () => {
      const event = { cultureTag: ['lunar-new-year'], city: 'Sydney', country: 'NZ' };
      expect(eventMatchesQuest(baseQuest, event)).toBe(false);
    });

    it('matches a global quest (no city/country) regardless of event location', () => {
      const globalQuest = { cultureTag: 'lunar-new-year' };
      const event = { cultureTag: ['lunar-new-year'], city: 'Auckland', country: 'NZ' };
      expect(eventMatchesQuest(globalQuest, event)).toBe(true);
    });

    it('is case-insensitive', () => {
      const event = { cultureTag: ['Lunar-New-Year'], city: 'sydney', country: 'australia' };
      expect(eventMatchesQuest(baseQuest, event)).toBe(true);
    });
  });

  describe('applyQuestEvent', () => {
    const quest = { targetCount: 3 };
    const now = '2026-05-07T00:00:00.000Z';

    it('appends event id and increments count', () => {
      const out = applyQuestEvent(
        { eventsAttended: ['e1'], count: 1 },
        'e2',
        quest,
        now,
      );
      expect(out).not.toBeNull();
      expect(out!.eventsAttended).toEqual(['e1', 'e2']);
      expect(out!.count).toBe(2);
      expect(out!.justCompleted).toBe(false);
      expect(out!.completedAt).toBeNull();
    });

    it('returns null on duplicate event id (idempotency)', () => {
      const out = applyQuestEvent(
        { eventsAttended: ['e1', 'e2'], count: 2 },
        'e1',
        quest,
        now,
      );
      expect(out).toBeNull();
    });

    it('marks justCompleted exactly once at the threshold', () => {
      const first = applyQuestEvent(
        { eventsAttended: ['e1', 'e2'], count: 2 },
        'e3',
        quest,
        now,
      );
      expect(first).not.toBeNull();
      expect(first!.count).toBe(3);
      expect(first!.justCompleted).toBe(true);
      expect(first!.completedAt).toBe(now);

      // A subsequent (4th) event should advance count but NOT re-complete.
      const second = applyQuestEvent(
        {
          eventsAttended: first!.eventsAttended,
          count: first!.count,
          completedAt: first!.completedAt,
        },
        'e4',
        quest,
        '2026-05-08T00:00:00.000Z',
      );
      // The 4th event gets ignored here because count is already at target;
      // but the eventsAttended array continues to grow without raising count.
      expect(second).not.toBeNull();
      expect(second!.justCompleted).toBe(false);
      expect(second!.completedAt).toBe(now); // preserved from first completion
      expect(second!.count).toBe(3); // capped at targetCount
    });
  });
});
