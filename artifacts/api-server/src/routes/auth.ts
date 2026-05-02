import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SignupBody, LoginBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/signup", async (req, res) => {
  const parse = SignupBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.message });
    return;
  }
  const { email, password, name, role } = parse.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, name, role: role ?? "member" })
    .returning();

  req.session.userId = user.id;
  req.session.userRole = user.role;

  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() },
    message: "Account created successfully",
  });
});

router.post("/login", async (req, res) => {
  const parse = LoginBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.message });
    return;
  }
  const { email, password } = parse.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;
  req.session.userRole = user.role;

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() },
    message: "Logged in successfully",
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() });
});

export default router;
