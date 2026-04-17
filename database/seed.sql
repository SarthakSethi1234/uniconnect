-- UniConnect Seed Data (Enhanced Edition)
USE uniconnect;

-- Insert Users (Password for all is 'password123' using bcrypt)
-- Using hash: $2b$10$CrOZcGMUMugQreTtx0/69uh757T8x817Go30EtVqgkxuOGhdoWsOe
INSERT INTO Users (id, name, email, password_hash, bio, major, grad_year, phone, profile_photo_url, role) VALUES 
(1, 'Alice Student', 'alice@connect.edu', '$2b$10$CrOZcGMUMugQreTtx0/69uh757T8x817Go30EtVqgkxuOGhdoWsOe', 'CS Senior focusing on robust backends.', 'Computer Science', 2026, '9876543210', 'https://ui-avatars.com/api/?name=Alice+Student&background=003366&color=fff', 'student'),
(2, 'Bob Student', 'bob@connect.edu', '$2b$10$CrOZcGMUMugQreTtx0/69uh757T8x817Go30EtVqgkxuOGhdoWsOe', 'Software Engineering major, loves React.', 'Software Engineering', 2027, '9123456780', 'https://ui-avatars.com/api/?name=Bob+Student&background=28a745&color=fff', 'student'),
(3, 'Admin Super', 'admin@connect.edu', '$2b$10$CrOZcGMUMugQreTtx0/69uh757T8x817Go30EtVqgkxuOGhdoWsOe', 'System Administrator.', 'Information Technology', 2024, NULL, NULL, 'admin');

-- Insert Courses
INSERT INTO Courses (id, course_name, course_code) VALUES
(1, 'Database Management Systems', 'CS301'),
(2, 'Artificial Intelligence', 'CS401'),
(3, 'Web Development', 'SE201');

-- Insert Student_Courses
INSERT INTO Student_Courses (user_id, course_id) VALUES
(1, 1), (1, 2),
(2, 1), (2, 3);

-- Insert Student_Skills
INSERT INTO Student_Skills (user_id, skill_name) VALUES
(1, 'Python'), (1, 'SQL'),
(2, 'React'), (2, 'Node.js');

-- Insert Team Proposals
INSERT INTO Team_Proposals (id, creator_id, title, description, required_skills, max_members, deadline) VALUES
(1, 1, 'AI-based Academic Planner', 'Building a smart academic planner using AI.', 'Python, React', 3, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)),
(2, 2, 'React E-Commerce Dashboard', 'Frontend admin dashboard for a generic E-commerce.', 'React, Node', 2, DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY));

-- Let Alice report Bob's proposal for testing the new feature
INSERT INTO Reported_Proposals (proposal_id, reported_by, reason) VALUES
(2, 1, 'Inappropriate content in the proposal description.');

-- Let Bob apply to Alice's proposal
INSERT INTO Applications (proposal_id, applicant_id, status) VALUES (1, 2, 'pending');
