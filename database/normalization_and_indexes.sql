-- ============================================================
-- UniConnect — 3NF Normalization Fixes & Performance Indexes
-- Run AFTER schema.sql and seed data.
-- Compatible with MySQL 8+ / 9+
-- ============================================================

USE uniconnect;

-- ============================================================
-- SECTION 1: 3NF NORMALIZATION
-- ============================================================
-- Issue: Team_Proposals.required_skills is a CSV string,
--        violating 1NF (non-atomic multi-valued attribute).
--
-- Fix:   Introduce a Proposal_Skills junction table.
--        The CSV column is kept as a fast-read cache.
-- ============================================================

CREATE TABLE IF NOT EXISTS Proposal_Skills (
    proposal_id  INT          NOT NULL,
    skill_name   VARCHAR(100) NOT NULL,
    PRIMARY KEY (proposal_id, skill_name),
    FOREIGN KEY (proposal_id) REFERENCES Team_Proposals(id) ON DELETE CASCADE
);

-- ============================================================
-- SECTION 2: PERFORMANCE INDEXES
-- MySQL does not support CREATE INDEX IF NOT EXISTS.
-- We use a stored procedure to safely skip existing indexes.
-- ============================================================

DROP PROCEDURE IF EXISTS add_index_safe;

DELIMITER //
CREATE PROCEDURE add_index_safe(
    IN tbl  VARCHAR(64),
    IN idx  VARCHAR(64),
    IN cols VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE table_schema = DATABASE()
          AND table_name   = tbl
          AND index_name   = idx
    ) THEN
        SET @stmt = CONCAT('CREATE INDEX `', idx, '` ON `', tbl, '` (', cols, ')');
        PREPARE s FROM @stmt;
        EXECUTE s;
        DEALLOCATE PREPARE s;
    END IF;
END //
DELIMITER ;

-- --- Team_Proposals ---
CALL add_index_safe('Team_Proposals', 'idx_proposals_status',          'status');
CALL add_index_safe('Team_Proposals', 'idx_proposals_creator',         'creator_id');
CALL add_index_safe('Team_Proposals', 'idx_proposals_status_deadline', 'status, deadline');

-- --- Applications ---
CALL add_index_safe('Applications', 'idx_applications_proposal',  'proposal_id');
CALL add_index_safe('Applications', 'idx_applications_applicant', 'applicant_id');
CALL add_index_safe('Applications', 'idx_applications_composite', 'proposal_id, applicant_id, status');

-- --- Team_Members ---
CALL add_index_safe('Team_Members', 'idx_team_members_proposal', 'proposal_id');
CALL add_index_safe('Team_Members', 'idx_team_members_user',     'user_id');

-- --- Student_Skills ---
CALL add_index_safe('Student_Skills', 'idx_skills_user', 'user_id');
CALL add_index_safe('Student_Skills', 'idx_skills_name', 'skill_name');

-- --- Users ---
CALL add_index_safe('Users', 'idx_users_major', 'major');

-- --- Activity_Log ---
CALL add_index_safe('Activity_Log', 'idx_activity_user',      'user_id');
CALL add_index_safe('Activity_Log', 'idx_activity_proposal',  'proposal_id');
CALL add_index_safe('Activity_Log', 'idx_activity_timestamp', 'timestamp');

-- --- Reported_Proposals ---
CALL add_index_safe('Reported_Proposals', 'idx_reports_status',   'status');
CALL add_index_safe('Reported_Proposals', 'idx_reports_proposal', 'proposal_id');

-- --- Student_Courses ---
CALL add_index_safe('Student_Courses', 'idx_student_courses_user',   'user_id');
CALL add_index_safe('Student_Courses', 'idx_student_courses_course', 'course_id');

-- --- Student_Reputation ---
CALL add_index_safe('Student_Reputation', 'idx_reputation_score', 'influence_score');

DROP PROCEDURE IF EXISTS add_index_safe;

-- ============================================================
-- VERIFY: Show all custom indexes created
-- ============================================================
SELECT
    table_name  AS `Table`,
    index_name  AS `Index`,
    column_name AS `Columns`
FROM information_schema.STATISTICS
WHERE table_schema = 'uniconnect'
  AND index_name LIKE 'idx_%'
ORDER BY table_name, index_name;

-- ============================================================
-- SECTION 3: CHAT FEATURE SCAFFOLD (commented — uncomment to enable)
-- ============================================================
-- CREATE TABLE IF NOT EXISTS Chat_Messages (
--     id           INT AUTO_INCREMENT PRIMARY KEY,
--     proposal_id  INT  NOT NULL,
--     sender_id    INT  NOT NULL,
--     message      TEXT NOT NULL,
--     sent_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (proposal_id) REFERENCES Team_Proposals(id) ON DELETE CASCADE,
--     FOREIGN KEY (sender_id)   REFERENCES Users(id)         ON DELETE CASCADE
-- );
-- CALL add_index_safe('Chat_Messages', 'idx_chat_proposal', 'proposal_id, sent_at');
