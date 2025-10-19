export type AttestationReportParams = {
  model: string;
  signing_algo?: string;
  nonce?: string;
  signing_address?: string;
};

export type Attestation = {
  signing_address: string;
  intel_quote: string;
  nvidia_payload: string;
  request_nonce?: string;
  event_log?: Array<Record<string, unknown>>;
  info?: Record<string, unknown>;
};

export type AttestationReport = Attestation & {
  all_attestations: Attestation[];
};

export type SignatureParams = {
  chat_id: string;
  model: string;
  signing_algo: string;
};

export type Signature = {
  text: string;
  signature: string;
  signing_address: string;
  signing_algo: SigningAlgo;
};

export type SigningAlgo = 'ecdsa' | 'ed25519';
