import {
  resolvePricingMarket,
  DEFAULT_PRICING_MARKET,
} from '../../../shared/constants/pricingMarkets';
import {
  membershipPlanId,
  MEMBERSHIP_CATALOG_AMOUNTS,
} from '../../../shared/constants/pricingCatalog';
import { buildOrganizerTicketingFees } from '../../../shared/constants/organizerTicketingFees';
import {
  getPlatformPricingConfig,
  membershipPlanIdFromPeriod,
} from '../services/pricing';

describe('pricingMarkets', () => {
  it('resolves Australia to AU market', () => {
    expect(resolvePricingMarket('Australia').code).toBe('AU');
  });

  it('resolves United States to US market', () => {
    expect(resolvePricingMarket('United States').code).toBe('US');
  });

  it('falls back to default market for unknown country', () => {
    expect(resolvePricingMarket('Mars').code).toBe(DEFAULT_PRICING_MARKET);
  });
});

describe('pricingCatalog', () => {
  it('maps billing periods to plan ids', () => {
    expect(membershipPlanId('monthly')).toBe('culturepass_plus_monthly');
    expect(membershipPlanId('yearly')).toBe('culturepass_plus_yearly');
    expect(membershipPlanIdFromPeriod('yearly')).toBe('culturepass_plus_yearly');
  });

  it('has catalog amounts for all primary markets', () => {
    expect(MEMBERSHIP_CATALOG_AMOUNTS.AU.monthlyCents).toBeGreaterThan(0);
    expect(MEMBERSHIP_CATALOG_AMOUNTS.US.currency).toBe('USD');
    expect(MEMBERSHIP_CATALOG_AMOUNTS.GB.currency).toBe('GBP');
  });
});

describe('platform pricing config', () => {
  it('exposes connect fee bps', () => {
    const cfg = getPlatformPricingConfig();
    expect(cfg.connectPlatformFeeBps).toBeGreaterThanOrEqual(0);
    expect(cfg.supportedMarkets).toContain('AU');
  });

  it('derives organiser tiers from connect bps', () => {
    const cfg = getPlatformPricingConfig();
    const organizer = buildOrganizerTicketingFees({
      connectPlatformFeeBps: cfg.connectPlatformFeeBps,
      currency: 'AUD',
      market: 'AU',
    });
    expect(organizer.standard.percentBps).toBe(cfg.connectPlatformFeeBps);
    expect(organizer.premium.percentBps).toBeLessThanOrEqual(cfg.connectPlatformFeeBps);
    expect(organizer.standard.priceLine).toMatch(/%$/);
  });
});