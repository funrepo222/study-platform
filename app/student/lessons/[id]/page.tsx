"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getLessonById, getQuizzes, getExams, submitExamResults } from "@/lib/supabase/db";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function StudentLessonPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuizLoading, setIsQuizLoading] = useState(true);
  const [isExamLoading, setIsExamLoading] = useState(true);
  
  // Quiz state
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showQuizExplanation, setShowQuizExplanation] = useState(false);
  
  // Exam state
  const [isExamActive, setIsExamActive] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [remainingTime, setRemainingTime] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [examQuizzes, setExamQuizzes] = useState<any[]>([]);
  const [currentExamQuizIndex, setCurrentExamQuizIndex] = useState(0);
  
  const { toast } = useToast();

  const navLinks = [
    {
      title: "Dashboard",
      href: "/student/dashboard",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
          <rect width="7" height="9" x="3" y="3" rx="1"></rect>
          <rect width="7" height="5" x="14" y="3" rx="1"></rect>
          <rect width="7" height="9" x="14" y="12" rx="1"></rect>
          <rect width="7" height="5" x="3" y="16" rx="1"></rect>
        </svg>
      ),
    },
    {
      title: "My Classes",
      href: "/student/classes",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
  ];

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    const fetchLessonData = async () => {
      if (params.id) {
        try {
          setIsLoading(true);
          const { data, error } = await getLessonById(params.id);
          
          if (error) throw error;
          
          setLesson(data);
        } catch (error) {
          console.error("Error fetching lesson:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load lesson data. Please try again.",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    const fetchQuizzes = async () => {
      if (params.id) {
        try {
          setIsQuizLoading(true);
          const { data, error } = await getQuizzes(params.id);
          
          if (error) throw error;
          
          setQuizzes(data || []);
        } catch (error) {
          console.error("Error fetching quizzes:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load quizzes. Please try again.",
          });
        } finally {
          setIsQuizLoading(false);
        }
      }
    };

    const fetchExams = async () => {
      if (params.id) {
        try {
          setIsExamLoading(true);
          const { data, error } = await getExams(params.id);
          
          if (error) throw error;
          
          setExams(data || []);
        } catch (error) {
          console.error("Error fetching exams:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load exams. Please try again.",
          });
        } finally {
          setIsExamLoading(false);
        }
      }
    };

    fetchLessonData();
    fetchQuizzes();
    fetchExams();
  }, [params.id, toast]);

  // Handle exam timer
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    
    if (isExamActive && remainingTime > 0) {
      timerId = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // Auto-submit when time is up
            handleSubmitExam();
            clearInterval(timerId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isExamActive, remainingTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuizAnswer = (quizId: string, answerIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [quizId]: answerIndex
    }));
  };

  const handleExamAnswer = (quizId: string, answerIndex: number) => {
    setExamAnswers(prev => ({
      ...prev,
      [quizId]: answerIndex
    }));
  };

  const handleNextQuiz = () => {
    setShowQuizExplanation(false);
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuiz = () => {
    setShowQuizExplanation(false);
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex(prev => prev - 1);
    }
  };

  const handleNextExamQuiz = () => {
    if (currentExamQuizIndex < examQuizzes.length - 1) {
      setCurrentExamQuizIndex(prev => prev + 1);
    }
  };

  const handlePreviousExamQuiz = () => {
    if (currentExamQuizIndex > 0) {
      setCurrentExamQuizIndex(prev => prev - 1);
    }
  };

  const handleCheckAnswer = () => {
    setShowQuizExplanation(true);
  };

  const handleStartExam = (exam: any) => {
    setSelectedExam(exam);
    setIsExamActive(true);
    setRemainingTime(exam.time_limit_minutes * 60);
    setExamAnswers({});
    setExamSubmitted(false);
    setExamScore(0);
    setCurrentExamQuizIndex(0);
    
    // Set exam quizzes from the exam.quizzes array
    setExamQuizzes(exam.quizzes || []);
  };

  const handleSubmitExam = async () => {
    if (!user?.id || !selectedExam) return;
    
    // Calculate score
    let score = 0;
    let totalQuestions = examQuizzes.length;
    
    // This is simplified - in a real app, you'd need to fetch correct answers from the backend
    examQuizzes.forEach(quiz => {
      if (examAnswers[quiz.id] !== undefined) {
        // For this demo, we're assuming each quiz in examQuizzes already has correct_answer_index
        // In a real app, you'd need to fetch this securely from the backend
        if (examAnswers[quiz.id] === quiz.correct_answer_index) {
          score += 1;
        }
      }
    });
    
    const examScore = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    setExamScore(examScore);
    
    try {
      // Submit results to the database
      const { error } = await submitExamResults(
        user.id,
        selectedExam.id,
        examAnswers,
        examScore
      );
      
      if (error) throw error;
      
      toast({
        title: "Exam Submitted",
        description: `Your score: ${examScore}%`,
      });
    } catch (error) {
      console.error("Error submitting exam results:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit exam results. Please try again.",
      });
    } finally {
      setExamSubmitted(true);
      setIsExamActive(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav links={navLinks} />
        <main className="flex-1 py-6 container mx-auto px-4">
          <Skeleton className="h-8 w-1/3 mb-8" />
          <Skeleton className="h-6 w-1/4 mb-4" />
          <Skeleton className="h-[20rem] w-full rounded-lg" />
        </main>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav links={navLinks} />
        <main className="flex-1 py-6 container mx-auto px-4">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Lesson Not Found</h1>
          <p className="text-muted-foreground mb-4">The lesson you are looking for does not exist or you do not have access to it.</p>
          <Button asChild>
            <Link href="/student/dashboard">Return to Dashboard</Link>
          </Button>
        </main>
      </div>
    );
  }

  const videoId = getYouTubeId(lesson.video_url);
  const currentQuiz = quizzes[currentQuizIndex];
  const currentExamQuiz = examQuizzes[currentExamQuizIndex];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav links={navLinks} />
      
      <main className="flex-1 py-6 container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
          <p className="text-muted-foreground">
            From class: <Link href={`/student/classes/${lesson.class_id}`} className="text-primary hover:underline">{lesson.classes.title}</Link>
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Video Lesson</CardTitle>
                <CardDescription>
                  {lesson.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {videoId ? (
                  <div className="aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={lesson.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-md"
                    ></iframe>
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center rounded-md">
                    <p className="text-muted-foreground">Invalid YouTube URL</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {!isQuizLoading && quizzes.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Practice Quiz</CardTitle>
                    <Badge variant="outline">
                      Question {currentQuizIndex + 1} of {quizzes.length}
                    </Badge>
                  </div>
                  <CardDescription>
                    Test your knowledge with these practice questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentQuiz && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">{currentQuiz.question}</h3>
                      <RadioGroup 
                        value={quizAnswers[currentQuiz.id]?.toString()} 
                        onValueChange={(value) => handleQuizAnswer(currentQuiz.id, parseInt(value, 10))}
                        className="space-y-3"
                      >
                        {currentQuiz.choices.map((choice: string, index: number) => (
                          <div key={index} className={cn(
                            "flex items-center space-x-2 rounded-md border p-3",
                            showQuizExplanation && index === currentQuiz.correct_answer_index && "border-green-500 bg-green-50 dark:bg-green-950/20",
                            showQuizExplanation && quizAnswers[currentQuiz.id] === index && index !== currentQuiz.correct_answer_index && "border-red-500 bg-red-50 dark:bg-red-950/20"
                          )}>
                            <RadioGroupItem value={index.toString()} id={`answer-${index}`} disabled={showQuizExplanation} />
                            <Label htmlFor={`answer-${index}`} className="flex-1 cursor-pointer">
                              {choice}
                            </Label>
                            {showQuizExplanation && index === currentQuiz.correct_answer_index && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-green-500">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                      
                      {showQuizExplanation && (
                        <div className="mt-4 p-4 bg-muted rounded-md">
                          <h4 className="font-medium mb-1">Explanation:</h4>
                          <p>{currentQuiz.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={handlePreviousQuiz}
                    disabled={currentQuizIndex === 0}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-2">
                    {!showQuizExplanation && quizAnswers[currentQuiz?.id] !== undefined && (
                      <Button onClick={handleCheckAnswer}>Check Answer</Button>
                    )}
                    <Button 
                      variant={showQuizExplanation ? "default" : "outline"}
                      onClick={handleNextQuiz}
                      disabled={currentQuizIndex === quizzes.length - 1 && showQuizExplanation}
                    >
                      Next
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )}
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exams</CardTitle>
                <CardDescription>
                  Take timed exams to test your knowledge
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isExamLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-md" />
                  </div>
                ) : exams.length > 0 ? (
                  <div className="space-y-4">
                    {exams.map((exam) => (
                      <div key={exam.id} className="border rounded-md p-4">
                        <h3 className="font-medium mb-1">Timed Exam</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Time Limit: {exam.time_limit_minutes} minutes
                        </p>
                        <Button 
                          onClick={() => handleStartExam(exam)}
                          className="w-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                            <path d="M12 8v4l3 3"></path>
                            <circle cx="12" cy="12" r="10"></circle>
                          </svg>
                          Take Exam
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">
                    No exams available for this lesson.
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
                <CardDescription>
                  Track your learning journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-4 text-muted-foreground">
                  Progress tracking will be available in the next version.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Exam Dialog */}
      <Dialog open={isExamActive} onOpenChange={(open) => {
        // Prevent closing by clicking outside while exam is active
        if (!open && isExamActive && !examSubmitted) {
          const confirmExit = window.confirm("Are you sure you want to exit? Your progress will be lost.");
          if (confirmExit) {
            setIsExamActive(false);
          }
        }
      }}>
        <DialogContent className="sm:max-w-2xl" onInteractOutside={(e) => {
          // Prevent closing by clicking outside
          if (isExamActive && !examSubmitted) {
            e.preventDefault();
          }
        }}>
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Timed Exam</DialogTitle>
              {!examSubmitted && (
                <Badge variant="outline" className="text-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {formatTime(remainingTime)}
                </Badge>
              )}
            </div>
            <DialogDescription>
              {examSubmitted 
                ? `You scored ${examScore}% on this exam` 
                : `Answer all questions within the time limit of ${selectedExam?.time_limit_minutes} minutes`}
            </DialogDescription>
          </DialogHeader>
          
          {examSubmitted ? (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-4">
                  <span className="text-3xl font-bold">{examScore}%</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {examScore >= 70 ? "Congratulations!" : "Good effort!"}
                </h3>
                <p className="text-muted-foreground">
                  {examScore >= 70
                    ? "You've successfully passed this exam."
                    : "Keep studying and try again to improve your score."}
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="font-medium">Review Questions</h3>
                
                {examQuizzes.map((quiz, index) => (
                  <div key={quiz.id} className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Question {index + 1}: {quiz.question}</h4>
                    <div className="ml-4 space-y-2">
                      {quiz.choices.map((choice: string, choiceIndex: number) => (
                        <div key={choiceIndex} className={cn(
                          "p-2 rounded-md",
                          examAnswers[quiz.id] === choiceIndex && choiceIndex === quiz.correct_answer_index && "bg-green-50 dark:bg-green-950/20",
                          examAnswers[quiz.id] === choiceIndex && choiceIndex !== quiz.correct_answer_index && "bg-red-50 dark:bg-red-950/20",
                          examAnswers[quiz.id] !== choiceIndex && choiceIndex === quiz.correct_answer_index && "bg-green-50/50 dark:bg-green-950/10",
                        )}>
                          <span className={cn(
                            examAnswers[quiz.id] === choiceIndex && choiceIndex === quiz.correct_answer_index && "text-green-600 dark:text-green-400 font-medium",
                            examAnswers[quiz.id] === choiceIndex && choiceIndex !== quiz.correct_answer_index && "text-red-600 dark:text-red-400 font-medium",
                            examAnswers[quiz.id] !== choiceIndex && choiceIndex === quiz.correct_answer_index && "text-green-600/70 dark:text-green-400/70 font-medium"
                          )}>
                            {String.fromCharCode(65 + choiceIndex)}. {choice}
                            {choiceIndex === quiz.correct_answer_index && " (Correct)"}
                          </span>
                        </div>
                      ))}
                    </div>
                    {quiz.explanation && (
                      <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                        <span className="font-medium">Explanation:</span> {quiz.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <DialogFooter>
                <Button onClick={() => setIsExamActive(false)}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              {currentExamQuiz && (
                <div className="space-y-4 py-4">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">
                      Question {currentExamQuizIndex + 1} of {examQuizzes.length}
                    </Badge>
                    
                    <div className="text-sm text-muted-foreground">
                      {Object.keys(examAnswers).length} of {examQuizzes.length} answered
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium mt-2">{currentExamQuiz.question}</h3>
                  <RadioGroup 
                    value={examAnswers[currentExamQuiz.id]?.toString()} 
                    onValueChange={(value) => handleExamAnswer(currentExamQuiz.id, parseInt(value, 10))}
                    className="space-y-3"
                  >
                    {currentExamQuiz.choices.map((choice: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2 rounded-md border p-3">
                        <RadioGroupItem value={index.toString()} id={`exam-answer-${index}`} />
                        <Label htmlFor={`exam-answer-${index}`} className="flex-1 cursor-pointer">
                          {choice}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
              
              <DialogFooter className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handlePreviousExamQuiz}
                    disabled={currentExamQuizIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleNextExamQuiz}
                    disabled={currentExamQuizIndex === examQuizzes.length - 1}
                  >
                    Next
                  </Button>
                </div>
                
                <Button onClick={handleSubmitExam}>
                  Submit Exam
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}