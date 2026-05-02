import { useGetDashboardStats } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, CheckSquare2, Clock, ListTodo, TrendingUp, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth";

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  accent?: "destructive" | "primary" | "muted";
}) {
  const colorMap = {
    destructive: "text-destructive",
    primary: "text-primary",
    muted: "text-muted-foreground",
  };
  const textColor = accent ? colorMap[accent] : "text-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`w-4 h-4 ${accent ? colorMap[accent] : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${textColor}`}>{value ?? 0}</div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-bold">{value}</span>
          <span className="text-muted-foreground text-xs">({pct}%)</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { data: stats, isLoading } = useGetDashboardStats();

  const totalTasks = stats?.totalTasks ?? 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 max-w-6xl mx-auto w-full">
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-72 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-52 rounded-xl" />
            <Skeleton className="h-52 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, <span className="font-medium text-foreground">{user?.name}</span>
            {isAdmin && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Admin</span>}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Projects" value={stats?.totalProjects} icon={FolderKanban} />
          <StatCard title="Total Tasks" value={stats?.totalTasks} icon={CheckSquare2} />
          <StatCard title="My Tasks" value={stats?.myTasks} icon={ListTodo} accent="primary" />
          <StatCard title="Overdue" value={stats?.overdueTasks} icon={AlertTriangle} accent="destructive" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={18} />
                Task Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <ProgressBar
                label="To Do"
                value={stats?.tasksByStatus?.todo ?? 0}
                total={totalTasks}
                colorClass="bg-muted-foreground/50"
              />
              <ProgressBar
                label="In Progress"
                value={stats?.tasksByStatus?.["in-progress"] ?? 0}
                total={totalTasks}
                colorClass="bg-amber-500"
              />
              <ProgressBar
                label="Done"
                value={stats?.tasksByStatus?.done ?? 0}
                total={totalTasks}
                colorClass="bg-primary"
              />
              {totalTasks === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks yet. Create a project and add tasks to get started.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={18} />
                At a Glance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FolderKanban size={16} className="text-muted-foreground" />
                  Active Projects
                </div>
                <span className="font-bold text-lg">{stats?.totalProjects ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ListTodo size={16} className="text-primary" />
                  Assigned to Me
                </div>
                <span className="font-bold text-lg text-primary">{stats?.myTasks ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckSquare2 size={16} className="text-emerald-600" />
                  Completed
                </div>
                <span className="font-bold text-lg text-emerald-600">{stats?.tasksByStatus?.done ?? 0}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle size={16} className="text-destructive" />
                  Overdue
                </div>
                <span className={`font-bold text-lg ${(stats?.overdueTasks ?? 0) > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {stats?.overdueTasks ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
