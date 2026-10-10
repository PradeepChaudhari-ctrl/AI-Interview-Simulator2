import { request } from './apiClient';
import { Report } from '../types';

export const reportService = {
  async getReport(sessionId: string): Promise<Report> {
    return request<Report>(`/api/reports/${sessionId}`);
  },
};
