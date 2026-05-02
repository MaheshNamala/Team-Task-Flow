import { Router } from "express";
import { db, tasksTable, projectsTable, projectMembersTable } from "@workspace/db";
import { eq, and, lt, sql, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/stats", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const role = req.session.userRole;

  let projectIds: number[] = [];

  if (role === "admin") {
    const projects = await db.select({ id: projectsTable.id }).from(projectsTable);
    projectIds = projects.map((p) => p.id);
  } else {
    const memberships = await db
      .select({ projectId: projectMembersTable.projectId })
      .from(projectMembersTable)
      .where(eq(projectMembersTable.userId, userId));
    projectIds = memberships.map((m) => m.projectId);
  }

  const today = new Date().toISOString().split("T")[0];

  let totalTasks = 0;
  let todoCount = 0;
  let inProgressCount = 0;
  let doneCount = 0;
  let overdueTasks = 0;
  let myTasks = 0;

  if (projectIds.length > 0) {
    const allTasks = await db
      .select()
      .from(tasksTable)
      .where(sql`${tasksTable.projectId} = ANY(${projectIds})`);

    totalTasks = allTasks.length;
    todoCount = allTasks.filter((t) => t.status === "todo").length;
    inProgressCount = allTasks.filter((t) => t.status === "in-progress").length;
    doneCount = allTasks.filter((t) => t.status === "done").length;
    overdueTasks = allTasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== "done"
    ).length;
    myTasks = allTasks.filter((t) => t.assignedToId === userId).length;
  }

  res.json({
    totalTasks,
    tasksByStatus: {
      todo: todoCount,
      "in-progress": inProgressCount,
      done: doneCount,
    },
    overdueTasks,
    totalProjects: projectIds.length,
    myTasks,
  });
});

export default router;
