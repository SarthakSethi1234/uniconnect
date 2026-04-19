# Comprehensive Project Report: UniConnect - Academic Collaboration Network

## 1. Introduction and Project Objective

In modern academic environments, students frequently face challenges in finding reliable collaborators for projects, hackathons, and research proposals. Often, the process is heavily reliant on fragmented messaging platforms that lack structure, accountability, or skill-based matching. **UniConnect** was conceptualized to bridge this gap by serving as a dedicated, centralized academic collaboration platform designed specifically for university students. 

The primary objective of UniConnect is to establish a secure and dynamic ecosystem where students can seamlessly discover peers, form project teams based on complementary skill sets, and manage the lifecycle of team proposals from initiation to completion. Beyond its functional utility as a social network, UniConnect has been architecturally designed to serve as a comprehensive **Database Management System (DBMS)** project. It showcases advanced relational database concepts—ranging from complex normalization and referential integrity to intricate stored procedures, triggers, cursors, and scheduled events—all operating efficiently behind a modern RESTful API.

## 2. Technology Stack and Architecture

UniConnect employs a robust three-tier architecture to separate concerns, ensuring scalability, security, and maintainability.

*   **Frontend (Presentation Layer):** Built using **React.js** (managed via Vite), the frontend offers a highly interactive, responsive, and dynamic user interface. Utilizing minimal CSS frameworks alongside custom styling allows the application to deliver an aesthetic and smooth experience. Features like seamless routing (`react-router-dom`), context-based state management (`AuthContext`), and responsive dashboards bring the data to life.
*   **Backend (Application Logic Layer):** The server logic is powered by **Node.js** running the **Express.js** framework. This layer acts as the vital intermediary that processes HTTP requests, enforces business logic, handles secure authentication (using `bcrypt` for password hashing and `jsonwebtoken` for secure stateless sessions), and interacts directly with the database.
*   **Database (Data Layer):** The foundation of the system is entirely modeled in **MySQL**. Utilizing a relational format allows the platform to safely define rigid relationships between entities like users, the proposals they create, and their concurrent applications.

This decoupled structure allows for the backend API to function independently of the UI, paving the way for future mobile application integrations or alternative interfaces.

## 3. Core Functionalities

UniConnect boasts a comprehensive suite of features engineered to facilitate realistic collaboration workflows:

### A. Authentication and Profile Management
The platform utilizes a secure authentication system featuring role-based access control (RBAC), distinguishing between standard `student` accounts and `admin` accounts. Students can build dynamic profiles detailing their major, graduation year, a personalized biography, and a curated list of technical skills (e.g., Python, React, Data Analysis). 

### B. Team Proposal Engine
The heart of UniConnect is the Proposal Engine. Any student can act as a "Creator" by initiating a project proposal. They define the project’s title, extensive description, specific required skills, absolute deadline, and the maximum number of collaborators needed. These proposals populate the global feed where peers can discover and filter them based on their own academic interests.

### C. Application and Workflow Management
Interaction on the platform is governed by a strict application workflow. When a student discovers an appealing project, they submit an application. This action alerts the proposal creator through an intuitive Application Dashboard. The creator can independently review the applicant's profile and resume. Based on compatibility, the creator can accept or reject the application. If accepted, the applicant officially becomes a "Team Member," and the system securely reveals private contact details allowing them to connect externally. The database actively monitors team capacities—if a team hits its maximum threshold, the project mathematically locks and prevents further applications.

### D. Administrative and Moderation Panel
To ensure a safe and productive environment, UniConnect implements a robust reporting system. If a proposal contains inappropriate content or violates academic integrity, users can flag it. These flags populate a secure Admin Dashboard. Here, administrators possess elevated privileges allowing them to monitor total platform statistics, forcefully take down flagged proposals, dismiss invalid reports, and permanently delete malicious users. 

## 4. Database Design and Schema Architecture

The database design acts as the backbone of the entire UniConnect application. Engineered meticulously up to the Third Normal Form (3NF), the relational schema is designed to prevent data redundancy and ensure utmost integrity through strictly enforced constraints.

