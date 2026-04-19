USE defaultdb;

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
