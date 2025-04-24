"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getLessonById, getQuizzes, createQuiz, createExam } from "@/lib/supabase/db";
import Link from "next/link";

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuizzesLoading, setIsQuizzesLoading] = useState(true);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    question: "",
    choices: ["", "", "", ""],
    correctAnswerIndex: 0,
    explanation: "",
  });
  const [examSettings, setExamSettings] = useState({
    timeLimitMinutes: 30,
    quizIds: [] as string[],
  });
  const { toast } = useToast();

  const navLinks = [
    {
      title: "Dashboard",
      href: "/teacher/dashboard",
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
      title: "Classes",
      href: "/teacher/classes",
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
      if (params.id && user?.id) {
        try {
          setIsLoading(true);
          const { data, error } = await getLessonById(params.id);
          
          if (error) throw error;
          
          setLesson(data);
          
          // Check if the lesson belongs to the current teacher
          if (data?.classes?.teacher_id !== user.id) {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You do not have permission to view this lesson.",
            });
            router.push("/teacher/dashboard");
          }
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
          setIsQuizzesLoading(true);
          const { data, error } = await getQuizzes(params.id);
          
          if (error) throw error;
          
          setQuizzes(data || []);
          // Update exam settings with quiz IDs
          if (data && data.length > 0) {
            setExamSettings(prev => ({
              ...prev,
              quizIds: data.map((quiz: any) => quiz.id)
            }));
          }
        } catch (error) {
          console.error("Error fetching quizzes:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load quizzes. Please try again.",
          });
        } finally {
          setIsQuizzesLoading(false);
        }
      }
    };

    fetchLessonData();
    fetchQuizzes();
  }, [params.id, user, toast, router]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newQuiz.question.trim() || 
        newQuiz.choices.some(choice => !choice.trim()) || 
        !newQuiz.explanation.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields.",
      });
      return;
    }
    
    setIsCreatingQuiz(true);
    
    try {
      const { data, error } = await createQuiz(
        params.id,
        newQuiz.question,
        newQuiz.choices,
        newQuiz.correctAnswerIndex,
        newQuiz.explanation
      );
      
      if (error) throw error;
      
      setQuizzes((prev) => [...prev, data]);
      setNewQuiz({
        question: "",
        choices: ["", "", "", ""],
        correctAnswerIndex: 0,
        explanation: "",
      });
      setIsQuizDialogOpen(false);
      
      // Update exam settings with new quiz ID
      if (data) {
        setExamSettings(prev => ({
          ...prev,
          quizIds: [...prev.quizIds, data.id]
        }));
      }
      
      toast({
        title: "Success",
        description: "Quiz created successfully.",
      });
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create quiz. Please try again.",
      });
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (examSettings.quizIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please create at least one quiz first.",
      });
      return;
    }
    
    setIsCreatingExam(true);
    
    try {
      const { data, error } = await createExam(
        params.id,
        examSettings.timeLimitMinutes,
        examSettings.quizIds
      );
      
      if (error) throw error;
      
      setIsExamDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Exam created successfully.",
      });
    } catch (error) {
      console.error("Error creating exam:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create exam. Please try again.",
      });
    } finally {
      setIsCreatingExam(false);
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
          <p className="text-muted-foreground mb-4">The lesson you are looking for does not exist or you do not have permission to view it.</p>
          <Button asChild>
            <Link href="/teacher/dashboard">Return to Dashboard</Link>
          </Button>
        </main>
      </div>
    );
  }

  const videoId = getYouTubeId(lesson.video_url);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav links={navLinks} />
      
      <main className="flex-1 py-6 container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
            <p className="text-muted-foreground">
              From class: <Link href={`/teacher/classes/${lesson.class_id}`} className="text-primary hover:underline">{lesson.classes.title}</Link>
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                  Add Quiz
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create a new quiz question</DialogTitle>
                  <DialogDescription>
                    Add a multiple-choice question for this lesson.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateQuiz}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="question">Question</Label>
                      <Textarea
                        id="question"
                        placeholder="e.g., What is the capital of France?"
                        value={newQuiz.question}
                        onChange={(e) => setNewQuiz({...newQuiz, question: e.target.value})}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Choices</Label>
                      {newQuiz.choices.map((choice, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder={`Choice ${index + 1}`}
                            value={choice}
                            onChange={(e) => {
                              const updatedChoices = [...newQuiz.choices];
                              updatedChoices[index] = e.target.value;
                              setNewQuiz({...newQuiz, choices: updatedChoices});
                            }}
                          />
                          <Button
                            type="button"
                            variant={newQuiz.correctAnswerIndex === index ? "default" : "outline"}
                            size="sm"
                            onClick={() => setNewQuiz({...newQuiz, correctAnswerIndex: index})}
                          >
                            {newQuiz.correctAnswerIndex === index ? "Correct" : "Mark Correct"}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="explanation">Explanation</Label>
                      <Textarea
                        id="explanation"
                        placeholder="Explain why the correct answer is right..."
                        value={newQuiz.explanation}
                        onChange={(e) => setNewQuiz({...newQuiz, explanation: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isCreatingQuiz}>
                      {isCreatingQuiz ? "Creating..." : "Create Quiz"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                    <path d="M12 8v4l3 3"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                  Create Exam
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a timed exam</DialogTitle>
                  <DialogDescription>
                    Set up an exam using the quiz questions you've created.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateExam}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                      <Input
                        id="time-limit"
                        type="number"
                        min="1"
                        value={examSettings.timeLimitMinutes}
                        onChange={(e) => setExamSettings({...examSettings, timeLimitMinutes: parseInt(e.target.value, 10)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quiz Questions</Label>
                      {isQuizzesLoading ? (
                        <p className="text-sm text-muted-foreground">Loading quizzes...</p>
                      ) : quizzes.length > 0 ? (
                        <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                          <p className="text-sm text-muted-foreground mb-2">All {quizzes.length} quiz questions will be included in this exam.</p>
                          <ol className="list-decimal pl-4 space-y-2">
                            {quizzes.map((quiz) => (
                              <li key={quiz.id} className="text-sm">
                                {quiz.question}
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No quizzes available. Create quizzes first.</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isCreatingExam || quizzes.length === 0}>
                      {isCreatingExam ? "Creating..." : "Create Exam"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
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
            
            <Card>
              <CardHeader>
                <CardTitle>Quiz Questions</CardTitle>
                <CardDescription>
                  Create and manage quiz questions for this lesson.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isQuizzesLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="border rounded-md p-4">
                        <Skeleton className="h-5 w-3/4 mb-3" />
                        <div className="ml-4 space-y-2">
                          {[1, 2, 3, 4].map((j) => (
                            <Skeleton key={j} className="h-4 w-2/3" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : quizzes.length > 0 ? (
                  <div className="space-y-4">
                    {quizzes.map((quiz, index) => (
                      <div key={quiz.id} className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Question {index + 1}: {quiz.question}</h3>
                        <div className="ml-4 space-y-2">
                          {quiz.choices.map((choice: string, choiceIndex: number) => (
                            <div key={choiceIndex} className="flex items-center gap-2">
                              <span className={choiceIndex === quiz.correct_answer_index ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                                {String.fromCharCode(65 + choiceIndex)}. {choice}
                                {choiceIndex === quiz.correct_answer_index && " (Correct)"}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          <span className="font-medium">Explanation:</span> {quiz.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">No quiz questions created yet</p>
                    <Button onClick={() => setIsQuizDialogOpen(true)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                        <path d="M5 12h14"></path>
                        <path d="M12 5v14"></path>
                      </svg>
                      Add Quiz Question
                    </Button>
                  </div>
                )}
              </CardContent>
              {quizzes.length > 0 && (
                <CardFooter>
                  <Button variant="outline" onClick={() => setIsQuizDialogOpen(true)} className="w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                      <path d="M5 12h14"></path>
                      <path d="M12 5v14"></path>
                    </svg>
                    Add Another Question
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exam Settings</CardTitle>
                <CardDescription>
                  Create a timed exam for this lesson
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Time Limit</Label>
                    <div className="flex items-center mt-1">
                      <Input
                        type="number"
                        min="1"
                        value={examSettings.timeLimitMinutes}
                        onChange={(e) => setExamSettings({...examSettings, timeLimitMinutes: parseInt(e.target.value, 10)})}
                        className="w-20 mr-2"
                      />
                      <span>minutes</span>
                    </div>
                  </div>
                  <div>
                    <Label>Quiz Questions</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {quizzes.length} question{quizzes.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => setIsExamDialogOpen(true)}
                  disabled={quizzes.length === 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                    <path d="M12 8v4l3 3"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                  Create Exam
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Lesson Analytics</CardTitle>
                <CardDescription>
                  Student performance statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-4 text-muted-foreground">
                  Analytics will be available in the next version.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}