// Common type definitions for the certiQ application

// User types
export interface User {
  id: string
  name?: string
  email: string
  profileImageUrl?: string
  certificationType?: string
  targetExamDate?: Date
  streakCount: number
  lastStreakDate?: Date
  createdAt: Date
  updatedAt: Date
}

// Question types
export interface Question {
  id: string
  content: string
  options: string[]
  correctAnswer: string
  explanation: string
  certificationType: string
  category: string
  difficulty: '상' | '중' | '하' | number // '상', '중', '하' 또는 숫자 (하위 호환성)
  tags: string[]
  createdAt: Date
}

// Study record types
export interface StudyRecord {
  id: string
  userId: string
  questionId: string
  userAnswer: string
  isCorrect: boolean
  timeSpent: number
  createdAt: Date
}

// Wrong answer types
export interface WrongAnswer {
  id: string
  userId: string
  questionId: string
  wrongCount: number
  lastWrongDate: Date
  nextReviewDate?: Date
  graduated: boolean
  createdAt: Date
  updatedAt: Date
}

// Daily set types
export interface DailySet {
  id: string
  userId: string
  questionIds: string[]
  completed: boolean
  completedAt?: Date
  createdAt: Date
}

// Diagnosis result types
export interface DiagnosisResult {
  id: string
  userId: string
  scores: Record<string, number>
  weakAreas: string[]
  subjectGroups?: Record<string, {
    subjectName: string
    subjectNumber: number
    topics: Array<{
      topicName: string
      categoryCode: string
      correct: number
      total: number
      percentage: number
    }>
    totalCorrect: number
    totalQuestions: number
  }>
  categoryDetails?: Record<string, { correct: number; total: number; name: string }>
  totalScore?: number
  totalQuestions?: number
  createdAt: Date
}








