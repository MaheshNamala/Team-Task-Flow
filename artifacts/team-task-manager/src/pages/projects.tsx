import { useState } from "react";
import { Link } from "wouter";
import { useListProjects, useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, CheckSquare, Plus } from "lucide-react";

export default function Projects() {
  const { isAdmin } = useAuth();
  const { data: projects, isLoading } = useListProjects();
  const queryClient = useQueryClient();
  const createProject = useCreateProject();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate(
      { data: { name, description } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setIsOpen(false);
          setName("");
          setDescription("");
        },
      }
    );
  };

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          {isAdmin && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button><Plus size={16} className="mr-2" /> New Project</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={createProject.isPending} className="w-full">
                    {createProject.isPending ? "Creating..." : "Create"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted rounded-t-xl" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        {project.memberCount} members
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare size={16} />
                        {project.taskCount} tasks
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {projects?.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                No projects found.
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
