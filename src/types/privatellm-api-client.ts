export type AttestationReportParams = {
  model: string;
};

export type Attestation = {
  signing_address: string;
  intel_quote: string;
  nvidia_payload: string;
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
