USE defaultdb;

-- Drop indexes if they already exist to avoid errors on re-run
DROP INDEX IF EXISTS idx_proposals_status ON Team_Proposals;
DROP INDEX IF EXISTS idx_proposals_status_deadline ON Team_Proposals;
DROP INDEX IF EXISTS idx_applications_proposal ON Applications;
DROP INDEX IF EXISTS idx_applications_applicant ON Applications;
DROP INDEX IF EXISTS idx_applications_composite ON Applications;
DROP INDEX IF EXISTS idx_team_members_proposal ON Team_Members;
DROP INDEX IF EXISTS idx_team_members_user ON Team_Members;
DROP INDEX IF EXISTS idx_skills_user ON Student_Skills;
DROP INDEX IF EXISTS idx_skills_name ON Student_Skills;
DROP INDEX IF EXISTS idx_users_major ON Users;
DROP INDEX IF EXISTS idx_activity_user ON Activity_Log;
DROP INDEX IF EXISTS idx_activity_proposal ON Activity_Log;
DROP INDEX IF EXISTS idx_activity_timestamp ON Activity_Log;
DROP INDEX IF EXISTS idx_reports_status ON Reported_Proposals;
DROP INDEX IF EXISTS idx_reports_proposal ON Reported_Proposals;
DROP INDEX IF EXISTS idx_student_courses_user ON Student_Courses;
DROP INDEX IF EXISTS idx_student_courses_course ON Student_Courses;
DROP INDEX IF EXISTS idx_reputation_score ON Student_Reputation;

CREATE INDEX idx_proposals_status
    ON Team_Proposals(status);

CREATE INDEX idx_proposals_status_deadline
    ON Team_Proposals(status, deadline);

CREATE INDEX idx_applications_proposal
    ON Applications(proposal_id);

CREATE INDEX idx_applications_applicant
    ON Applications(applicant_id);

CREATE INDEX idx_applications_composite
    ON Applications(proposal_id, applicant_id, status);

CREATE INDEX idx_team_members_proposal
    ON Team_Members(proposal_id);

CREATE INDEX idx_team_members_user
    ON Team_Members(user_id);

CREATE INDEX idx_skills_user
    ON Student_Skills(user_id);

CREATE INDEX idx_skills_name
    ON Student_Skills(skill_name);

CREATE INDEX idx_users_major
    ON Users(major);

CREATE INDEX idx_activity_user
    ON Activity_Log(user_id);

CREATE INDEX idx_activity_proposal
    ON Activity_Log(proposal_id);

CREATE INDEX idx_activity_timestamp
    ON Activity_Log(timestamp);

CREATE INDEX idx_reports_status
    ON Reported_Proposals(status);

CREATE INDEX idx_reports_proposal
    ON Reported_Proposals(proposal_id);

CREATE INDEX idx_student_courses_user
    ON Student_Courses(user_id);

CREATE INDEX idx_student_courses_course
    ON Student_Courses(course_id);

CREATE INDEX idx_reputation_score
    ON Student_Reputation(influence_score);
