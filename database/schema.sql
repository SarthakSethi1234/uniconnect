USE defaultdb;

CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    resume_text TEXT,
    bio TEXT,
    major VARCHAR(100),
    grad_year INT,
    phone VARCHAR(20),
    profile_photo_url VARCHAR(500),
    role ENUM('student', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(200) NOT NULL,
    course_code VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE Student_Courses (
    user_id INT,
    course_id INT,
    PRIMARY KEY (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
);

CREATE TABLE Projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT
);

CREATE TABLE Student_Projects (
    user_id INT,
    project_id INT,
    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE
);

CREATE TABLE Student_Skills (
    user_id INT,
    skill_name VARCHAR(50),
    PRIMARY KEY (user_id, skill_name),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Team_Proposals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT,
    max_members INT DEFAULT 1,
    application_count INT DEFAULT 0,
    deadline DATE NOT NULL,
    status ENUM('open', 'closed', 'completed', 'archived') DEFAULT 'open',
    closed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT NOT NULL,
    applicant_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES Team_Proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE (proposal_id, applicant_id) 
);

CREATE TABLE Team_Members (
    proposal_id INT,
    user_id INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (proposal_id, user_id),
    FOREIGN KEY (proposal_id) REFERENCES Team_Proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Student_Reputation (
    user_id INT PRIMARY KEY,
    influence_score INT DEFAULT 0,
    collaborations_count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Activity_Log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    proposal_id INT,
    action_type VARCHAR(50), 
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (proposal_id) REFERENCES Team_Proposals(id) ON DELETE SET NULL
);

CREATE TABLE Reported_Proposals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT,
    reported_by INT,
    reason TEXT NOT NULL,
    status ENUM('pending', 'reviewed', 'dismissed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES Team_Proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES Users(id) ON DELETE SET NULL
);
