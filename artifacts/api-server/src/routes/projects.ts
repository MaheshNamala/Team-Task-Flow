import { Router } from "express";
import { db, projectsTable, projectMembersTable, usersTable, tasksTable } from "@workspace/db";
import { eq, and, count, sql } from "drizzle-orm";
import { CreateProjectBody, UpdateProjectBody, AddProjectMemberBody } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const role = req.session.userRole;

  let projectRows: typeof projectsTable.$inferSelect[];

  if (role === "admin") {
    projectRows = await db.select().from(projectsTable);
  } else {
    const memberships = await db
      .select({ projectId: projectMembersTable.projectId })
      .from(projectMembersTable)
      .where(eq(projectMembersTable.userId, userId));
    const ids = memberships.map((m) => m.projectId);
    if (ids.length === 0) {
      res.json([]);
      return;
    }
    projectRows = await db
      .select()
      .from(projectsTable)
      .where(sql`${projectsTable.id} = ANY(${ids})`);
  }

  const result = await Promise.all(
    projectRows.map(async (p) => {
      const [{ memberCount }] = await db
        .select({ memberCount: count() })
        .from(projectMembersTable)
        .where(eq(projectMembersTable.projectId, p.id));
      const [{ taskCount }] = await db
        .select({ taskCount: count() })
        .from(tasksTable)
        .where(eq(tasksTable.projectId, p.id));
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        createdById: p.createdById,
        createdAt: p.createdAt.toISOString(),
        memberCount: Number(memberCount),
        taskCount: Number(taskCount),
      };
    })
  );

  res.json(result);
});

router.post("/", requireAdmin, async (req, res) => {
  const parse = CreateProjectBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.message });
    return;
  }
  const { name, description } = parse.data;
  const [project] = await db
    .insert(projectsTable)
    .values({ name, description, createdById: req.session.userId! })
    .returning();

  await db.insert(projectMembersTable).values({ projectId: project.id, userId: req.session.userId! });

  res.status(201).json({
    id: project.id,
    name: project.name,
    description: project.description,
    createdById: project.createdById,
    createdAt: project.createdAt.toISOString(),
    memberCount: 1,
    taskCount: 0,
  });
});

router.get("/:projectId", requireAuth, async (req, res) => {
  const projectId = Number(req.params.projectId);
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId)).limit(1);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const members = await db
    .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(projectMembersTable)
    .innerJoin(usersTable, eq(projectMembersTable.userId, usersTable.id))
    .where(eq(projectMembersTable.projectId, projectId));

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

  res.json({
    id: project.id,
    name: project.name,
    description: project.description,
    createdById: project.createdById,
    createdAt: project.createdAt.toISOString(),
    members: members.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    tasks: tasks.map((t) => ({
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
    })),
  });
});

router.put("/:projectId", requireAdmin, async (req, res) => {
  const projectId = Number(req.params.projectId);
  const parse = UpdateProjectBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.message });
    return;
  }
  const updates = parse.data;
  const [project] = await db
    .update(projectsTable)
    .set(updates)
    .where(eq(projectsTable.id, projectId))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const [{ memberCount }] = await db.select({ memberCount: count() }).from(projectMembersTable).where(eq(projectMembersTable.projectId, projectId));
  const [{ taskCount }] = await db.select({ taskCount: count() }).from(tasksTable).where(eq(tasksTable.projectId, projectId));
  res.json({
    id: project.id, name: project.name, description: project.description,
    createdById: project.createdById, createdAt: project.createdAt.toISOString(),
    memberCount: Number(memberCount), taskCount: Number(taskCount),
  });
});

router.delete("/:projectId", requireAdmin, async (req, res) => {
  const projectId = Number(req.params.projectId);
  await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
  res.json({ message: "Project deleted" });
});

router.post("/:projectId/members", requireAdmin, async (req, res) => {
  const projectId = Number(req.params.projectId);
  const parse = AddProjectMemberBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.message });
    return;
  }
  const { userId } = parse.data;
  const existing = await db
    .select()
    .from(projectMembersTable)
    .where(and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, userId)))
    .limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "User is already a member" });
    return;
  }
  await db.insert(projectMembersTable).values({ projectId, userId });
  res.status(201).json({ message: "Member added" });
});

router.delete("/:projectId/members/:userId", requireAdmin, async (req, res) => {
  const projectId = Number(req.params.projectId);
  const userId = Number(req.params.userId);
  await db
    .delete(projectMembersTable)
    .where(and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, userId)));
  res.json({ message: "Member removed" });
});

export default router;
