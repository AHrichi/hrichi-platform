import { describe, it, expect } from 'vitest';
import { DispatchQuotaService, DISPATCH_QUOTAS } from './quota.service';
import { PayloadTooLargeException } from '@nestjs/common';

describe('DispatchQuotaService', () => {
  const service = new DispatchQuotaService();

  it('should accept payloads within the 64KB cluster limit', () => {
    const normalPayload = {
      orderId: 'ORD-8401',
      items: [{ name: 'Sheets', quantity: 20 }],
    };
    expect(() => service.validatePayloadSize(normalPayload)).not.toThrow();
  });

  it('should reject payloads exceeding the 64KB cluster limit', () => {
    const hugePayload = {
      junk: 'x'.repeat(DISPATCH_QUOTAS.MAX_PAYLOAD_BYTES + 1000),
    };
    expect(() => service.validatePayloadSize(hugePayload)).toThrow(
      PayloadTooLargeException,
    );
  });
});
