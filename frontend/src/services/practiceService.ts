import { request } from './apiClient';
import { PracticeSession } from '../types';

export interface PracticeCreatePayload {
  topic: string;
  source_report_id?: string;
  target_role?: string;
  difficulty?: string;
}

export const practiceService = {
  async startPractice(payload: PracticeCreatePayload): Promise<PracticeSession> {
    return request<PracticeSession>('/api/practice', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async answerQuestion(practiceId: string, questionId: string, answerText: string): Promise<PracticeSession> {
    return request<PracticeSession>(`/api/practice/${practiceId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, answer_text: answerText }),
    });
  },

  async getHistory(): Promise<PracticeSession[]> {
    return request<PracticeSession[]>('/api/practice/history');
  },
};
