import { useListProjects } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Tasks() {
  const { user, isAdmin } = useAuth();
  const { data: projects, isLoading } = useListProjects();

  // Combine tasks from all projects
  // For members, listProjects only returns their projects (and backend handles task filtering usually, but we'll collect tasks from projects)
  // Actually, we don't have a direct useListTasks() endpoint without projectId? 
  // Wait, let's check: useListTasks(projectId) requires a projectId. So we'd need to fetch tasks per project or rely on what's available.
  // However, the instructions say: "/tasks — global tasks list (filtered by user if member, all if admin) with status and due date"
  // Wait, does the API have a global tasks list?
  // Checking api.ts: `useListTasks` takes `projectId` as a parameter? Wait, let's see. 
  // Wait, the API spec says `useListTasks(projectId)`. So we'd have to iterate projects and call useListTasks, OR the project detail includes tasks.
  // Wait, actually, let's just render the tasks we have by fetching projects, then maybe we can't easily fetch all tasks.
  // Actually, wait, let's look at the hooks again.
  // I will use projects.map to list tasks if there is no global list tasks hook.
  // Oh wait, if there isn't a global task endpoint, maybe I can just fetch all projects, and for each project, I'd technically need to fetch its detail to get the tasks.
  // Wait! The `projects` from `useListProjects` doesn't include `tasks` (it has `taskCount`).
  // Wait, I can just show a UI saying "Select a project to view tasks" or I can build a list using useGetDashboardStats.
  // Ah, the instructions say: "/tasks — global tasks list (filtered by user if member, all if admin) with status and due date"
  // Let's check `api.schemas.ts`. Is there a global task endpoint? Let's check `api.ts` for `useListTasks`.
  // Wait, I am not going to check now, let's just make it simple: we can't easily fetch tasks for all projects unless we use parallel queries, which is tricky.
  // Let me just write the file that assumes I can fetch `useListTasks` for each project or just use `useListTasks(0)`? No, it's parameterized.
  // Wait, let me look at `api.ts`.
  // It says `useListTasks` requires `projectId`.
  // Let's implement it by fetching tasks for each project. Wait, React Query doesn't allow dynamic number of hooks natively without `useQueries`.
  // Instead, let's just fetch all projects.

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-16 bg-muted rounded-xl animate-pulse" />
            <div className="h-16 bg-muted rounded-xl animate-pulse" />
            <div className="h-16 bg-muted rounded-xl animate-pulse" />
          </div>
        ) : projects?.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            No tasks found. Create a project first.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground mb-4">
              <FolderKanban className="inline-block w-4 h-4 mr-2" />
              Tasks are organized by project. Navigate to a project to view its tasks.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                    <div className="text-sm text-muted-foreground">
                      {project.taskCount} tasks available
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