The fundamental schema consists of tightly linked core entities:
1.  **Users:** The central entity storing credentials, role flags, and personal profile information.
2.  **Courses** and **Skills:** Distinct dictionary tables that catalog standard academic offerings and technical skills. These connect to users through many-to-many junction tables (`Student_Courses` and `Student_Skills`).
3.  **Team_Proposals:** The flagship entity storing project requests. It holds a foreign key referencing the `creator_id` back to the Users table.
4.  **Applications:** A critical transitional table tracking the status (`pending`, `accepted`, `rejected`) of a user requesting to join a proposal. 
5.  **Team_Members:** The final state entity containing the users who successfully passed the application stage. 

### Referential Integrity and Cascading
To prevent orphaned records and maintain structural sanity, practically every Foreign Key relationship enforces `ON DELETE CASCADE`. If an administrative action results in deleting a malicious user, the system automatically descends through the schema, deleting their created proposals, their pending applications, their skills, and stripping them from active teams, ensuring absolute database consistency without leaving ghost data behind. Some analytical tables utilize `ON DELETE SET NULL` to preserve historical integrity even if the core user is removed.

## 5. Advanced DBMS Implementations

Beyond table structures, UniConnect leverages advanced database programming techniques to handle complex validations and background tasks completely independently of the Node.js backend. This shifts heavy computational logic down to the data layer where it executes faster and more securely.

### Triggers for Automated Validation
MySQL Triggers act as the first line of defense against illogical data manipulation. For example, before an application status is updated to `accepted` via a `BEFORE UPDATE` trigger, the database can mathematically check if the attached Proposal has already reached its `max_members` limit. If the limit is met, the database intelligently throws an exception, blocking the backend from executing an illegal state update.

### Cursors for Bulk Reconciliation
Cursors are implemented in custom Stored Procedures to handle complex multi-row logical shifts. For instance, if a proposal creator suddenly edits their project and structurally reduces the maximum capacity from 5 members down to 2, a cursor is triggered. The cursor loops specifically through the excess pending applications for that exact proposal and auto-rejects them because the newly requested capacity has already functionally run out.

### Event Schedulers for Autonomous Bookkeeping
UniConnect relies on MySQL Event Schedulers to act as an autonomous janitor. 
*   **Auto-Closing Expired Proposals:** An event runs continuously on a scheduled minute-by-minute basis, sweeping the `Team_Proposals` table. If it detects open proposals where the `deadline` is older than the current timestamp, it forcefully changes the status to `closed`.
*   **Auto-Completing Full Proposals:** A parallel event checks open proposals against their total accepted `Team_Members`. The moment a team hits capacity, the event flags it as completed, removing it from the public feed seamlessly without requiring any human or backend intervention.

### Custom Views for Performance
The project heavily utilizes SQL Views to simplify backend querying. Instead of repeatedly writing lengthy algebraic `JOIN` statements in the backend API to aggregate a user’s name, their bio, and a concatenated string of their top skills, the database provides pre-compiled `Student_Profile_Views` and `Proposal_Summary_Views`. This dramatically speeds up rendering times on the frontend and keeps the API logic clean.

## 6. Security and Data Privacy

Protecting student data was a paramount concern throughout development. 
*   **Password Cryptography:** No plain-text passwords exist in the database. `bcrypt` hashing algorithms generate salted strings protecting user accounts from potential database breaches.
*   **Stateless JWT Authentication:** Accessing private routes, such as the application dashboard or admin panel, requires a JSON Web Token securely granted upon login.
*   **Secure Contact Reveal Logic:** The API aggressively blocks users from accessing the contact details (phone numbers, emails) of platform peers. The database query to fetch accepted contacts fundamentally acts as a gatekeeper, verifying that the requester's `user_id` matches either the exact proposal creator or a validated accepted team member before revealing row data.

## 7. Conclusion

UniConnect serves as a prime realization of how robust Database Management Systems translate directly into highly functional, real-world applications. By treating the database not simply as a static data warehouse, but as a proactive, autonomous participant in business logic (via Events, Triggers, and Cursors), the project ensures extreme data integrity and application stability. 

As an academic collaboration platform, it successfully solves the logistical nightmare of unstructured student teaming. As a technical capstone, it reflects a deep understanding of full-stack engineering, seamlessly interlacing a React frontend, an Express API, and an incredibly powerful, secure, and thoughtfully normalized MySQL foundation.
