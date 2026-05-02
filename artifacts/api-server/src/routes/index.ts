import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import projectsRouter from "./projects.js";
import tasksRouter from "./tasks.js";
import taskByIdRouter from "./taskById.js";
import dashboardRouter from "./dashboard.js";
import usersRouter from "./users.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/projects", projectsRouter);
router.use("/projects/:projectId/tasks", tasksRouter);
router.use("/tasks", taskByIdRouter);
router.use("/dashboard", dashboardRouter);
router.use("/users", usersRouter);

export default router;
