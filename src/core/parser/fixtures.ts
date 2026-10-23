import type { ParsedSms } from './types';

/**
 * Most samples here are SYNTHETIC: written to look like typical mobile-money messages,
 * not copied from real networks. Entries marked REAL are real messages (transaction ID
 * altered). Add more real ones, anonymised, and the tests will show where the parser
 * needs tuning. Names and numbers in the synthetic ones are made up.
 */
export interface Fixture {
  name: string;
  sms: string;
  expected: Partial<ParsedSms>;
}

export const fixtures: Fixture[] = [
  {
    name: 'MTN send with fee and tax lines',
    sms: 'MTN MoMo: Payment made for GHS 25.00 to KOFI MENSAH. Current Balance: GHS 120.50. Available Balance: GHS 120.50. Reference: Lunch. Transaction ID: 31245678901. Fee charged: GHS 0.00. Tax charged: GHS 0.00. 2026-10-20 12:15:03',
    expected: {
      network: 'mtn', type: 'send', direction: 'out', amount: 2500, fee: 0, balanceAfter: 12050,
      counterparty: 'KOFI MENSAH', note: 'Lunch', externalRef: '31245678901', occurredAt: '2026-10-20T12:15:03.000Z',
    },
  },
  {
    name: 'MTN receive',
    sms: 'MTN MoMo: You have received GHS 100.00 from AMA SERWAA. Current Balance: GHS 220.50. Available Balance: GHS 220.50. Transaction ID: 31245678902. 2026-10-20 14:02:11',
    expected: {
      network: 'mtn', type: 'receive', direction: 'in', amount: 10000, fee: 0, balanceAfter: 22050,
      counterparty: 'AMA SERWAA', externalRef: '31245678902', occurredAt: '2026-10-20T14:02:11.000Z',
    },
  },
  {
    name: 'Cash out with fee and day-first date (no brand name, MTN recognised by its wording)',
    sms: 'Cash Out made for GHS 200.00 to AGENT KWAME ASARE. Fee charged: GHS 2.00. Available Balance: GHS 18.50. Transaction ID: 31245678903. 20/10/2026 16:40',
    expected: {
      network: 'mtn', type: 'cash_out', direction: 'out', amount: 20000, fee: 200, balanceAfter: 1850,
      counterparty: 'AGENT KWAME ASARE', externalRef: '31245678903', occurredAt: '2026-10-20T16:40:00.000Z',
    },
  },
  {
    name: 'MTN airtime',
    sms: 'MTN MoMo: Airtime purchase of GHS 10.00 successful. Available Balance: GHS 90.00. Transaction ID: 31245678904.',
    expected: {
      network: 'mtn', type: 'airtime', direction: 'out', amount: 1000, fee: 0, balanceAfter: 9000,
      counterparty: null, externalRef: '31245678904', occurredAt: null,
    },
  },
  {
    name: 'Telecel send to a number',
    sms: 'Telecel Cash: You have sent GHS 50.00 to 0201234567. Fee: GHS 0.50. Balance: GHS 80.00. Transaction ID: 9876543210.',
    expected: {
      network: 'telecel', type: 'send', direction: 'out', amount: 5000, fee: 50, balanceAfter: 8000,
      counterparty: '0201234567', externalRef: '9876543210', occurredAt: null,
    },
  },
  {
    name: 'AirtelTigo receive with alphanumeric ID',
    sms: 'AirtelTigo Money: You have received GHS 30.00 from 0261234567. Balance: GHS 55.00. Trans ID: AT20261020123.',
    expected: {
      network: 'airteltigo', type: 'receive', direction: 'in', amount: 3000, fee: 0, balanceAfter: 5500,
      counterparty: '0261234567', externalRef: 'AT20261020123', occurredAt: null,
    },
  },
  {
    name: 'REAL MTN data bundle: spacing quirks, no GHS on the tax line, trailing app advert',
    sms: 'Payment for GHS3.00 to MTN BUNDLE .Current Balance: GHS 8.16. Transaction Id: 91854400000. Fee charged: GHS0.00,Tax Charged 0.Download the MoMo App for a Faster & Easier Experience. Click here: https://mtnmymomo.onelink.me/XJOt/MoMo',
    expected: {
      network: 'mtn', type: 'airtime', direction: 'out', amount: 300, fee: 0, balanceAfter: 816,
      counterparty: 'MTN BUNDLE', externalRef: '91854400000', occurredAt: null,
    },
  },
  {
    name: 'REAL MTN cash out: long fee notice, "Financial Transaction Id", no date',
    sms: 'Cash Out made for GHS200.00 to ASARE AND SONS ENT. Current Balance: GHS42.96 Financial Transaction Id: 91661100000. Cash-out fee is charged automatically from your MTN MoMo wallet. Please do not pay any fees to the Agent. Thank you for using MTN MobileMoney. Fee charged: GHS2.00.',
    expected: {
      network: 'mtn', type: 'cash_out', direction: 'out', amount: 20000, fee: 200, balanceAfter: 4296,
      counterparty: 'ASARE AND SONS ENT', externalRef: '91661100000', occurredAt: null,
    },
  },
  {
    name: 'REAL MTN payment received: phone number in brackets, no brand name, Reference field',
    sms: 'Payment received for GHS 40.00 from KWAKU ADDO (233200000000) Current Balance: GHS 42.66 . Available Balance: GHS 42.66. Reference: 1. Transaction ID: 91730100000. Fee charged: GHS0.00.',
    expected: {
      network: 'mtn', type: 'receive', direction: 'in', amount: 4000, fee: 0, balanceAfter: 4266,
      counterparty: 'KWAKU ADDO', note: '1', externalRef: '91730100000', occurredAt: null,
    },
  },
];
