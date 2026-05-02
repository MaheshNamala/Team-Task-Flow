import { useGetDashboardStats } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, CheckSquare, Clock, ListTodo } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
              <FolderKanban className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalProjects || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Tasks</CardTitle>
              <ListTodo className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.myTasks || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
              <CheckSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalTasks || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle>
              <Clock className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats?.overdueTasks || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">To Do</span>
                <span className="font-bold">{stats?.tasksByStatus?.todo || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-accent">In Progress</span>
                <span className="font-bold text-accent">{stats?.tasksByStatus?.['in-progress'] || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-primary">Done</span>
                <span className="font-bold text-primary">{stats?.tasksByStatus?.done || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
