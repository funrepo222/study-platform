"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getClassById, getLessons, getLeaderboard } from "@/lib/supabase/db";
import Link from "next/link";

export default function StudentClassPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [classData, setClassData] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLessonsLoading, setIsLessonsLoading] = useState(true);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
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

  useEffect(() => {
    const fetchClassData = async () => {
      if (params.id && user?.id) {
        try {
          setIsLoading(true);
          const { data, error } = await getClassById(params.id);
          
          if (error) throw error;
          
          setClassData(data);
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

    const fetchLeaderboard = async () => {
      if (params.id) {
        try {
          setIsLeaderboardLoading(true);
          const { data, error } = await getLeaderboard(params.id);
          
          if (error) throw error;
          
          setLeaderboard(data || []);
        } catch (error) {
          console.error("Error fetching leaderboard:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load leaderboard. Please try again.",
          });
        } finally {
          setIsLeaderboardLoading(false);
        }
      }
    };

    fetchClassData();
    fetchLessons();
    fetchLeaderboard();
  }, [params.id, user, toast]);

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
          <p className="text-muted-foreground mb-4">The class you are looking for does not exist or you are not enrolled in it.</p>
          <Button asChild>
            <Link href="/student/dashboard">Return to Dashboard</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav links={navLinks} />
      
      <main className="flex-1 py-6 container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{classData.title}</h1>
          <p className="text-muted-foreground">
            Teacher: {classData.users?.name} {classData.users?.surname}
          </p>
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
            <TabsTrigger value="leaderboard">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <path d="M16 22h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-4"></path>
                <path d="M12 17h4"></path>
                <path d="M12 12h4"></path>
                <path d="M12 7h4"></path>
                <path d="M2 22h10V2H2z"></path>
                <path d="M6 12v4"></path>
                <path d="M6 6v1"></path>
              </svg>
              Leaderboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="lessons">
            {isLessonsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map((lesson) => (
                  <Card key={lesson.id} className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle>{lesson.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted/50 rounded-md mb-4 overflow-hidden">
                        {/* YouTube thumbnail preview */}
                        {lesson.video_url && lesson.video_url.includes('youtube.com') && (
                          <img 
                            src={`https://img.youtube.com/vi/${getYouTubeId(lesson.video_url)}/mqdefault.jpg`}
                            alt={lesson.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{lesson.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link href={`/student/lessons/${lesson.id}`}>
                          Start Lesson
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No lessons available</CardTitle>
                  <CardDescription>
                    There are no lessons in this class yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-4 text-muted-foreground">
                    Your teacher hasn't added any lessons to this class yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle>Class Leaderboard</CardTitle>
                <CardDescription>
                  Top students based on exam performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLeaderboardLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-1/3 mb-2" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-6 w-12" />
                      </div>
                    ))}
                  </div>
                ) : leaderboard.length > 0 ? (
                  <div className="space-y-4">
                    {leaderboard.map((entry, index) => (
                      <div key={entry.user_id} className="flex items-center gap-4">
                        <div className={`flex items-center justify-center h-10 w-10 rounded-full text-white font-semibold ${
                          index === 0 ? "bg-yellow-500" : 
                          index === 1 ? "bg-gray-400" : 
                          index === 2 ? "bg-amber-700" : "bg-muted"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{entry.name} {entry.surname}</p>
                          <p className="text-sm text-muted-foreground">Student</p>
                        </div>
                        <div className="font-semibold">
                          {entry.total_score} pts
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">
                    No exam results have been recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Helper function to extract YouTube video ID
function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}