import { Router } from "express";
import { db, tasksTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateTaskBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.put("/:taskId", requireAuth, async (req, res) => {
  const taskId = Number(req.params.taskId);
  const parse = UpdateTaskBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.message });
    return;
  }
  const updates = parse.data;
  const [task] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, taskId)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  let assignedTo = null;
  if (task.assignedToId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, task.assignedToId)).limit(1);
    if (user) assignedTo = { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt.toISOString() };
  }

  res.json({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    projectId: task.projectId,
    assignedToId: task.assignedToId,
    dueDate: task.dueDate,
    createdAt: task.createdAt.toISOString(),
    assignedTo,
  });
});

router.delete("/:taskId", requireAuth, async (req, res) => {
  const taskId = Number(req.params.taskId);
  await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
  res.json({ message: "Task deleted" });
});

export default router;
