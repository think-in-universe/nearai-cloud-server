import { createHash } from 'crypto';
import nacl from 'tweetnacl';
import { config } from '../config';
import { LITELLM_KEY_PREFIX } from './consts';

export function litellmKeyHash(keyOrKeyHash: string): string {
  if (keyOrKeyHash.startsWith(LITELLM_KEY_PREFIX)) {
    return createHash('sha256').update(keyOrKeyHash).digest().toString('hex');
  } else {
    return keyOrKeyHash;
  }
}

export function litellmDecryptValue(
  valueBase64: string,
  signingKey = config.litellm.signingKey,
): string {
  const value = Buffer.from(valueBase64, 'base64');

  if (value.length === 0) {
    return '';
  }

  if (value.length < nacl.secretbox.nonceLength) {
    throw Error('Invalid value');
  }

  const signingKeyHash = createHash('sha256').update(signingKey).digest();

  const nonce = value.subarray(0, nacl.secretbox.nonceLength);
  const box = value.subarray(nacl.secretbox.nonceLength);
  const decryptedValue = nacl.secretbox.open(box, nonce, signingKeyHash);

  if (!decryptedValue) {
    throw new Error('Failed to decrypt value');
  }

  return Buffer.from(decryptedValue).toString();
}
