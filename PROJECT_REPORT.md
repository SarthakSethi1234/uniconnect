# UniConnect: Project Progress & Architecture Report

## 1. Project Overview & Use Cases
UniConnect is an academic collaboration platform designed to connect students with peers for team projects, hackathons, and study groups. The platform functions as a specialized academic network and proposal management system.

### Core Use Cases:
* **User Profiles & Authentication:** Secure registration (bcrypt hashed passwords) and role-based access (Student vs Admin).
* **Project Proposals (Feed):** Students can post academic proposals bounded by team sizes, skills, and deadlines.
* **Smart Application Workflows:** Users apply to join open proposals. Proposal creators can accept/reject applications, managing team capacities dynamically.
* **Reputation Engine:** Students gain "Influence Points" and increase their "Collaboration Count" dynamically when successfully participating in projects.
* **Admin Moderation:** Admins can view statistical overviews, review flagged/reported proposals, and execute dismissals or takedowns.
* **Automated Data Integrity:** Uses database-level enforcement (triggers/events/cursors) to automate closing proposals, dropping capacities, validating email rules (`@snu.edu.in`), and phone number sizing.

---

## 2. Database Schema (Tables & Attributes)
The database utilizes an intersection of relational entity mapping specifically tailored for an academic environment. 

| Table Name | Attributes | Description |
| :--- | :--- | :--- |
| **Users** | `id` (PK), `name`, `email` (UQ), `password_hash`, `resume_text`, `bio`, `major`, `grad_year`, `phone`, `profile_photo_url`, `role`, `created_at` | Core store for all students & admins. |
| **Courses** |  `id` (PK), `course_name`, `course_code` (UQ) | Pre-defined academic curriculum mapping. |
| **Student_Courses** | `user_id` (PK, FK), `course_id` (PK, FK) | M2M relationship tracking which student takes which course. |
| **Projects** | `id` (PK), `title`, `description` | External projects/hackathons for portfolio. |
| **Student_Projects** | `user_id` (PK, FK), `project_id` (PK, FK) | M2M table mapping students to projects. |
| **Student_Skills** | `user_id` (PK, FK), `skill_name` (PK) | Tracks atomic user skills (e.g. Python, SQL). |
| **Team_Proposals** | `id` (PK), `creator_id` (FK), `title`, `description`, `required_skills`, `max_members`, `application_count`, `deadline`, `status` (ENUM), `closed_at`, `created_at` | Primary entity for posted group projects. |
| **Applications** | `id` (PK), `proposal_id` (FK), `applicant_id` (FK), `status` (ENUM), `applied_at` | UQ mapping tracking pending/accepted/rejected statuses. |
| **Team_Members** | `proposal_id` (PK, FK), `user_id` (PK, FK), `joined_at` | Hard mapping of formally accepted proposal members. |
| **Student_Reputation**| `user_id` (PK, FK), `influence_score`, `collaborations_count` | Automatically updated metrics tracking student involvement. |
| **Activity_Log** | `id` (PK), `user_id` (FK), `proposal_id` (FK), `action_type`, `description`, `timestamp` | Audit log mapping actions like APPLIES, EXITS, EDITS. |
| **Reported_Proposals**| `id` (PK), `proposal_id` (FK), `reported_by` (FK), `reason`, `status`, `created_at` | Holding table for admin moderation flagged by peers. |

---

## 3. Database Normalization Analysis
The schema has been structured aligning strictly with Codd's standard definitions up to **Boyce-Codd Normal Form (BCNF/3NF)**.

### First Normal Form (1NF)
* **Rule:** Every column must hold atomic values, and there are no repeating groups.
* **Justification:** Instead of storing multiple courses or skills in an array inside the `Users` table, we spawned independent tables (`Student_Courses`, `Student_Skills`) connected via Foreign Keys. *(Note: `Team_Proposals.required_skills` deliberately uses a minimal CSV string purely for performant front-end rendering without rigorous JOINs, constituting a calculated demarkation from strict 1NF for UI optimization)*.

### Second Normal Form (2NF)
* **Rule:** Must be in 1NF and have no partial dependencies (all non-key fields depend on the *entire* Primary Key).
* **Justification:** Every primary table uses an auto-incrementing surrogate Integer Primary Key (`id`). Our composite tables (`Team_Members`, `Student_Courses`) possess no non-foreign-key attributes dependent on only *half* the key. All attributes fully depend on the PKs.

### Third Normal Form (3NF) & BCNF
* **Rule:** Must be in 2NF and have no transitive dependencies (no non-key attribute depends on another non-key attribute).
* **Justification:** Attributes such as `influence_score` do not sit inside `Users` tying them transitively. They live cleanly isolated in a 1:1 mapping against `Student_Reputation`. `application_count` lives inside `Team_Proposals` explicitly as a cached aggregate but serves a functional caching purpose to reduce computational load. 

---

## 4. Advanced Database Concepts

### What the Triggers do
The robust set of 14 Triggers are designed to enforce business logic strictly at the DBMS layer independently of the NodeJS server:
* **Metric Syncing (`trg_1_*`, `trg_8_*`)**: Automatically ++increments or --decrements `application_count` in `Team_Proposals` the exact millisecond an `Application` is created/deleted.
* **Defensive App Blocking (`trg_2_*`, `trg_3_*`, `trg_4_*`)**: Aborts row insertions (throwing `45000 SIGNAL` SQL exceptions) if a user applies twice, applies identically to a full proposal, or attempts to join a proposal post-deadline.
* **Automated Propagation (`trg_5_*`, `trg_6_*`)**: Once an application status is flipped to `accepted`, the trigger automatically creates the `Team_Members` row and instantly updates both the Creator and Applicant's `Student_Reputation` metrics simultaneously. 
* **Validation (`trg_10_*`, `trg_users_*_val`)**: Blocks edits on completed assignments and throws SQL aborts if new registrations attempt registering an email not matching `%@snu.edu.in` or missing the explicit 10 digit requirement.

### What the Cursors do
Stored Procedures heavily utilize Cursors (`database/cursors.sql`) to manage computational iterations natively on the database server.
* **Capacity Shifting (`sp_handle_capacity_reduction`)**: When a proposal creator lowers `max_members`, a cursor actively walks forward chronologically scanning all `"pending"` `Applications`. Once the active accepted members fill the new lowered cap, the cursor fires individual active `rejected` triggers for remaining applicants.
* **Analytics Generation (`sp_generate_proposal_report`, etc.)**: Complex administrative dashboards require aggregates spanning multiple JOINS natively fed forward. Cursors scan items like overlapping `Student_Courses` and natively buffer intersecting student relations (`sp_recommendations`) saving the backend from parsing multidimensional JSON arrays.
