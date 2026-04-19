USE defaultdb;

DELIMITER //

-- 1. Iterating proposals to generate reports
DROP PROCEDURE IF EXISTS sp_generate_proposal_report;
CREATE PROCEDURE sp_generate_proposal_report()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE p_title VARCHAR(200);
    DECLARE p_app_count INT;
    DECLARE p_cursor CURSOR FOR SELECT title, application_count FROM Team_Proposals;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    
    CREATE TEMPORARY TABLE IF NOT EXISTS Temp_Proposal_Report (
        title VARCHAR(200),
        app_count INT
    );
    TRUNCATE TABLE Temp_Proposal_Report;

    OPEN p_cursor;
    read_loop: LOOP
        FETCH p_cursor INTO p_title, p_app_count;
        IF done THEN
            LEAVE read_loop;
        END IF;
        INSERT INTO Temp_Proposal_Report VALUES (p_title, p_app_count);
    END LOOP;
    CLOSE p_cursor;
    
    SELECT * FROM Temp_Proposal_Report;
END; //

-- 2. Listing applicants per proposal
DROP PROCEDURE IF EXISTS sp_list_applicants;
CREATE PROCEDURE sp_list_applicants(IN p_proposal_id INT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE a_name VARCHAR(100);
    DECLARE a_status VARCHAR(20);
    DECLARE app_cursor CURSOR FOR 
        SELECT u.name, a.status 
        FROM Applications a 
        JOIN Users u ON a.applicant_id = u.id 
        WHERE a.proposal_id = p_proposal_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    
    CREATE TEMPORARY TABLE IF NOT EXISTS Temp_Applicants (
        applicant_name VARCHAR(100),
        status VARCHAR(20)
    );
    TRUNCATE TABLE Temp_Applicants;

    OPEN app_cursor;
    app_loop: LOOP
        FETCH app_cursor INTO a_name, a_status;
        IF done THEN
            LEAVE app_loop;
        END IF;
        INSERT INTO Temp_Applicants VALUES (a_name, a_status);
    END LOOP;
    CLOSE app_cursor;
    
    SELECT * FROM Temp_Applicants;
END; //

-- 3. Generating influence score report
DROP PROCEDURE IF EXISTS sp_influence_score_report;
CREATE PROCEDURE sp_influence_score_report()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE u_name VARCHAR(100);
    DECLARE u_score INT;
    DECLARE inf_cursor CURSOR FOR 
        SELECT u.name, sr.influence_score 
        FROM Users u 
        JOIN Student_Reputation sr ON u.id = sr.user_id 
        ORDER BY sr.influence_score DESC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    
    CREATE TEMPORARY TABLE IF NOT EXISTS Temp_Influence_Report (
        student_name VARCHAR(100),
        score INT
    );
    TRUNCATE TABLE Temp_Influence_Report;

    OPEN inf_cursor;
    inf_loop: LOOP
        FETCH inf_cursor INTO u_name, u_score;
        IF done THEN
            LEAVE inf_loop;
        END IF;
        INSERT INTO Temp_Influence_Report VALUES (u_name, u_score);
    END LOOP;
    CLOSE inf_cursor;
    
    SELECT * FROM Temp_Influence_Report;
END; //

-- 4. Skill popularity report
DROP PROCEDURE IF EXISTS sp_skill_popularity_report;
CREATE PROCEDURE sp_skill_popularity_report()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE s_name VARCHAR(50);
    DECLARE s_count INT;
    DECLARE skill_cursor CURSOR FOR 
        SELECT skill_name, COUNT(user_id) as freq 
        FROM Student_Skills 
        GROUP BY skill_name 
        ORDER BY freq DESC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    
    CREATE TEMPORARY TABLE IF NOT EXISTS Temp_Skill_Report (
        skill VARCHAR(50),
        user_count INT
    );
    TRUNCATE TABLE Temp_Skill_Report;

    OPEN skill_cursor;
    skill_loop: LOOP
        FETCH skill_cursor INTO s_name, s_count;
        IF done THEN
            LEAVE skill_loop;
        END IF;
        INSERT INTO Temp_Skill_Report VALUES (s_name, s_count);
    END LOOP;
    CLOSE skill_cursor;
    
    SELECT * FROM Temp_Skill_Report;
END; //

-- 5. Collaboration summary report
DROP PROCEDURE IF EXISTS sp_collaboration_summary;
CREATE PROCEDURE sp_collaboration_summary()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE u_name VARCHAR(100);
    DECLARE collab_c INT;
    DECLARE col_cursor CURSOR FOR 
        SELECT u.name, sr.collaborations_count 
        FROM Users u 
        JOIN Student_Reputation sr ON u.id = sr.user_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    
    CREATE TEMPORARY TABLE IF NOT EXISTS Temp_Collab_Report (
        student VARCHAR(100),
        collab_count INT
    );
    TRUNCATE TABLE Temp_Collab_Report;

    OPEN col_cursor;
    col_loop: LOOP
        FETCH col_cursor INTO u_name, collab_c;
        IF done THEN
            LEAVE col_loop;
        END IF;
        INSERT INTO Temp_Collab_Report VALUES (u_name, collab_c);
    END LOOP;
    CLOSE col_cursor;
    
    SELECT * FROM Temp_Collab_Report;
END; //

-- 6. Proposal summary report
DROP PROCEDURE IF EXISTS sp_proposal_summary;
CREATE PROCEDURE sp_proposal_summary()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE prop_title VARCHAR(200);
    DECLARE stat VARCHAR(20);
    DECLARE req VARCHAR(200);
    DECLARE prop_cursor CURSOR FOR 
        SELECT title, status, required_skills 
        FROM Team_Proposals;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    
    CREATE TEMPORARY TABLE IF NOT EXISTS Temp_Prop_Sum (
        title VARCHAR(200),
        status VARCHAR(20),
        req_skills VARCHAR(200)
    );
    TRUNCATE TABLE Temp_Prop_Sum;

    OPEN prop_cursor;
    prop_loop: LOOP
        FETCH prop_cursor INTO prop_title, stat, req;
        IF done THEN
            LEAVE prop_loop;
        END IF;
        INSERT INTO Temp_Prop_Sum VALUES (prop_title, stat, req);
    END LOOP;
    CLOSE prop_cursor;
    
    SELECT * FROM Temp_Prop_Sum;
END; //

-- 7. Recommendation iteration (simple loop)
DROP PROCEDURE IF EXISTS sp_recommendations;
CREATE PROCEDURE sp_recommendations(IN p_user_id INT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE rec_name VARCHAR(100);
    DECLARE shared_course VARCHAR(200);
    -- Find users who share courses with the given user_id
    DECLARE rec_cursor CURSOR FOR 
        SELECT u2.name, c.course_name
        FROM Student_Courses sc1
        JOIN Student_Courses sc2 ON sc1.course_id = sc2.course_id AND sc1.user_id != sc2.user_id
        JOIN Users u2 ON sc2.user_id = u2.id
        JOIN Courses c ON sc1.course_id = c.id
        WHERE sc1.user_id = p_user_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    
    CREATE TEMPORARY TABLE IF NOT EXISTS Temp_Recommendations (
        recommended_student VARCHAR(100),
        shared_course VARCHAR(200)
    );
    TRUNCATE TABLE Temp_Recommendations;

    OPEN rec_cursor;
    rec_loop: LOOP
        FETCH rec_cursor INTO rec_name, shared_course;
        IF done THEN
            LEAVE rec_loop;
        END IF;
        INSERT INTO Temp_Recommendations VALUES (rec_name, shared_course);
    END LOOP;
    CLOSE rec_cursor;
    
    -- Filter out distinct to avoid duplicates if multiple shared courses (or just show all overlaps)
    SELECT DISTINCT * FROM Temp_Recommendations;
END; //

-- 8. Handle capacity reduction: When max_members is lowered, iterate pending applications
--    and auto-reject those that exceed the new capacity limit.
DROP PROCEDURE IF EXISTS sp_handle_capacity_reduction;
CREATE PROCEDURE sp_handle_capacity_reduction(IN p_proposal_id INT, IN new_max INT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE app_id INT;
    DECLARE current_accepted INT;

    -- First count how many are already accepted
    SELECT COUNT(*) INTO current_accepted
    FROM Applications
    WHERE proposal_id = p_proposal_id AND status = 'accepted';

    -- If accepted count already meets/exceeds new max, reject ALL remaining pending ones
    -- Use a cursor to iterate over pending applications and reject them one by one
    BEGIN
        DECLARE pending_cursor CURSOR FOR
            SELECT id FROM Applications
            WHERE proposal_id = p_proposal_id
            AND status = 'pending'
            ORDER BY applied_at ASC;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

        OPEN pending_cursor;
        reject_loop: LOOP
            FETCH pending_cursor INTO app_id;
            IF done THEN
                LEAVE reject_loop;
            END IF;

            -- If accepted members already fill the new capacity, reject this pending applicant
            IF current_accepted >= new_max THEN
                UPDATE Applications SET status = 'rejected' WHERE id = app_id;
                -- Log rejection
                INSERT INTO Activity_Log (user_id, proposal_id, action_type, description)
                SELECT applicant_id, p_proposal_id, 'REJECTED',
                       'Auto-rejected: proposal capacity was reduced by creator'
                FROM Applications WHERE id = app_id;
            END IF;
        END LOOP;
        CLOSE pending_cursor;
    END;
END; //

DELIMITER ;
