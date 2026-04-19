USE defaultdb;

-- 1. Admin Management View
CREATE OR REPLACE VIEW Admin_Management_View AS
SELECT 
    u.id AS user_id, 
    u.name, 
    u.email, 
    u.role, 
    u.major,
    u.grad_year,
    u.phone,
    u.created_at,
    COUNT(DISTINCT tp.id) AS proposals_created,
    sr.influence_score
FROM Users u
LEFT JOIN Team_Proposals tp ON u.id = tp.creator_id
LEFT JOIN Student_Reputation sr ON u.id = sr.user_id
GROUP BY u.id;

-- 2. Proposal Summary View
CREATE OR REPLACE VIEW Proposal_Summary_View AS
SELECT 
    tp.id AS proposal_id,
    tp.title AS proposal_title,
    tp.creator_id,
    u.name AS creator_name,
    u.email AS creator_email,
    u.phone AS creator_phone,
    tp.description,
    tp.required_skills,
    tp.max_members,
    (SELECT COUNT(*) FROM Team_Members tm WHERE tm.proposal_id = tp.id) AS current_members,
    tp.application_count,
    tp.deadline,
    tp.status,
    tp.closed_at,
    (SELECT COUNT(*) FROM Reported_Proposals rp WHERE rp.proposal_id = tp.id) AS report_count
FROM Team_Proposals tp
JOIN Users u ON tp.creator_id = u.id;

-- 3. Student Profile View
CREATE OR REPLACE VIEW Student_Profile_View AS
SELECT 
    u.id, 
    u.name, 
    u.email,
    u.bio, 
    u.major,
    u.grad_year,
    u.phone,
    u.profile_photo_url,
    u.resume_text,
    sr.influence_score, 
    sr.collaborations_count,
    (SELECT GROUP_CONCAT(skill_name SEPARATOR ', ') FROM Student_Skills WHERE user_id = u.id) AS skills
FROM Users u
LEFT JOIN Student_Reputation sr ON u.id = sr.user_id
WHERE u.role = 'student';

-- 4. Accepted Contacts View — only exposes contact details for accepted members of a proposal
CREATE OR REPLACE VIEW Accepted_Contact_View AS
SELECT
    a.proposal_id,
    u.id AS user_id,
    u.name,
    u.email,
    u.phone,
    u.major,
    tp.title AS proposal_title,
    tp.creator_id
FROM Applications a
JOIN Users u ON a.applicant_id = u.id
JOIN Team_Proposals tp ON a.proposal_id = tp.id
WHERE a.status = 'accepted';
