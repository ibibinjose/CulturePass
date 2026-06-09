import { TICKET_PRINT } from '../ticketPrintTokens';

describe('ticketPrintTokens', () => {
  it('defines the fixed light print palette', () => {
    expect(TICKET_PRINT.text).toMatch(/^#/);
    expect(TICKET_PRINT.textSecondary).toMatch(/^#/);
    expect(TICKET_PRINT.textInverse).toMatch(/^#/);
    expect(TICKET_PRINT.pageBg).toMatch(/^#/);
    expect(TICKET_PRINT.surface).toMatch(/^#/);
    expect(TICKET_PRINT.primary).toBeTruthy();
  });
});