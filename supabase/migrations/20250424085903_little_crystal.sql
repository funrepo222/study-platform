/*
  # Initial Schema Setup

  1. New Tables
    - `users` - Stores user profile information
    - `classes` - Stores classes created by teachers
    - `enrollments` - Tracks student enrollments in classes
    - `lessons` - Stores lessons within classes
    - `quizzes` - Stores quiz questions for lessons
    - `exams` - Stores timed exams for lessons
    - `exam_quizzes` - Junction table between exams and quizzes
    - `results` - Stores exam results for students
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
    - Set up functions for leaderboard calculation
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_answer_index INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  time_limit_minutes INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create exam_quizzes junction table
CREATE TABLE IF NOT EXISTS exam_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  UNIQUE(exam_id, quiz_id)
);

-- Create results table
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL
);

-- Create function for leaderboard
CREATE OR REPLACE FUNCTION get_class_leaderboard(class_id UUID)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  surname TEXT,
  total_score BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.name,
    u.surname,
    COALESCE(SUM(r.score), 0) AS total_score
  FROM 
    users u
  JOIN 
    enrollments e ON u.id = e.student_id
  LEFT JOIN 
    results r ON u.id = r.user_id
  LEFT JOIN 
    exams ex ON r.exam_id = ex.id
  LEFT JOIN 
    lessons l ON ex.lesson_id = l.id
  WHERE 
    e.class_id = class_id
    AND l.class_id = class_id
  GROUP BY 
    u.id, u.name, u.surname
  ORDER BY 
    total_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for classes table
CREATE POLICY "Teachers can create classes"
  ON classes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update their own classes"
  ON classes
  FOR UPDATE
  USING (teacher_id = auth.uid());

CREATE POLICY "Anyone can view classes"
  ON classes
  FOR SELECT
  USING (true);

-- Create policies for enrollments table
CREATE POLICY "Students can enroll in classes"
  ON enrollments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Students can view their enrollments"
  ON enrollments
  FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view enrollments for their classes"
  ON enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = enrollments.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Create policies for lessons table
CREATE POLICY "Teachers can create lessons for their classes"
  ON lessons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their lessons"
  ON lessons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view lessons"
  ON lessons
  FOR SELECT
  USING (true);

-- Create policies for quizzes table
CREATE POLICY "Teachers can create quizzes"
  ON quizzes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN classes ON lessons.class_id = classes.id
      WHERE lessons.id = lesson_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view quizzes"
  ON quizzes
  FOR SELECT
  USING (true);

-- Create policies for exams table
CREATE POLICY "Teachers can create exams"
  ON exams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN classes ON lessons.class_id = classes.id
      WHERE lessons.id = lesson_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view exams"
  ON exams
  FOR SELECT
  USING (true);

-- Create policies for exam_quizzes table
CREATE POLICY "Teachers can create exam_quizzes"
  ON exam_quizzes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exams
      JOIN lessons ON exams.lesson_id = lessons.id
      JOIN classes ON lessons.class_id = classes.id
      WHERE exams.id = exam_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view exam_quizzes"
  ON exam_quizzes
  FOR SELECT
  USING (true);

-- Create policies for results table
CREATE POLICY "Students can submit their results"
  ON results
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can view their own results"
  ON results
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can view results for their classes"
  ON results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      JOIN lessons ON exams.lesson_id = lessons.id
      JOIN classes ON lessons.class_id = classes.id
      WHERE exams.id = exam_id 
      AND classes.teacher_id = auth.uid()
    )
  );