import { supabase } from './auth';

// Class-related functions
export async function getClasses(teacherId?: string) {
  try {
    let query = supabase.from('classes').select(`
      id, 
      title, 
      teacher_id,
      users!teacher_id (name, surname)
    `);
    
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return { data: null, error };
  }
}

export async function getClassById(classId: string) {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id, 
        title, 
        teacher_id,
        users!teacher_id (name, surname)
      `)
      .eq('id', classId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching class:', error);
    return { data: null, error };
  }
}

export async function createClass(title: string, teacherId: string) {
  try {
    const { data, error } = await supabase
      .from('classes')
      .insert({ title, teacher_id: teacherId })
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating class:', error);
    return { data: null, error };
  }
}

// Lesson-related functions
export async function getLessons(classId: string) {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return { data: null, error };
  }
}

export async function getLessonById(lessonId: string) {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        id, 
        class_id, 
        title, 
        video_url, 
        description,
        classes (title, teacher_id)
      `)
      .eq('id', lessonId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return { data: null, error };
  }
}

export async function createLesson(classId: string, title: string, videoUrl: string, description: string) {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .insert({ class_id: classId, title, video_url: videoUrl, description })
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating lesson:', error);
    return { data: null, error };
  }
}

// Quiz-related functions
export async function getQuizzes(lessonId: string) {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('id');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return { data: null, error };
  }
}

export async function createQuiz(lessonId: string, question: string, choices: string[], correctAnswerIndex: number, explanation: string) {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        lesson_id: lessonId,
        question,
        choices,
        correct_answer_index: correctAnswerIndex,
        explanation
      })
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating quiz:', error);
    return { data: null, error };
  }
}

// Exam-related functions
export async function getExams(lessonId: string) {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        id, 
        lesson_id, 
        time_limit_minutes,
        quizzes!exam_quizzes (
          id,
          question,
          choices,
          explanation
        )
      `)
      .eq('lesson_id', lessonId);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching exams:', error);
    return { data: null, error };
  }
}

export async function createExam(lessonId: string, timeLimitMinutes: number, quizIds: string[]) {
  try {
    // Create the exam
    const { data, error } = await supabase
      .from('exams')
      .insert({
        lesson_id: lessonId,
        time_limit_minutes: timeLimitMinutes
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Associate quizzes with the exam
    const examQuizzes = quizIds.map(quizId => ({
      exam_id: data.id,
      quiz_id: quizId
    }));
    
    const { error: joinError } = await supabase
      .from('exam_quizzes')
      .insert(examQuizzes);
    
    if (joinError) throw joinError;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating exam:', error);
    return { data: null, error };
  }
}

// Results-related functions
export async function submitExamResults(userId: string, examId: string, answers: Record<string, number>, score: number) {
  try {
    const { data, error } = await supabase
      .from('results')
      .insert({
        user_id: userId,
        exam_id: examId,
        answers,
        score,
        taken_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error submitting exam results:', error);
    return { data: null, error };
  }
}

export async function getStudentResults(userId: string) {
  try {
    const { data, error } = await supabase
      .from('results')
      .select(`
        id,
        score,
        taken_at,
        exams (
          id,
          lessons (
            id,
            title,
            classes (
              id,
              title
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('taken_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching student results:', error);
    return { data: null, error };
  }
}

export async function getLeaderboard(classId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_class_leaderboard', { class_id: classId })
      .limit(10);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { data: null, error };
  }
}

// Enrollment functions
export async function enrollStudent(classId: string, studentId: string) {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        class_id: classId,
        student_id: studentId
      })
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error enrolling student:', error);
    return { data: null, error };
  }
}

export async function getStudentEnrollments(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        classes (
          id,
          title,
          users!teacher_id (
            name,
            surname
          )
        )
      `)
      .eq('student_id', studentId);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    return { data: null, error };
  }
}