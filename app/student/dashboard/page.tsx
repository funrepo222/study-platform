"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getStudentEnrollments, getClasses, enrollStudent } from "@/lib/supabase/db";
import Link from "next/link";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [classCode, setClassCode] = useState("");
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
    const fetchData = async () => {
      if (user?.id) {
        try {
          setIsLoading(true);
          
          // Fetch enrollments
          const { data: enrollmentData, error: enrollmentError } = await getStudentEnrollments(user.id);
          
          if (enrollmentError) throw enrollmentError;
          
          setEnrollments(enrollmentData || []);
          
          // Fetch available classes (for demonstration)
          const { data: classData, error: classError } = await getClasses();
          
          if (classError) throw classError;
          
          // Filter out classes the student is already enrolled in
          const enrolledClassIds = enrollmentData ? enrollmentData.map((e: any) => e.classes.id) : [];
          const available = classData ? classData.filter((c: any) => !enrolledClassIds.includes(c.id)) : [];
          
          setAvailableClasses(available);
        } catch (error) {
          console.error("Error fetching data:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load data. Please try again.",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [user, toast]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a class code.",
      });
      return;
    }
    
    setIsEnrolling(true);
    
    try {
      // For demo, let's just use the class ID directly
      if (!user?.id) throw new Error("User not found");
      
      const { data, error } = await enrollStudent(classCode, user.id);
      
      if (error) throw error;
      
      // Refresh enrollments
      const { data: enrollmentData } = await getStudentEnrollments(user.id);
      setEnrollments(enrollmentData || []);
      
      // Update available classes
      const enrolledClassIds = enrollmentData ? enrollmentData.map((e: any) => e.classes.id) : [];
      setAvailableClasses(prev => prev.filter(c => !enrolledClassIds.includes(c.id)));
      
      setClassCode("");
      setIsClassDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Enrolled in class successfully.",
      });
    } catch (error) {
      console.error("Error enrolling:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to enroll in class. Please check your class code and try again.",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav links={navLinks} />
      
      <main className="flex-1 py-6 container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
          <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                Join Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a class</DialogTitle>
                <DialogDescription>
                  Enter the class code provided by your teacher.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEnroll}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="class-code">Class Code</Label>
                    <Input
                      id="class-code"
                      placeholder="Enter class code"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Available Classes (Demo)</h4>
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                      {availableClasses.map(cls => (
                        <div 
                          key={cls.id} 
                          className="p-2 hover:bg-muted rounded-md cursor-pointer mb-1 text-sm"
                          onClick={() => setClassCode(cls.id)}
                        >
                          <div className="font-medium">{cls.title}</div>
                          <div className="text-xs text-muted-foreground">
                            ID: {cls.id}
                          </div>
                        </div>
                      ))}
                      {availableClasses.length === 0 && (
                        <p className="text-sm text-muted-foreground p-2">No available classes</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click on a class to use its ID as the class code (for demo purposes)
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isEnrolling}>
                    {isEnrolling ? "Joining..." : "Join Class"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">My Classes</h2>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : enrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle>{enrollment.classes.title}</CardTitle>
                      <CardDescription>
                        Teacher: {enrollment.classes.users.name} {enrollment.classes.users.surname}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-24 flex items-center justify-center bg-muted/50 rounded-md mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-muted-foreground">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link href={`/student/classes/${enrollment.classes.id}`}>
                          View Class
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No enrollments found</CardTitle>
                  <CardDescription>
                    You haven't joined any classes yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-4 text-muted-foreground">
                    Get started by joining your first class
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => setIsClassDialogOpen(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                      <path d="M5 12h14"></path>
                      <path d="M12 5v14"></path>
                    </svg>
                    Join Class
                  </Button>
                </CardFooter>
              </Card>
            )}
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>
                  Your recent learning activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-4 text-muted-foreground">
                  Activity tracking will be available in the next version.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}