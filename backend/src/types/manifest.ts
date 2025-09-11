export interface Manifest {
  id: string; // jobId or UUID
  name: string;
  description: string;

  agentType: string;
  language: string;
  framework: string;
  tools: string[];
  platform: string;

  functionality: {
    features: string[];
    constraints: string[];
  };

  dependencies: {
    python: string[];
    node: string[];
    system: string[];
  };

  deployment: {
    docker: boolean;
    zipDownload: boolean;
    instructions: string;
  };

  metadata: {
    createdBy: string;
    createdAt: string;
    status: 'pending' | 'building' | 'success' | 'failed';
  };
}
