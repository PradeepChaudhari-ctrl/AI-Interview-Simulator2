import { request } from './apiClient';
import { InterviewSession, Question, Answer } from '../types';

export interface AnswerPayload {
  text_answer: string;
  transcript?: string;
  duration_seconds?: number;
  mode?: string;
}

export const interviewService = {
  async startInterview(blueprintId: string, mode: string = 'text'): Promise<InterviewSession> {
    return request<InterviewSession>('/api/interviews', {
      method: 'POST',
      body: JSON.stringify({ blueprint_id: blueprintId, mode }),
    });
  },

  async listInterviews(): Promise<InterviewSession[]> {
    return request<InterviewSession[]>('/api/interviews');
  },

  async getInterview(id: string): Promise<InterviewSession> {
    return request<InterviewSession>(`/api/interviews/${id}`);
  },

  async getNextQuestion(sessionId: string): Promise<Question | null> {
    return request<Question | null>(`/api/interviews/${sessionId}/next-question`, {
      method: 'POST',
    });
  },

  async submitAnswer(questionId: string, payload: AnswerPayload): Promise<Answer> {
    return request<Answer>(`/api/questions/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async completeInterview(sessionId: string): Promise<InterviewSession> {
    return request<InterviewSession>(`/api/interviews/${sessionId}/complete`, {
      method: 'POST',
    });
  },
};
