import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const users = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable);

  res.json(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

export default router;
