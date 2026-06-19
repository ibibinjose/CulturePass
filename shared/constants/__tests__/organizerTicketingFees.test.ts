import {
  buildOrganizerTicketingFees,
  formatOrganizerFeePercent,
  PREMIUM_ORGANIZER_FEE_BPS_OFFSET,
} from '../organizerTicketingFees';

describe('organizerTicketingFees', () => {
  it('formats whole and fractional percents', () => {
    expect(formatOrganizerFeePercent(1000)).toBe('10%');
    expect(formatOrganizerFeePercent(750)).toBe('7.5%');
    expect(formatOrganizerFeePercent(250)).toBe('2.5%');
  });

  it('maps Standard to Connect bps and Premium to discounted bps', () => {
    const fees = buildOrganizerTicketingFees({
      connectPlatformFeeBps: 1000,
      currency: 'AUD',
      market: 'AU',
    });
    expect(fees.standard.percentBps).toBe(1000);
    expect(fees.standard.priceLine).toBe('10%');
    expect(fees.premium.percentBps).toBe(1000 - PREMIUM_ORGANIZER_FEE_BPS_OFFSET);
    expect(fees.premium.priceLine).toBe('7.5%');
  });

  it('never returns negative premium bps', () => {
    const fees = buildOrganizerTicketingFees({
      connectPlatformFeeBps: 200,
      currency: 'AUD',
      market: 'AU',
    });
    expect(fees.premium.percentBps).toBe(0);
    expect(fees.premium.priceLine).toBe('0%');
  });
});