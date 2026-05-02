import { Router } from "express";
import { db, tasksTable, usersTable, projectMembersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateTaskBody, UpdateTaskBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req, res) => {
  const projectId = Number(req.params.projectId);
  const tasks = await db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      status: tasksTable.status,
      projectId: tasksTable.projectId,
      assignedToId: tasksTable.assignedToId,
      dueDate: tasksTable.dueDate,
      createdAt: tasksTable.createdAt,
      assigneeName: usersTable.name,
      assigneeEmail: usersTable.email,
      assigneeRole: usersTable.role,
    })
    .from(tasksTable)
    .leftJoin(usersTable, eq(tasksTable.assignedToId, usersTable.id))
    .where(eq(tasksTable.projectId, projectId));

  res.json(
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      projectId: t.projectId,
      assignedToId: t.assignedToId,
      dueDate: t.dueDate,
      createdAt: t.createdAt.toISOString(),
      assignedTo: t.assignedToId
        ? { id: t.assignedToId, name: t.assigneeName, email: t.assigneeEmail, role: t.assigneeRole, createdAt: "" }
        : null,
    }))
  );
});

router.post("/", requireAuth, async (req, res) => {
  const projectId = Number(req.params.projectId);
  const parse = CreateTaskBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.message });
    return;
  }
  const { title, description, assignedToId, dueDate, status } = parse.data;
  const [task] = await db
    .insert(tasksTable)
    .values({ title, description, assignedToId, dueDate, status: status ?? "todo", projectId })
    .returning();

  let assignedTo = null;
  if (task.assignedToId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, task.assignedToId)).limit(1);
    if (user) assignedTo = { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt.toISOString() };
  }

  res.status(201).json({
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

export default router;
