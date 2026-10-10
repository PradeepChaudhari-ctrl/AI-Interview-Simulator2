import { request } from './apiClient';
import { InterviewBlueprint } from '../types';

export interface BlueprintGeneratePayload {
  target_role: string;
  resume_id?: string;
  jd_text?: string;
  template_type?: string;
  experience_level?: string;
  preferred_language?: string;
}

export const blueprintService = {
  async generateBlueprint(payload: BlueprintGeneratePayload): Promise<InterviewBlueprint> {
    return request<InterviewBlueprint>('/api/blueprints', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getBlueprint(id: string): Promise<InterviewBlueprint> {
    return request<InterviewBlueprint>(`/api/blueprints/${id}`);
  },

  async listBlueprints(): Promise<InterviewBlueprint[]> {
    return request<InterviewBlueprint[]>('/api/blueprints');
  },
};
