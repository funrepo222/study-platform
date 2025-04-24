export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          surname: string
          username: string
          email: string
          role: 'student' | 'teacher' | 'admin'
          created_at?: string
        }
        Insert: {
          id: string
          name: string
          surname: string
          username: string
          email: string
          role: 'student' | 'teacher' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          surname?: string
          username?: string
          email?: string
          role?: 'student' | 'teacher' | 'admin'
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          title: string
          teacher_id: string
          created_at?: string
        }
        Insert: {
          id?: string
          title: string
          teacher_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          teacher_id?: string
          created_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          class_id: string
          student_id: string
          created_at?: string
        }
        Insert: {
          id?: string
          class_id: string
          student_id: string
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          student_id?: string
          created_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          class_id: string
          title: string
          video_url: string
          description: string
          created_at?: string
        }
        Insert: {
          id?: string
          class_id: string
          title: string
          video_url: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          title?: string
          video_url?: string
          description?: string
          created_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          lesson_id: string
          question: string
          choices: string[]
          correct_answer_index: number
          explanation: string
          created_at?: string
        }
        Insert: {
          id?: string
          lesson_id: string
          question: string
          choices: string[]
          correct_answer_index: number
          explanation: string
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          question?: string
          choices?: string[]
          correct_answer_index?: number
          explanation?: string
          created_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          lesson_id: string
          time_limit_minutes: number
          created_at?: string
        }
        Insert: {
          id?: string
          lesson_id: string
          time_limit_minutes: number
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          time_limit_minutes?: number
          created_at?: string
        }
      }
      exam_quizzes: {
        Row: {
          id: string
          exam_id: string
          quiz_id: string
        }
        Insert: {
          id?: string
          exam_id: string
          quiz_id: string
        }
        Update: {
          id?: string
          exam_id?: string
          quiz_id?: string
        }
      }
      results: {
        Row: {
          id: string
          user_id: string
          exam_id: string
          answers: Json
          score: number
          taken_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exam_id: string
          answers: Json
          score: number
          taken_at: string
        }
        Update: {
          id?: string
          user_id?: string
          exam_id?: string
          answers?: Json
          score?: number
          taken_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_class_leaderboard: {
        Args: {
          class_id: string
        }
        Returns: {
          user_id: string
          name: string
          surname: string
          total_score: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}