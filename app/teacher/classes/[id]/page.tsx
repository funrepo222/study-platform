"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getClassById, getLessons, createLesson } from "@/lib/supabase/db";
import Link from "next/link";

export default function ClassPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [classData, setClassData] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLessonsLoading, setIsLessonsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: "",
    videoUrl: "",
    description: "",
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

  useEffect(() => {
    const fetchClassData = async () => {
      if (params.id && user?.id) {
        try {
          setIsLoading(true);
          const { data, error } = await getClassById(params.id);
          
          if (error) throw error;
          
          setClassData(data);
          
          // Check if the class belongs to the current teacher
          if (data.teacher_id !== user.id) {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You do not have permission to view this class.",
            });
          }
        } catch (error) {
          console.error("Error fetching class:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load class data. Please try again.",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    const fetchLessons = async () => {
      if (params.id) {
        try {
          setIsLessonsLoading(true);
          const { data, error } = await getLessons(params.id);
          
          if (error) throw error;
          
          setLessons(data || []);
        } catch (error) {
          console.error("Error fetching lessons:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load lessons. Please try again.",
          });
        } finally {
          setIsLessonsLoading(false);
        }
      }
    };

    fetchClassData();
    fetchLessons();
  }, [params.id, user, toast]);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newLesson.title.trim() || !newLesson.videoUrl.trim() || !newLesson.description.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields.",
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const { data, error } = await createLesson(
        params.id,
        newLesson.title,
        newLesson.videoUrl,
        newLesson.description
      );
      
      if (error) throw error;
      
      setLessons((prev) => [...prev, data]);
      setNewLesson({
        title: "",
        videoUrl: "",
        description: "",
      });
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Lesson created successfully.",
      });
    } catch (error) {
      console.error("Error creating lesson:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create lesson. Please try again.",
      });
    } finally {
      setIsCreating(false);
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

  if (!classData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav links={navLinks} />
        <main className="flex-1 py-6 container mx-auto px-4">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Class Not Found</h1>
          <p className="text-muted-foreground mb-4">The class you are looking for does not exist or you do not have permission to view it.</p>
          <Button asChild>
            <Link href="/teacher/dashboard">Return to Dashboard</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav links={navLinks} />
      
      <main className="flex-1 py-6 container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{classData.title}</h1>
            <p className="text-muted-foreground">Manage your class content and students</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new lesson</DialogTitle>
                <DialogDescription>
                  Create a new lesson with a video and description.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateLesson}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="lesson-title">Lesson Title</Label>
                    <Input
                      id="lesson-title"
                      placeholder="e.g., Introduction to Variables"
                      value={newLesson.title}
                      onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video-url">YouTube Video URL</Label>
                    <Input
                      id="video-url"
                      placeholder="e.g., https://www.youtube.com/watch?v=..."
                      value={newLesson.videoUrl}
                      onChange={(e) => setNewLesson({...newLesson, videoUrl: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what students will learn in this lesson"
                      value={newLesson.description}
                      onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Lesson"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs defaultValue="lessons">
          <TabsList className="mb-6">
            <TabsTrigger value="lessons">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="m9 8 6 4-6 4Z"></path>
              </svg>
              Lessons
            </TabsTrigger>
            <TabsTrigger value="students">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Students
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="lessons">
            {isLessonsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-2/3" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : lessons.length > 0 ? (
              <div className="space-y-4">
                {lessons.map((lesson) => (
                  <Card key={lesson.id} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle>{lesson.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-muted-foreground">{lesson.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link href={`/teacher/lessons/${lesson.id}`}>
                          Manage Lesson
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No lessons found</CardTitle>
                  <CardDescription>
                    You haven't created any lessons for this class yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-4 text-muted-foreground">
                    Get started by adding your first lesson
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                      <path d="M5 12h14"></path>
                      <path d="M12 5v14"></path>
                    </svg>
                    Add Lesson
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>
                  View and manage students enrolled in this class.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-4 text-muted-foreground">
                  Student management features will be implemented in the next version.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}