export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface EducationItem {
  institution?: string;
  degree?: string;
  field_of_study?: string;
  year?: string;
  grade?: string;
}

export interface ExperienceItem {
  company?: string;
  role?: string;
  duration?: string;
  description?: string;
  key_contributions?: string[];
}

export interface ProjectItem {
  name: string;
  description?: string;
  technologies?: string[];
  key_features?: string[];
  outcome?: string;
}

export interface ParsedProfile {
  name: string;
  email?: string;
  phone?: string;
  summary?: string;
  education?: EducationItem[];
  skills?: string[];
  projects?: ProjectItem[];
  experience?: ExperienceItem[];
  certifications?: string[];
  achievements?: string[];
  tools?: string[];
  keywords?: string[];
}

export interface Resume {
  id: string;
  original_filename: string;
  parsed_profile: ParsedProfile;
  created_at: string;
}

export interface BlueprintRound {
  name: string;
  round_type: 'aptitude' | 'core' | 'technical' | 'behavioral' | 'coding' | 'case_study' | string;
  objective: string;
  topics: string[];
  question_count: number;
  difficulty: string;
  time_limit_minutes: number;
  allowed_modes: string[];
  evaluation_criteria: string[];
}

export interface BlueprintData {
  target_role: string;
  experience_level?: string;
  rounds: BlueprintRound[];
}

export interface InterviewBlueprint {
  id: string;
  target_role: string;
  resume_id?: string;
  jd_text?: string;
  blueprint: BlueprintData;
  created_at: string;
}

export interface Question {
  id: string;
  round_id: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  topic: string;
  expected_concepts: string[];
  question_number: number;
  total_questions_in_round: number;
}

export interface AnswerEvaluation {
  score: number;
  correctness: number;
  relevance: number;
  technical_depth: number;
  clarity: number;
  completeness: number;
  communication_observation?: string;
  confidence_observation?: string;
  strengths: string[];
  weaknesses: string[];
  improvement_tip: string;
  detected_topics: string[];
  weakness_tags: string[];
  follow_up_needed: boolean;
  suggested_follow_up_direction?: string;
}

export interface Answer {
  id: string;
  question_id: string;
  text_answer: string;
  transcript?: string;
  duration_seconds: number;
  evaluation: AnswerEvaluation;
  created_at: string;
}

export interface InterviewRound {
  id: string;
  round_type: string;
  round_order: number;
  status: 'pending' | 'in_progress' | 'completed' | string;
  score?: number | null;
  name?: string;
  objective?: string;
  question_count: number;
  completed_question_count: number;
}

export interface InterviewSession {
  id: string;
  blueprint_id: string;
  target_role: string;
  status: 'in_progress' | 'completed' | string;
  mode: 'text' | 'voice' | 'video' | string;
  started_at: string;
  completed_at?: string | null;
  rounds: InterviewRound[];
  current_round?: InterviewRound | null;
  current_question?: Question | null;
}

export interface RoundMetric {
  round_order: number;
  round_type: string;
  round_name: string;
  score: number;
  total_questions: number;
  key_strengths: string[];
  areas_for_growth: string[];
}

export interface TopicMetric {
  topic: string;
  score: number;
  status: 'strong' | 'satisfactory' | 'needs_practice' | string;
}

export interface OverallMetrics {
  readiness_score: number;
  technical_depth_score: number;
  communication_score: number;
  problem_solving_score: number;
  clarity_score: number;
  total_questions_answered: number;
  total_duration_seconds: number;
  round_metrics: RoundMetric[];
  topic_metrics: TopicMetric[];
}

export interface PracticePlanItem {
  topic: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  reason: string;
  suggested_actions: string[];
}

export interface Report {
  id: string;
  session_id: string;
  target_role: string;
  overall_metrics: OverallMetrics;
  weaknesses: string[];
  strengths: string[];
  recommendations: string[];
  practice_plan: PracticePlanItem[];
  created_at: string;
}

export interface PracticeQuestion {
  id: string;
  question_text: string;
  concept_tested: string;
  hint?: string;
  difficulty: string;
}

export interface PracticeAnswerItem {
  question_id: string;
  question_text: string;
  user_answer: string;
  feedback: string;
  score: number;
  ideal_concepts: string[];
}

export interface PracticeSession {
  id: string;
  topic: string;
  status: 'pending' | 'in_progress' | 'completed' | string;
  score?: number | null;
  source_report_id?: string;
  questions: PracticeQuestion[];
  answers: PracticeAnswerItem[];
  created_at: string;
}
