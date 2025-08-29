export type InternalModelParams = {
  modelId: string;
  model: string;
  apiUrl: string;
  apiKey: string;
};

export type LitellmCredentialValues = {
  apiUrl: string;
  apiKey: string;
};

export type LitellmProxyModel = {
  model_name: string;
  litellm_params: {
    model: string;
    custom_llm_provider: string;
    litellm_credential_name?: string;
    input_cost_per_token: number;
    output_cost_per_token: number;
  };
  model_info: {
    id: string;
    nearai_metadata?: {
      verifiable?: boolean;
      context_length?: number;
      model_icon?: string;
      model_full_name?: string;
      model_description?: string;
    };
  };
};
