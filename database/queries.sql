-- UniConnect Sample Key Queries
USE uniconnect;

-- 1. Recommendation System
-- Recommending students based on sharing the same course
SELECT DISTINCT u1.name AS student_1, u2.name AS student_2, c.course_name 
FROM Student_Courses sc1
JOIN Student_Courses sc2 ON sc1.course_id = sc2.course_id 
    AND sc1.user_id < sc2.user_id -- prevent a-b, b-a duplicates
JOIN Users u1 ON sc1.user_id = u1.id
JOIN Users u2 ON sc2.user_id = u2.id
JOIN Courses c ON sc1.course_id = c.id;

-- 2. Skill Popularity Analytics
-- Count most common skills using GROUP BY
SELECT skill_name, COUNT(*) AS usage_count 
FROM Student_Skills 
GROUP BY skill_name 
ORDER BY usage_count DESC 
LIMIT 10;

-- 3. Collaboration Tracking
-- Find students who worked together in a team
SELECT tp.title AS project, u1.name AS collaborator_1, u2.name AS collaborator_2
FROM Team_Members tm1
JOIN Team_Members tm2 ON tm1.proposal_id = tm2.proposal_id 
    AND tm1.user_id < tm2.user_id
JOIN Users u1 ON tm1.user_id = u1.id
JOIN Users u2 ON tm2.user_id = u2.id
JOIN Team_Proposals tp ON tm1.proposal_id = tp.id;

-- 4. Academic Influence Score Generation 
-- (If calculating manually instead of using Student_Reputation field)
SELECT 
    u.name,
    (SELECT COUNT(*) FROM Team_Proposals tp WHERE tp.creator_id = u.id) * 5 + 
    (SELECT COUNT(*) FROM Team_Members tm WHERE tm.user_id = u.id) * 10 AS calculated_influence_score
FROM Users u
WHERE u.role = 'student'
ORDER BY calculated_influence_score DESC;

-- 5. Team Compatibility Score
-- For a given Proposal (e.g., ID=1) and a given student applicant (e.g., ID=2)
-- Score +1 for matching skills
SELECT 
    u.name AS applicant_name,
    tp.title AS proposal_title,
    (
        SELECT COUNT(*) 
        FROM Student_Skills ss 
        WHERE ss.user_id = u.id AND tp.required_skills LIKE CONCAT('%', ss.skill_name, '%')
    ) AS compatibility_score
FROM Users u
CROSS JOIN Team_Proposals tp
WHERE u.id = 2 AND tp.id = 1;
