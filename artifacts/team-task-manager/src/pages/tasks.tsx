import { useQueries } from "@tanstack/react-query";
import { useListProjects, getListTasksQueryKey, listTasks } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User, FolderKanban, CheckSquare2, Circle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: "todo" | "in-progress" | "done";
  projectId: number;
  assignedToId?: number | null;
  assignedTo?: { id: number; name: string; email: string; role: string } | null;
  dueDate?: string | null;
  createdAt: string;
};

const STATUS_CONFIG = {
  todo: { label: "To Do", icon: Circle, className: "bg-muted text-muted-foreground" },
  "in-progress": { label: "In Progress", icon: Loader2, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  done: { label: "Done", icon: CheckSquare2, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

export default function Tasks() {
  const { user, isAdmin } = useAuth();
  const { data: projects, isLoading: projectsLoading } = useListProjects();

  const taskQueries = useQueries({
    queries: (projects ?? []).map((project) => ({
      queryKey: getListTasksQueryKey(project.id),
      queryFn: () => listTasks(project.id),
      enabled: !!projects,
    })),
  });

  const isLoading = projectsLoading || taskQueries.some((q) => q.isLoading);

  const allTasks: (Task & { projectName: string })[] = [];
  (projects ?? []).forEach((project, i) => {
    const data = taskQueries[i]?.data ?? [];
    data.forEach((task) => {
      if (isAdmin || task.assignedToId === user?.id) {
        allTasks.push({ ...task, projectName: project.name });
      }
    });
  });

  allTasks.sort((a, b) => {
    const order = { "in-progress": 0, todo: 1, done: 2 };
    return order[a.status] - order[b.status];
  });

  const todoTasks = allTasks.filter((t) => t.status === "todo");
  const inProgressTasks = allTasks.filter((t) => t.status === "in-progress");
  const doneTasks = allTasks.filter((t) => t.status === "done");

  const today = new Date().toISOString().split("T")[0];
  const isOverdue = (task: Task) =>
    task.dueDate && task.dueDate < today && task.status !== "done";

  function TaskCard({ task }: { task: Task & { projectName: string } }) {
    const cfg = STATUS_CONFIG[task.status];
    const StatusIcon = cfg.icon;
    const overdue = isOverdue(task);

    return (
      <Card className={`border-border transition-colors ${overdue ? "border-destructive/40 bg-destructive/5" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm truncate">{task.title}</h3>
                {overdue && (
                  <span className="text-xs font-medium text-destructive shrink-0">Overdue</span>
                )}
              </div>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <Link href={`/projects/${task.projectId}`}>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <FolderKanban size={11} />
                    {task.projectName}
                  </span>
                </Link>
                {task.assignedTo && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <User size={11} />
                    {task.assignedTo.name}
                  </span>
                )}
                {task.dueDate && (
                  <span className={`inline-flex items-center gap-1 text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                    <Clock size={11} />
                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
            <Badge className={`shrink-0 text-xs font-medium border-0 ${cfg.className}`}>
              <StatusIcon size={11} className="mr-1" />
              {cfg.label}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  function TaskGroup({ title, tasks, count }: { title: string; tasks: (Task & { projectName: string })[]; count: number }) {
    if (tasks.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
          <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{count}</span>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAdmin ? "All tasks across every project" : "Tasks assigned to you"}
            </p>
          </div>
          {!isLoading && (
            <div className="text-right">
              <div className="text-2xl font-bold">{allTasks.length}</div>
              <div className="text-xs text-muted-foreground">total tasks</div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : allTasks.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <CheckSquare2 size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No tasks found</p>
            <p className="text-sm mt-1">
              {isAdmin ? "Create a project and add tasks to get started." : "You have no tasks assigned to you yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <TaskGroup title="In Progress" tasks={inProgressTasks} count={inProgressTasks.length} />
            <TaskGroup title="To Do" tasks={todoTasks} count={todoTasks.length} />
            <TaskGroup title="Done" tasks={doneTasks} count={doneTasks.length} />
          </div>
        )}
      </div>
    </Layout>
  );
}
