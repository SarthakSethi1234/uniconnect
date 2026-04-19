# UniConnect — Frontend Documentation

> A full-stack academic collaboration platform built for Shiv Nadar University students. Students can discover peers, post project proposals, form teams, and track their reputation — all backed by a MySQL database accessed via a Node.js/Express REST API.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Running the Application](#4-running-the-application)
5. [Core Frontend Files](#5-core-frontend-files)
   - [main.jsx](#mainjsx)
   - [App.jsx](#appjsx)
   - [AuthContext.jsx](#authcontextjsx)
   - [index.css](#indexcss)
6. [Pages](#6-pages)
   - [LandingPage](#landingpage--route-)
   - [Login](#login--route-login)
   - [Register](#register--route-register)
   - [ProposalFeed](#proposalfeed--route-feed)
   - [CreateProposal](#createproposal--route-proposalsnew)
   - [MyProposals](#myproposals--route-my-proposals)
   - [ApplicationDashboard](#applicationdashboard--route-dashboard)
   - [ProfilePage](#profilepage--route-profile)
   - [SearchPage](#searchpage--route-search)
   - [AdminPanel](#adminpanel--route-admin)
7. [Backend API Reference](#7-backend-api-reference)
8. [Database Views Used by Backend](#8-database-views-used-by-backend)
9. [Environment Configuration](#9-environment-configuration)

---

## 1. Project Overview

UniConnect is a structured social-academic network purpose-built to replace informal tools (WhatsApp groups, LinkedIn posts) for finding university project collaborators. The core workflow is:

1. A student **registers** and builds their profile (skills, bio, resume).
2. They **post a proposal** describing a project and the skills they need.
3. Other students **browse the feed**, find relevant proposals, and **apply**.
4. The proposal creator **reviews applications**, reads resumes, and **accepts or rejects** them.
5. Accepted team members can **reveal each other's contact details**.
6. An **admin** can moderate content, review flagged proposals, and manage users.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 (Vite), React Router DOM v7 |
| **Icons** | Lucide React |
| **Styling** | Vanilla CSS (`index.css` — global design system) |
| **Backend** | Node.js + Express 5 |
| **Database** | MySQL (via `mysql2/promise` connection pool) |
| **Auth** | JWT (jsonwebtoken) + bcrypt password hashing |
| **Build Tool** | Vite 8 |

---

## 3. Project Structure

```
DBMS PROJECT/
├── frontend/               ← React + Vite SPA
│   ├── src/
│   │   ├── main.jsx        ← App entry point
│   │   ├── App.jsx         ← Router, nav, route guards
│   │   ├── index.css       ← Global design system (tokens, components)
│   │   ├── App.css         ← App-level overrides
│   │   ├── context/
│   │   │   └── AuthContext.jsx     ← Auth state & JWT management
│   │   └── pages/
│   │       ├── LandingPage.jsx
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── ProposalFeed.jsx
│   │       ├── CreateProposal.jsx
│   │       ├── MyProposals.jsx
│   │       ├── ApplicationDashboard.jsx
│   │       ├── ProfilePage.jsx
│   │       ├── SearchPage.jsx
│   │       └── AdminPanel.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── server.js           ← Single Express file, all API routes
│   ├── .env                ← DB credentials, JWT secret, port
│   └── package.json
│
└── database/
    ├── schema.sql          ← Table definitions (DDL)
    ├── views.sql           ← MySQL VIEWs used by the API
    ├── triggers.sql        ← Business logic triggers
    ├── cursors.sql         ← Stored procedures with cursors
    ├── queries.sql         ← Named queries / analytics
    ├── normalization_and_indexes.sql
    ├── events.sql          ← Scheduled MySQL events
    └── seed.sql            ← Sample data
```

---

## 4. Running the Application

### Backend

```bash
cd backend
node server.js        # starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm run dev           # starts Vite dev server on http://localhost:5173
```

The frontend automatically proxies API calls to `http://localhost:5000` (controlled via `VITE_API_URL` env variable; defaults to `http://localhost:5000` if unset).

---

## 5. Core Frontend Files

### `main.jsx`

The Vite entry point. Mounts the `<App />` component into the `#root` DOM element inside `index.html`. Imports `index.css` globally so all design tokens and utility classes are available everywhere.

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)
```

---

### `App.jsx`

The **routing and navigation hub** for the entire application. Key responsibilities:

#### Route Guard — `PrivateRoute`
Wraps protected routes. If no user is in `AuthContext`, redirects to `/` (landing). If `adminOnly={true}` and the user is not an admin, redirects to `/feed`. This is the single source of truth for access control on the frontend.

#### Navigation Bar — `AppNavigation`
Renders only when a user is logged in (`user !== null`). Shows different nav links based on `user.role`:
- **Student**: Feed, Search, Create Proposal, Dashboard, My Proposals, Profile, Logout
- **Admin**: Admin Panel link only + Logout

The active link is highlighted by comparing `location.pathname` to the link's `to` prop.

#### Root Route — `RootRoute`
Decides what to render at `/`:
- No user → `<LandingPage />`
- Admin → redirect to `/admin`
- Student → redirect to `/feed`

#### Route Map

| Path | Component | Auth Required | Admin Only |
|---|---|---|---|
| `/` | `LandingPage` (via `RootRoute`) | No | No |
| `/login` | `Login` | No | No |
| `/register` | `Register` | No | No |
| `/feed` | `ProposalFeed` | ✅ | No |
| `/search` | `SearchPage` | ✅ | No |
| `/proposals/new` | `CreateProposal` | ✅ | No |
| `/dashboard` | `ApplicationDashboard` | ✅ | No |
| `/my-proposals` | `MyProposals` | ✅ | No |
| `/profile` | `ProfilePage` | ✅ | No |
| `/admin` | `AdminPanel` | ✅ | ✅ |

---

### `AuthContext.jsx`

A React Context (`AuthContext`) that manages **authentication state globally** across the entire app. Provided at the root level by `<AuthProvider>`.

**State managed:**
- `user` — `{ id, name, role }` decoded from the JWT payload
- `token` — the raw JWT string, persisted in `localStorage`

**How it works:**
1. On load, reads `token` from `localStorage`.
2. Decodes JWT payload (`atob(token.split('.')[1])`) to restore the `user` object without a network call.
3. Provides `login(userData, jwtToken)` — called by the Login page after successful authentication.
4. Provides `logout()` — clears `token` and `user`, removing from `localStorage`.
5. Any component can call `useContext(AuthContext)` to get `{ user, token, login, logout }`.

Every authenticated API call reads `token` from this context and attaches it as `Authorization: Bearer <token>`.

---

### `index.css`

The **global design system** — no component-level CSS files are used. It defines:

- **CSS Custom Properties (design tokens)** — colors (`--primary`, `--danger`, `--border`), spacing, border radii, and shadow values.
- **Component classes** — `.card`, `.btn`, `.btn-primary`, `.badge`, `.form-control`, `.navbar`, `.avatar`, `.table-clean`, etc.
- **Layout utilities** — `.grid-2`, `.flex-between`, `.app-container`.
- **Page-specific styles** — `.landing-*` classes for the full-width landing page.
- **Animation** — `.animate-in` keyframe for staggered card entrance effects, `.spinner` for loading states.

All pages use these shared class names, keeping the styling consistent and DRY.

---

## 6. Pages

### `LandingPage` — Route: `/`

**Access:** Public (no auth required)

**Purpose:** Marketing/welcome page shown to unauthenticated visitors.

**Sections:**
- **Public Navbar** — Links to `#features`, `#how-it-works`, `#about` anchors, plus "Sign In" and "Get Started" buttons.
- **Hero** — Headline, subtext ("exclusively for SNU students"), and two CTAs: "Create Free Account" (`/register`) and "Sign In →" (`/login`).
- **Features Grid** — Six feature cards (Smart Proposal Feed, Team Formation, Influence & Reputation, Peer Discovery, Application Dashboard, Admin Moderation) rendered dynamically from a `features` array.
- **How It Works** — Four numbered step cards rendered from a `steps` array.
- **About** — Description of the platform's purpose plus a benefit list card.
- **Final CTA** — Full-width banner with a repeated register link.

**Backend Communication:** None. This is a fully static page.

---

### `Login` — Route: `/login`

**Access:** Public

**Purpose:** Authenticates an existing user and sets the global auth state.

**How it works:**
1. User fills in email and password (prefilled with demo credentials).
2. On submit, sends a `POST /api/auth/login` request with `{ email, password }`.
3. On success (`data.success === true`), calls `login(data.user, data.token)` from `AuthContext`, which saves the JWT and user object.
4. Redirects admins to `/admin`, students to `/` (which then redirects to `/feed` via `RootRoute`).
5. On failure, shows an inline error alert.

**API calls:**

| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/login` | `{ email, password }` | Authenticate user, receive JWT |

---

### `Register` — Route: `/register`

**Access:** Public

**Purpose:** Creates a new student account.

**How it works:**
1. On mount, fetches the list of available courses from the backend to populate the Major dropdown.
2. Collects: name, email, password, major (from dropdown), graduation year, optional bio.
3. On submit, sends a `POST /api/auth/register` request.
4. On success, navigates to `/login` so the user can sign in with their new credentials.
5. All new accounts default to `role: 'student'` (the backend ignores any attempt to self-assign `admin`).

**API calls:**

| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| `GET` | `/api/courses` | — | Load course list for the Major dropdown |
| `POST` | `/api/auth/register` | `{ name, email, password, bio, major, grad_year, role }` | Create new user account |

---

### `ProposalFeed` — Route: `/feed`

**Access:** Authenticated students

**Purpose:** The main homepage after login. Displays all open team proposals and provides actions to apply, edit (for own proposals), or report them. Also shows a smart sidebar.

**How it works:**

On mount, three API calls are made in parallel via `Promise.all`:
1. Fetch all open proposals.
2. Fetch the global skill popularity chart (from a stored procedure).
3. Fetch personalized peer recommendations (from a stored procedure, based on shared course enrollment).

The proposals are split into two groups displayed in order:
- **My Proposals** — proposals where `creator_id === user.id`. Shows an **Edit** button (inline edit form).
- **Community Proposals** — all other proposals. Shows **Apply Now** and **Report** buttons.

**Inline Edit Form:** When a user clicks "Edit" on their own proposal, the card transforms in-place to show a form pre-filled with the current values. On save, a `PUT /api/proposals/:id` request is sent. If `maxMembers` was reduced, the backend automatically calls `sp_handle_capacity_reduction` (a cursor-based stored procedure) to reject pending applications that no longer fit.

**Report Flow:** Clicking "Report" on another user's proposal expands an inline form for the reason. On submit, the report is inserted into `Reported_Proposals` and becomes visible in the Admin Panel.

**Sidebar:**
- **Recommended Peers** — up to 5 students who share a course with the logged-in user (powered by `sp_recommendations` stored procedure).
- **Top Skills** — top 8 skills by user count (powered by `sp_skill_popularity_report` stored procedure).

**API calls:**

| Method | Endpoint | Headers | Purpose |
|---|---|---|---|
| `GET` | `/api/proposals` | Auth | Fetch all open proposals |
| `GET` | `/api/analytics/skills` | None | Fetch top skills (calls `sp_skill_popularity_report`) |
| `GET` | `/api/analytics/recommendations` | Auth | Fetch peer recommendations (calls `sp_recommendations`) |
| `POST` | `/api/proposals/:id/apply` | Auth | Apply to a proposal |
| `PUT` | `/api/proposals/:id` | Auth | Edit a proposal (creator only) |
| `POST` | `/api/proposals/report` | Auth | Report a proposal |

---

### `CreateProposal` — Route: `/proposals/new`

**Access:** Authenticated students

**Purpose:** A focused form to publish a new team proposal to the feed.

**Fields:**
- **Proposal Title** — short, descriptive name
- **Description** — what the project is about and what the team will build
- **Required Skills** — comma-separated (e.g., `Python, React, SQL`)
- **Max Team Size** — integer, 1–10
- **Application Deadline** — date picker

**How it works:**
1. User fills in the form.
2. On submit, sends a `POST /api/proposals` with all fields plus the JWT.
3. The backend inserts into `Team_Proposals` and a `BEFORE INSERT` trigger validates the deadline and logs the creation.
4. On success, navigates back to `/` (which redirects to `/feed`).

**API calls:**

| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| `POST` | `/api/proposals` | `{ title, description, requiredSkills, maxMembers, deadline }` | Publish new proposal |

---

### `MyProposals` — Route: `/my-proposals`

**Access:** Authenticated students

**Purpose:** A personal archive of all proposals the logged-in user has ever created, divided into **Active** and **Past** tabs.

**How it works:**
1. On mount, two parallel API calls fetch active proposals (status `open`) and past proposals (status `closed`, `completed`, or `archived`).
2. **Active proposals** show an **Edit** button with an inline edit form (same logic as `ProposalFeed`).
3. **Past proposals** are read-only cards with their closed date visible.

Each card shows: title, status badge, deadline, description, required skill tags, and member/application counts.

**API calls:**

| Method | Endpoint | Headers | Purpose |
|---|---|---|---|
| `GET` | `/api/proposals/mine/active` | Auth | Fetch own open proposals |
| `GET` | `/api/proposals/mine/past` | Auth | Fetch own closed/completed proposals |
| `PUT` | `/api/proposals/:id` | Auth | Edit an active proposal |

---

### `ApplicationDashboard` — Route: `/dashboard`

**Access:** Authenticated students

**Purpose:** A two-column view showing all incoming applications (to the user's proposals) and all outgoing applications (sent by the user). This is the team management center.

**Left Column — Incoming Applications:**
Each card shows:
- Applicant name, avatar, applied date
- Which proposal they applied to
- Their current status badge (Pending / Accepted / Rejected)
- A collapsible **Resume** panel (toggle to read their resume text)
- For **Pending** applications: **Accept** and **Reject** buttons
- For **Accepted** members: **Remove** (kick) button and **Team Contacts** button

**Team Contacts Reveal:** When a creator or accepted member clicks "Team Contacts", the frontend calls `GET /api/proposals/:id/accepted-contacts`. The backend checks that the requester is either the creator or an accepted member before returning data from the `Accepted_Contact_View` (name, email, phone of all accepted members). This data is cached in `contactsMap` state so it's only fetched once per proposal.

**Right Column — Sent Applications:**
Each card shows:
- The proposal title, application date, and current status
- For **Accepted** status: a **"View Team"** button that calls the same contacts endpoint
- For **Pending** status: a **"Withdraw"** button (with a confirmation dialog) that deletes the application record

**API calls:**

| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| `GET` | `/api/applications/dashboard` | — | Fetch both incoming and sent applications |
| `POST` | `/api/applications/:id/status` | `{ action }` | Accept or reject an incoming application |
| `DELETE` | `/api/applications/withdraw/:proposalId` | — | Withdraw a pending sent application |
| `DELETE` | `/api/proposals/:id/members/:userId` | — | Remove/kick an accepted team member |
| `GET` | `/api/proposals/:id/accepted-contacts` | — | Reveal accepted team contacts (gated) |

---

### `ProfilePage` — Route: `/profile`

**Access:** Authenticated students

**Purpose:** Displays the logged-in user's full profile and allows editing all details and resume text.

**How it works:**
1. On mount, fetches the full profile from `GET /api/users/me` (backed by `Student_Profile_View`) and the courses list.
2. Displays a **Profile Hero Card** with:
   - Avatar (initial letter)
   - Name, major, graduation year, bio
   - Email and phone (if set)
   - Two stat boxes: **Influence Score** and **Collaborations Count** (from `Student_Reputation` table via the view)
   - Skill tags
3. An **Edit Profile** button toggles an edit form below the hero card (with all editable fields).
4. The **Resume section** at the bottom is always editable — a textarea for free-text resume content.

**Profile Save (`PUT /api/users/profile`):** Updates `name`, `bio`, `major`, `grad_year`, `phone`, `profile_photo_url` in `Users` table. Skills are handled by deleting all rows for the user in `Student_Skills` and re-inserting, ensuring a clean state.

**Resume Save (`POST /api/users/resume`):** Updates only the `resume_text` column in `Users`. Kept separate so resume edits don't require re-submitting all profile fields.

**API calls:**

| Method | Endpoint | Body | Purpose |
|---|---|---|---|
| `GET` | `/api/users/me` | — | Fetch own profile from `Student_Profile_View` |
| `GET` | `/api/courses` | — | Load course list for the Major dropdown |
| `PUT` | `/api/users/profile` | `{ name, bio, major, grad_year, phone, profile_photo_url, skills }` | Update profile and skills |
| `POST` | `/api/users/resume` | `{ resume_text }` | Update resume text |

---

### `SearchPage` — Route: `/search`

**Access:** Authenticated students

**Purpose:** A searchable directory of all students on the platform.

**How it works:**
1. On mount, fetches all students and the list of distinct majors.
2. **Server-side filter** — Major dropdown triggers a new `GET /api/users/search?major=<value>` request.
3. **Client-side filter** — The search input filters the current `students` array by name or skill substring (case-insensitive, no extra API call needed).
4. Shows a live count of matching students.

Each student card shows:
- Coloured avatar (gradient based on index), name, major, graduation year
- Influence score and collaboration count
- Bio text (if set)
- Up to 6 skill badges
- A collapsible **Resume** panel (same toggle pattern as the Dashboard)

**API calls:**

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/users/search` | Fetch all students (no major filter) |
| `GET` | `/api/users/search?major=X` | Fetch students filtered by major |
| `GET` | `/api/users/majors` | Fetch list of distinct majors for the dropdown |

---

### `AdminPanel` — Route: `/admin`

**Access:** Admin users only (enforced by both frontend `PrivateRoute` and backend `isAdmin` middleware)

**Purpose:** The moderation control centre. Shows all users and all pending flagged proposals.

**How it works:**
1. On mount, fetches admin stats from `GET /api/admin/stats`, which queries `Admin_Management_View` and `Reported_Proposals`.
2. Two stat chips at the top show total user count and pending flagged count.

**Left Column — Users Table:**
- Lists every user (name, role badge, proposals created count) from `Admin_Management_View`.
- Each non-admin user has a **Delete** (trash) button. Admin accounts are protected from deletion by this UI check (and by backend logic).
- Delete calls `DELETE /api/admin/users/:id`, which cascades to delete all their proposals, applications, etc.

**Right Column — Flagged Proposals:**
- Lists all reports with status `pending` showing: proposal title, reporter name, reason, and date.
- **Dismiss** — marks the report as `dismissed` (`PUT /api/admin/reports/:id/dismiss`). The proposal stays live.
- **Take Down** — deletes the entire proposal (`DELETE /api/admin/proposals/:id`), which cascades to delete all related reports and applications.

**API calls:**

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/admin/stats` | Fetch all users and pending reports |
| `DELETE` | `/api/admin/users/:id` | Delete a user (cascades) |
| `PUT` | `/api/admin/reports/:id/dismiss` | Mark report as dismissed |
| `DELETE` | `/api/admin/proposals/:id` | Remove a proposal (cascades) |

---

## 7. Backend API Reference

All routes are defined in `backend/server.js`. The backend is a single Express 5 file with a MySQL connection pool.

### Middleware

| Middleware | Function |
|---|---|
| `authenticateToken` | Verifies the `Authorization: Bearer <JWT>` header. Attaches `req.user = { id, role, name }` to the request. |
| `isAdmin` | Checks `req.user.role === 'admin'`. Used on all `/api/admin/*` routes. |

### Auth Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Create account. Hashes password with `bcrypt`. |
| `POST` | `/api/auth/login` | No | Validate credentials, return signed JWT (8h expiry). |

### User / Profile Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | JWT | Returns logged-in user from `Student_Profile_View`. |
| `PUT` | `/api/users/profile` | JWT | Updates Users table and rebuilds Student_Skills rows. |
| `POST` | `/api/users/resume` | JWT | Updates `resume_text` column only. |
| `GET` | `/api/users/search` | JWT | Returns all students from view; supports `?major=` filter. |
| `GET` | `/api/users/majors` | JWT | Returns distinct majors for the search filter dropdown. |

### Courses Route

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/courses` | No | Returns all courses for registration/profile dropdowns. |

### Proposals Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/proposals` | JWT | All open proposals from `Proposal_Summary_View`. |
| `GET` | `/api/proposals/mine/active` | JWT | Creator's open proposals. |
| `GET` | `/api/proposals/mine/past` | JWT | Creator's closed/completed/archived proposals. |
| `POST` | `/api/proposals` | JWT | Insert a new proposal (triggers fire on insert). |
| `PUT` | `/api/proposals/:id` | JWT | Edit proposal (creator only). Calls `sp_handle_capacity_reduction` if max_members reduced. |
| `POST` | `/api/proposals/:id/apply` | JWT | Insert application with `status='pending'`. |
| `POST` | `/api/proposals/report` | JWT | Insert into `Reported_Proposals`. |
| `GET` | `/api/proposals/:id/accepted-contacts` | JWT | Returns `Accepted_Contact_View` data — only if requester is creator or accepted member. |

### Application Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/applications/dashboard` | JWT | Returns `incoming` (to user's proposals) and `sent` (by user) application arrays. |
| `POST` | `/api/applications/:id/status` | JWT | Accept or reject an application. Checks team capacity before accepting. |
| `DELETE` | `/api/applications/withdraw/:proposalId` | JWT | Deletes the application and removes from `Team_Members`. |
| `DELETE` | `/api/proposals/:id/members/:userId` | JWT | Kick a member (creator only). Sets `Applications.status = 'rejected'`. |

### Admin Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | JWT + Admin | Returns users list and pending reports. |
| `DELETE` | `/api/admin/users/:id` | JWT + Admin | Hard-deletes a user (cascades via FK constraints). |
| `PUT` | `/api/admin/reports/:id/dismiss` | JWT + Admin | Sets report status to `dismissed`. |
| `DELETE` | `/api/admin/proposals/:id` | JWT + Admin | Hard-deletes a proposal (cascades). |

### Analytics Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/skills` | No | Calls `sp_skill_popularity_report()` stored procedure. Returns skill + user_count. |
| `GET` | `/api/analytics/recommendations` | JWT | Calls `sp_recommendations(userId)` stored procedure. Returns potential peers sharing a course. |

---

## 8. Database Views Used by Backend

The backend queries these MySQL `VIEW`s instead of raw tables, centralizing complex joins:

| View | Used By | Description |
|---|---|---|
| `Student_Profile_View` | `GET /api/users/me`, `GET /api/users/search` | Joins `Users`, `Student_Reputation`, and `Student_Skills`. Returns full student profile with influence score, collaboration count, and comma-separated skills. |
| `Proposal_Summary_View` | All proposal list endpoints | Joins `Team_Proposals` with `Users` for creator info. Includes live counts for `current_members` and `application_count`. |
| `Admin_Management_View` | `GET /api/admin/stats` | Joins `Users` with `Team_Proposals` and `Student_Reputation`. Returns per-user proposal count and influence score. |
| `Accepted_Contact_View` | `GET /api/proposals/:id/accepted-contacts` | Filters `Applications` where `status='accepted'` and joins contact info from `Users`. Used to safely reveal team contact details. |

---

## 9. Environment Configuration

### Backend — `backend/.env`

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<your_mysql_password>
DB_NAME=uniconnect
PORT=5000
```

> ⚠️ **Never commit `.env` to version control.** The `JWT_SECRET` should also be set here for production (currently falls back to a hardcoded string in `server.js` if not provided).

### Frontend — Environment Variable

The frontend reads `import.meta.env.VITE_API_URL` to resolve the backend base URL. If not set, it defaults to `http://localhost:5000`. To change this, create a `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000
```

### `frontend/vite.config.js`

Minimal Vite config — only uses `@vitejs/plugin-react` (enables JSX fast-refresh). No proxy is configured because the API URL is handled at the fetch call level via the `VITE_API_URL` env variable.
