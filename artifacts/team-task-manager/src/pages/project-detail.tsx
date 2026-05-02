import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetProject, 
  useUpdateProject, 
  useDeleteProject,
  useAddProjectMember,
  useRemoveProjectMember,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useListUsers,
  getGetProjectQueryKey,
  getListProjectsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Users, Trash2, Plus, UserMinus, Clock } from "lucide-react";
import { CreateTaskBodyStatus, UpdateTaskBodyStatus } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function ProjectDetail() {
  const params = useParams();
  const projectId = Number(params.id);
  const [, setLocation] = useLocation();
  const { isAdmin, user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  const { data: allUsers } = useListUsers({ query: { enabled: isAdmin } });
  
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState<string>("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [memberToAdd, setMemberToAdd] = useState<string>("");

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 max-w-6xl mx-auto w-full">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="col-span-2 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="p-8 text-center text-muted-foreground">Project not found</div>
      </Layout>
    );
  }

  const handleDeleteProject = () => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject.mutate(
        { projectId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
            setLocation("/projects");
          },
          onError: (error) => {
            toast({ title: "Failed to delete", description: error.error || "An error occurred", variant: "destructive" });
          }
        }
      );
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    createTask.mutate(
      { 
        data: { 
          title: taskTitle, 
          description: taskDescription || undefined, 
          assignedToId: taskAssignedTo ? Number(taskAssignedTo) : undefined,
          dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
          status: CreateTaskBodyStatus.todo
        },
        projectId
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          setIsTaskDialogOpen(false);
          setTaskTitle("");
          setTaskDescription("");
          setTaskAssignedTo("");
          setTaskDueDate("");
        }
      }
    );
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToAdd) return;
    addMember.mutate(
      { projectId, data: { userId: Number(memberToAdd) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          setIsMemberDialogOpen(false);
          setMemberToAdd("");
        },
        onError: (error) => toast({ title: "Failed to add member", description: error.error || "An error occurred", variant: "destructive" })
      }
    );
  };

  const handleRemoveMember = (userId: number) => {
    removeMember.mutate(
      { projectId, userId },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }),
        onError: (error) => toast({ title: "Failed to remove member", description: error.error || "An error occurred", variant: "destructive" })
      }
    );
  };

  const handleStatusChange = (taskId: number, newStatus: UpdateTaskBodyStatus) => {
    updateTask.mutate(
      { taskId, data: { status: newStatus } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }),
        onError: (error) => toast({ title: "Failed to update task", description: error.error || "An error occurred", variant: "destructive" })
      }
    );
  };

  const handleDeleteTask = (taskId: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask.mutate(
        { taskId },
        {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }),
          onError: (error) => toast({ title: "Failed to delete task", description: error.error || "An error occurred", variant: "destructive" })
        }
      );
    }
  };

  const availableUsers = allUsers?.filter(u => !project.members.find(m => m.id === u.id)) || [];

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{project.name}</h1>
            {project.description && <p className="text-muted-foreground">{project.description}</p>}
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              <Button variant="destructive" onClick={handleDeleteProject} disabled={deleteProject.isPending}>
                <Trash2 size={16} className="mr-2" /> Delete Project
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckSquare size={20} /> Tasks
              </h2>
              {isAdmin && (
                <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus size={16} className="mr-2" /> Add Task</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Task</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Assignee</Label>
                        <Select onValueChange={setTaskAssignedTo} value={taskAssignedTo}>
                          <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {project.members.map(member => (
                              <SelectItem key={member.id} value={member.id.toString()}>{member.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                      </div>
                      <Button type="submit" disabled={createTask.isPending} className="w-full">
                        {createTask.isPending ? "Creating..." : "Create"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-4">
              {project.tasks.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  No tasks in this project yet.
                </div>
              ) : (
                project.tasks.map(task => (
                  <Card key={task.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-start">
                        <div className="space-y-2 flex-1">
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2">
                            {task.assignedTo && (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/50">
                                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                                  {task.assignedTo.name.charAt(0).toUpperCase()}
                                </div>
                                {task.assignedTo.name}
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/50">
                                <Clock size={12} />
                                {format(new Date(task.dueDate), "MMM d, yyyy")}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <Select 
                            value={task.status} 
                            onValueChange={(val) => handleStatusChange(task.id, val as UpdateTaskBodyStatus)}
                            disabled={!isAdmin && task.assignedToId !== currentUser?.id}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users size={20} /> Members
              </h2>
              {isAdmin && (
                <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Plus size={16} className="mr-2" /> Add</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Project Member</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddMember} className="space-y-4">
                      <div className="space-y-2">
                        <Label>User</Label>
                        <Select onValueChange={setMemberToAdd} value={memberToAdd}>
                          <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                          <SelectContent>
                            {availableUsers.map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>
                            ))}
                            {availableUsers.length === 0 && (
                              <SelectItem value="none" disabled>No users available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" disabled={!memberToAdd || addMember.isPending} className="w-full">
                        {addMember.isPending ? "Adding..." : "Add Member"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {project.members.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No members added yet.
                  </div>
                ) : (
                  project.members.map(member => (
                    <div key={member.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{member.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                        </div>
                      </div>
                      {isAdmin && project.createdById !== member.id && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <UserMinus size={14} />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
