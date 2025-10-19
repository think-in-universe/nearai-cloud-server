import { DstackClient } from '@phala/dstack-sdk';
import * as crypto from 'crypto';

export type GatewayAttestation = {
  request_nonce: string;
  intel_quote: string;
  event_log: Array<Record<string, unknown>>;
  info: Record<string, unknown>;
};

/**
 * Parse nonce from string or generate random 32-byte nonce if not provided
 */
export function parseNonce(nonce?: string): string {
  if (!nonce) {
    return crypto.randomBytes(32).toString('hex');
  }

  // Validate hex format before parsing
  if (!/^[0-9a-fA-F]+$/.test(nonce)) {
    throw new Error(`Nonce must be hex-encoded: ${nonce}`);
  }

  const nonceBytes = Buffer.from(nonce, 'hex');

  if (nonceBytes.length !== 32) {
    throw new Error('Nonce must be 32 bytes');
  }
  return nonce;
}

/**
 * Build report data using only nonce
 */
function buildReportData(nonce: Buffer): Buffer {
  if (nonce.length !== 32) {
    throw new Error('Nonce must be 32 bytes');
  }
  // pad with zeros to 64 bytes
  return Buffer.concat([Buffer.alloc(32, 0), nonce]);
}

export async function generateGatewayAttestation(
  nonce: string,
): Promise<GatewayAttestation> {
  const nonceBytes = Buffer.from(nonce, 'hex');

  const client = new DstackClient();
  const reportData = buildReportData(nonceBytes);
  const quoteResult = await client.getQuote(reportData);
  const info = await client.info();

  return {
    request_nonce: nonce,
    intel_quote: quoteResult.quote,
    event_log: JSON.parse(quoteResult.event_log),
    info: info as unknown as Record<string, unknown>,
  };
}
