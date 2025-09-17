export type RegisterUserParams = {
  userId: string;
  userEmail?: string;
  teamId?: string;
};

export type GetUserParams = {
  userId: string;
};

export type ListUsersParams = {
  page?: number; // Min: 1
  pageSize?: number; // Min: 1 Max: 100
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type ListUsersResponse = {
  users: User[];
  totalUsers: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ManageUserParams = {
  userId: string;
  maxBudget: number | null; // null means unlimited
};

export type CreateTeamParams = {
  teamId?: string;
  teamAlias: string;
  maxBudget?: number;
  models?: string[];
};

export type CreateTeamResponse = {
  teamId: string;
};

export type UpdateTeamParams = {
  teamId: string;
  teamAlias?: string;
  maxBudget?: number;
  models?: string[];
};

export type ListTeamsParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type ListTeamsResponse = {
  teams: Team[];
  totalTeams: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type Team = {
  teamId: string;
  teamAlias: string;
  maxBudget: number | null;
  models: string[];
};

export type GetUserDailyActivityParams = {
  startDate: string;
  endDate: string;
  page?: number; // Min: 1
  pageSize?: number; // Min: 1 Max: 1000
};

export type GetTagDailyActivityParams = {
  tags?: string[];
  startDate: string;
  endDate: string;
  page?: number; // Min: 1
  pageSize?: number; // Min: 1 Max: 1000
};

export type User = {
  userId: string;
  userEmail: string | null;
  maxBudget: number | null; // null means unlimited
  spend: number;
};

export type GenerateKeyParams = {
  keyType?: 'default' | 'llm_api' | 'management';
  userId?: string;
  teamId?: string;
  keyAlias?: string;
  keyDuration?: string; // e.g. 30s 30m 30h 30d
  models?: string[];
  maxBudget?: number;
  rpmLimit?: number;
  tpmLimit?: number;
  metadata?: KeyMetadata;
};

export type GenerateServiceAccountParams = {
  keyType?: 'default' | 'llm_api' | 'management';
  serviceAccountId: string;
  teamId?: string;
  keyAlias?: string;
  keyDuration?: string; // e.g. 30s 30m 30h 30d
  models?: string[];
  maxBudget?: number;
  rpmLimit?: number;
  tpmLimit?: number;
};

export type GenerateKeyResponse = {
  key: string;
  expires: string | null; // ISO string
};

export type UpdateKeyParams = {
  keyOrKeyHash: string;
  keyAlias?: string;
  maxBudget?: number;
  blocked?: boolean;
};

export type DeleteKeyParams = {
  keyOrKeyHashes?: string[];
  keyAliases?: string[];
};

export type GetKeyParams = {
  keyOrKeyHash: string;
};

export type Key = {
  keyHash: string;
  keyName: string; // Simplified key string. e.g. sk-...ABcd
  keyAlias: string | null;
  spend: number;
  expires: string | null;
  models: string[];
  userId: string | null;
  teamId: string | null;
  rpmLimit: number | null;
  tpmLimit: number | null;
  maxBudget: number | null;
  budgetDuration: string | null;
  budgetResetAt: string | null;
  blocked: boolean | null;
  createdAt: string;
  metadata: KeyMetadata;
};

export type KeyMetadata = Record<string, unknown>; // TODO: Maybe a more specific type

export type ListKeysParams = {
  userId: string;
  page?: number; // Min: 1
  pageSize?: number; // Min: 1 Max: 100
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type ListKeysResponse = {
  keys: Key[];
  totalKeys: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type GetSpendLogsPaginationParams = {
  userId: string;
  keyOrKeyHash?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

export type GetSpendLogsPaginationResponse = {
  spendLogs: SpendLog[];
  totalSpendLogs: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type GetSpendLogsParams = {
  userId: string;
  keyOrKeyHash?: string;
  startDate?: string;
  endDate?: string;
};

export type SpendLog = {
  requestId: string;
  userId: string;
  keyHash: string;
  status: string;
  callType: string;
  spend: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  modelId: string;
  model: string;
  startTime: string;
  endTime: string;
};

export type CreateModelParams = {
  model: string;
  providerModelName: string;
  providerName: string;
  credentialName: string;
  inputCostPerToken?: number;
  outputCostPerToken?: number;
  metadata: {
    verifiable: boolean;
    contextLength: number;
    modelFullName: string;
    modelDescription: string;
    modelIcon: string;
  };
};

export type CreateModelResponse = {
  modelId: string;
};

export type UpdateModelParams = {
  modelId: string;
  model?: string;
  providerModelName?: string;
  providerName?: string;
  credentialName?: string;
  inputCostPerToken?: number;
  outputCostPerToken?: number;
  metadata?: {
    verifiable?: boolean;
    contextLength?: number;
    modelFullName?: string;
    modelDescription?: string;
    modelIcon?: string;
  };
};

export type DeleteModelParams = {
  modelId: string;
};

export type ListModelsPaginationParams = {
  page?: number;
  pageSize?: number;
  cache?: boolean;
};

export type ListModelsPaginationResponse = {
  models: Model[];
  totalModels: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ListModelsParams = {
  modelId?: string;
};

export type GetModelParams = {
  modelId: string;
};

export type Model = {
  modelId: string;
  model: string;
  providerModelName: string;
  providerName: string;
  credentialName?: string;
  inputCostPerToken: number;
  outputCostPerToken: number;
  metadata: {
    verifiable: boolean | null;
    contextLength: number | null;
    modelFullName: string | null;
    modelDescription: string | null;
    modelIcon: string | null;
  };
};

export type CreateCredentialParams = {
  credentialName: string;
  providerName?: string;
  providerApiUrl: string;
  providerApiKey: string;
};

export type Credential = {
  credentialName: string;
  providerName: string;
  providerApiUrl: string;
  providerApiKey: string;
};

export type UpdateCredentialParams = {
  credentialName: string;
  providerName?: string;
  providerApiUrl?: string;
  providerApiKey?: string;
};
