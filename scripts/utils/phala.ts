import { getCvmInfo, createClient } from '@phala/cloud';
import { ENV_PHALA_CLOUD_API_KEY } from './envs';

const client = createClient({
  apiKey: ENV_PHALA_CLOUD_API_KEY,
});

export type CvmStatus =
  | 'creating'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped';

export async function getCvmStatus(cvmId: string): Promise<CvmStatus> {
  const cvm = await getCvmInfo(client, {
    uuid: cvmId,
  });
  return cvm.status as CvmStatus;
}
