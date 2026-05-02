# Team Task Manager

A production-ready full-stack web application for managing projects and tasks with role-based access control (Admin/Member).

## Live Demo

> Deployed on Replit — see the published URL in your Replit project dashboard.

**Demo Credentials:**

| Role   | Email                  | Password    |
|--------|------------------------|-------------|
| Admin  | admin@example.com      | admin123    |
| Member | member@example.com     | member123   |

---

## Features

### Authentication
- Email & password signup and login
- Session-based authentication (stored in PostgreSQL)
- Secure password hashing with bcrypt
- Protected routes — unauthenticated users redirected to login

### Role-Based Access Control
- **Admin**: Full access — create/edit/delete projects, manage members, create/delete tasks
- **Member**: View assigned projects, update task status on assigned tasks

### Project Management
- Create, edit, and delete projects (Admin only)
- Add and remove team members per project (Admin only)
- View all your projects with member count and task count

### Task Management
- Create tasks within projects (Admin only)
- Assign tasks to project members
- Set status: `todo` → `in-progress` → `done`
- Due date support with overdue detection
- Members can update status of their own assigned tasks

### Dashboard
- Total projects and tasks overview
- Task breakdown by status (To Do / In Progress / Done) with visual progress bars
- Overdue task count highlighted in red
- "My Tasks" count showing tasks assigned to the logged-in user

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| TypeScript | Type safety |
| TanStack Query | Server state & data fetching |
| Wouter | Client-side routing |
| Tailwind CSS | Styling |
| shadcn/ui + Radix UI | UI components |
| React Hook Form + Zod | Form validation |
| date-fns | Date formatting |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express 5 | HTTP server |
| TypeScript | Type safety |
| PostgreSQL | Primary database |
| Drizzle ORM | Database queries & schema |
| express-session | Session management |
| connect-pg-simple | PostgreSQL session store |
| bcryptjs | Password hashing |
| Zod | Input validation |
| Pino | Structured logging |

### API Design
- REST API with proper route separation
- Contract-first with OpenAPI spec → codegen (Orval)
- Generated React Query hooks for type-safe API calls
- Generated Zod schemas for server-side validation

---

## Database Schema

```
users
  id, email, password_hash, name, role (admin|member), created_at

projects
  id, name, description, created_by_id → users.id, created_at

project_members
  id, project_id → projects.id, user_id → users.id, joined_at

tasks
  id, title, description, status (todo|in-progress|done),
  project_id → projects.id, assigned_to_id → users.id,
  due_date, created_at

session
  sid, sess, expire  (connect-pg-simple managed)
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/signup` | Register new user | Public |
| POST | `/api/auth/login` | Login | Public |
| POST | `/api/auth/logout` | Logout | Auth |
| GET | `/api/auth/me` | Get current user | Auth |

### Projects
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/projects` | List accessible projects | Auth |
| POST | `/api/projects` | Create project | Admin |
| GET | `/api/projects/:id` | Get project details | Auth |
| PUT | `/api/projects/:id` | Update project | Admin |
| DELETE | `/api/projects/:id` | Delete project | Admin |
| POST | `/api/projects/:id/members` | Add member | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | Admin |

### Tasks
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/projects/:id/tasks` | List tasks for project | Auth |
| POST | `/api/projects/:id/tasks` | Create task | Auth |
| PUT | `/api/tasks/:id` | Update task (status/details) | Auth |
| DELETE | `/api/tasks/:id` | Delete task | Auth |

### Dashboard & Users
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/dashboard/stats` | Dashboard statistics | Auth |
| GET | `/api/users` | List all users | Auth |

---

## Local Setup

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database

### Environment Variables

Create a `.env` file or set these in your environment:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager
SESSION_SECRET=your-very-long-random-secret-here
NODE_ENV=development
PORT=8080
```

### Installation & Running

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Start the API server
pnpm --filter @workspace/api-server run dev

# In a separate terminal, start the frontend
pnpm --filter @workspace/team-task-manager run dev
```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:8080` (API).

### Build for Production

```bash
# Build API server
pnpm --filter @workspace/api-server run build

# Build frontend
pnpm --filter @workspace/team-task-manager run build
```

---

## Project Structure

```
/
├── artifacts/
│   ├── api-server/          # Express API server
│   │   └── src/
│   │       ├── routes/      # auth, projects, tasks, dashboard, users
│   │       ├── middlewares/ # requireAuth, requireAdmin
│   │       └── app.ts       # Express app setup
│   └── team-task-manager/   # React + Vite frontend
│       └── src/
│           ├── pages/       # login, signup, dashboard, projects, tasks
│           ├── components/  # layout, UI components
│           └── lib/         # auth context, utilities
├── lib/
│   ├── api-spec/            # OpenAPI spec (openapi.yaml)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod validators
│   └── db/                  # Drizzle ORM schema & config
└── README.md
```

---

## Validation & Security

- All request bodies validated with Zod schemas (generated from OpenAPI spec)
- Passwords hashed with bcrypt (10 rounds)
- Sessions stored in PostgreSQL (not in-memory)
- `httpOnly` cookies prevent XSS access to session
- Role checks enforced server-side via middleware
- `trust proxy` enabled for correct cookie behavior behind HTTPS reverse proxy

---

## Deployment

This app is deployed on **Replit** with:
- Static frontend served via Replit's CDN
- Express API server running as a persistent service
- PostgreSQL managed by Replit's built-in database
- HTTPS handled automatically by Replit's proxy
