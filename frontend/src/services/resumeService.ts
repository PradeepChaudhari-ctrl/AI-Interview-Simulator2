import { request } from './apiClient';
import { Resume, ParsedProfile } from '../types';

export const resumeService = {
  async uploadResume(file: File): Promise<Resume> {
    const formData = new FormData();
    formData.append('file', file);
    return request<Resume>('/api/resumes', {
      method: 'POST',
      body: formData,
    });
  },

  async listResumes(): Promise<Resume[]> {
    return request<Resume[]>('/api/resumes');
  },

  async getResume(id: string): Promise<Resume> {
    return request<Resume>(`/api/resumes/${id}`);
  },

  async updateResume(id: string, parsedProfile: ParsedProfile): Promise<Resume> {
    return request<Resume>(`/api/resumes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ parsed_profile: parsedProfile }),
    });
  },

  async deleteResume(id: string): Promise<void> {
    return request<void>(`/api/resumes/${id}`, {
      method: 'DELETE',
    });
  },
};
