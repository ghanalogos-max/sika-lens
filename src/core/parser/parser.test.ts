import { fixtures } from './fixtures';
import { detectNetwork, parseMomoSms } from './index';

describe('parseMomoSms fixtures', () => {
  it.each(fixtures)('$name', ({ sms, expected }) => {
    const result = parseMomoSms(sms);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject(expected);
    // Telecel/AirtelTigo rules are still guesses, so they must ask the user to double-check.
    if (expected.network === 'telecel' || expected.network === 'airteltigo') {
      expect(result.value.confidence).toBeLessThanOrEqual(0.75);
    } else {
      expect(result.value.confidence).toBeGreaterThanOrEqual(0.8);
    }
    expect(result.value.raw).toBe(sms);
  });
});

describe('parseMomoSms edge cases', () => {
  it('rejects empty input', () => {
    expect(parseMomoSms('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects text with no amount', () => {
    expect(parseMomoSms('Hello, how are you?')).toEqual({ ok: false, reason: 'no_amount' });
  });

  it('handles messages split over several lines', () => {
    const r = parseMomoSms('You have received GHS 5.00\nfrom KWESI.\nTransaction ID: 11112222');
    expect(r.ok && r.value.amount).toBe(500);
    expect(r.ok && r.value.counterparty).toBe('KWESI');
  });

  it('accepts the ₵ symbol and thousands separators', () => {
    const r = parseMomoSms('MoMo: Payment made for GH₵1,200.50 to ECG PREPAID. Transaction ID: 55556666');
    expect(r.ok && r.value.amount).toBe(120050);
    expect(r.ok && r.value.type).toBe('bill');
  });

  it('adds a tax written without a currency prefix to the fee', () => {
    const r = parseMomoSms('Payment for GHS10.00 to KOFI. Fee charged: GHS0.50,Tax Charged 0.25. Transaction Id: 12345678');
    expect(r.ok && r.value.fee).toBe(75);
  });

  it('does not double count a fee that has a currency prefix', () => {
    const r = parseMomoSms('Payment for GHS10.00 to KOFI. Fee charged: GHS0.50. Tax Charged: GHS0.25. Transaction Id: 12345678');
    expect(r.ok && r.value.fee).toBe(75);
  });

  it('stops a name at a full stop glued to the next word', () => {
    const r = parseMomoSms('Payment for GHS3.00 to ABENA OSEI.Current Balance: GHS 1.00. Transaction Id: 12345678');
    expect(r.ok && r.value.counterparty).toBe('ABENA OSEI');
  });

  it('refuses two messages pasted together instead of mixing them up', () => {
    const both = fixtures.filter((f) => f.name.startsWith('REAL MTN cash out') || f.name.startsWith('REAL MTN payment received'));
    expect(both).toHaveLength(2);
    expect(parseMomoSms(both[0].sms + ' ' + both[1].sms)).toEqual({ ok: false, reason: 'multiple_messages' });
  });

  it('gives low confidence to vague messages so the UI asks the user to confirm', () => {
    const r = parseMomoSms('Transfer of GHS 5.00 done');
    expect(r.ok && r.value.confidence).toBeLessThan(0.8);
    expect(r.ok && r.value.network).toBe('unknown');
  });

  it('is deterministic for re-pasted messages (same reference both times)', () => {
    const a = parseMomoSms(fixtures[0].sms);
    const b = parseMomoSms(fixtures[0].sms);
    expect(a).toEqual(b);
  });
});

describe('detectNetwork', () => {
  it('prefers the specific network over the generic momo hint', () => {
    expect(detectNetwork('Telecel Cash MoMo transfer')).toBe('telecel');
  });
  it('returns unknown when nothing matches', () => {
    expect(detectNetwork('GHS 5.00 sent')).toBe('unknown');
  });
});
