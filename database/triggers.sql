USE defaultdb;

DELIMITER //

-- 1. Auto-update application_count when a user applies
DROP TRIGGER IF EXISTS trg_1_update_app_count;
CREATE TRIGGER trg_1_update_app_count 
AFTER INSERT ON Applications
FOR EACH ROW
BEGIN
    UPDATE Team_Proposals 
    SET application_count = application_count + 1 
    WHERE id = NEW.proposal_id;
END; //

-- 2. Prevent duplicate applications
DROP TRIGGER IF EXISTS trg_2_prevent_duplicate_app;
CREATE TRIGGER trg_2_prevent_duplicate_app 
BEFORE INSERT ON Applications
FOR EACH ROW
BEGIN
    DECLARE existing_count INT;
    SELECT COUNT(*) INTO existing_count FROM Applications 
    WHERE proposal_id = NEW.proposal_id AND applicant_id = NEW.applicant_id;
    
    IF existing_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User has already applied to this proposal.';
    END IF;
END; //

-- 3. Prevent applications if max_members limit reached
DROP TRIGGER IF EXISTS trg_3_prevent_capacity_app;
CREATE TRIGGER trg_3_prevent_capacity_app 
BEFORE INSERT ON Applications
FOR EACH ROW PRECEDES trg_2_prevent_duplicate_app
BEGIN
    DECLARE current_members INT;
    DECLARE max_capacity INT;
    
    SELECT COUNT(*) INTO current_members FROM Team_Members WHERE proposal_id = NEW.proposal_id;
    SELECT max_members INTO max_capacity FROM Team_Proposals WHERE id = NEW.proposal_id;
    
    IF current_members >= max_capacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot apply: Proposal has reached maximum team members capacity.';
    END IF;
END; //

-- 4. Prevent applications after deadline
DROP TRIGGER IF EXISTS trg_4_prevent_late_app;
CREATE TRIGGER trg_4_prevent_late_app 
BEFORE INSERT ON Applications
FOR EACH ROW PRECEDES trg_3_prevent_capacity_app
BEGIN
    DECLARE proposal_deadline DATE;
    SELECT deadline INTO proposal_deadline FROM Team_Proposals WHERE id = NEW.proposal_id;
    
    IF CURRENT_DATE > proposal_deadline THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot apply: The deadline for this proposal has passed.';
    END IF;
END; //

-- 5. Auto-add user to Team_Members when accepted
DROP TRIGGER IF EXISTS trg_5_auto_add_team_member;
CREATE TRIGGER trg_5_auto_add_team_member 
AFTER UPDATE ON Applications
FOR EACH ROW
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        INSERT IGNORE INTO Team_Members (proposal_id, user_id) 
        VALUES (NEW.proposal_id, NEW.applicant_id);
    END IF;
END; //

-- 6. Update Student_Reputation on acceptance (via Team_Members insert)
DROP TRIGGER IF EXISTS trg_6_update_reputation;
CREATE TRIGGER trg_6_update_reputation 
AFTER INSERT ON Team_Members
FOR EACH ROW
BEGIN
    -- Increment collaboration count and influence score for the new member
    UPDATE Student_Reputation 
    SET collaborations_count = collaborations_count + 1,
        influence_score = influence_score + 10
    WHERE user_id = NEW.user_id;

    -- Increment influence score for the proposal creator
    UPDATE Student_Reputation sr
    JOIN Team_Proposals tp ON sr.user_id = tp.creator_id
    SET sr.influence_score = sr.influence_score + 5
    WHERE tp.id = NEW.proposal_id;

    -- Auto-complete proposal if max members reached
    UPDATE Team_Proposals
    SET status = 'completed', closed_at = CURRENT_TIMESTAMP
    WHERE id = NEW.proposal_id
    AND status = 'open'
    AND max_members <= (SELECT COUNT(*) FROM Team_Members WHERE proposal_id = NEW.proposal_id);
END; //

-- Initialize Student_Reputation when a new User is created
DROP TRIGGER IF EXISTS trg_init_reputation;
CREATE TRIGGER trg_init_reputation 
AFTER INSERT ON Users
FOR EACH ROW
BEGIN
    IF NEW.role = 'student' THEN
        INSERT INTO Student_Reputation (user_id, influence_score, collaborations_count)
        VALUES (NEW.id, 0, 0);
    END IF;
END; //

-- 7. Log actions into Activity_Log
DROP TRIGGER IF EXISTS trg_7_log_app_action;
CREATE TRIGGER trg_7_log_app_action 
AFTER UPDATE ON Applications
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO Activity_Log (user_id, proposal_id, action_type, description)
        VALUES (NEW.applicant_id, NEW.proposal_id, UPPER(NEW.status), 
                CONCAT('Application has been ', NEW.status));
    END IF;
END; //

-- Log apply action into Activity_Log
DROP TRIGGER IF EXISTS trg_7a_log_apply_action;
CREATE TRIGGER trg_7a_log_apply_action
AFTER INSERT ON Applications
FOR EACH ROW
BEGIN
    INSERT INTO Activity_Log (user_id, proposal_id, action_type, description)
    VALUES (NEW.applicant_id, NEW.proposal_id, 'APPLY', 'User applied to proposal');
END; //

-- 8. Reverse update application_count when user withdraws
DROP TRIGGER IF EXISTS trg_8_decrement_app_count;
CREATE TRIGGER trg_8_decrement_app_count 
AFTER DELETE ON Applications
FOR EACH ROW
BEGIN
    UPDATE Team_Proposals 
    SET application_count = application_count - 1 
    WHERE id = OLD.proposal_id;
END; //

-- 9. Reverse Student_Reputation when participant removed
DROP TRIGGER IF EXISTS trg_9_decrement_reputation;
CREATE TRIGGER trg_9_decrement_reputation 
AFTER DELETE ON Team_Members
FOR EACH ROW
BEGIN
    -- Decrement collaboration count and influence score for the removed member
    UPDATE Student_Reputation 
    SET collaborations_count = GREATEST(collaborations_count - 1, 0),
        influence_score = GREATEST(influence_score - 10, 0)
    WHERE user_id = OLD.user_id;

    -- Decrement influence score for the proposal creator
    UPDATE Student_Reputation sr
    JOIN Team_Proposals tp ON sr.user_id = tp.creator_id
    SET sr.influence_score = GREATEST(sr.influence_score - 5, 0)
    WHERE tp.id = OLD.proposal_id;
END; //

-- 10. Validate proposal edits
DROP TRIGGER IF EXISTS trg_10_validate_proposal_edit;
CREATE TRIGGER trg_10_validate_proposal_edit
BEFORE UPDATE ON Team_Proposals
FOR EACH ROW
BEGIN
    -- Prevent editing a proposal that is already closed, archived, or completed
    IF OLD.status IN ('closed', 'completed', 'archived') AND
       (NEW.title != OLD.title OR NEW.description != OLD.description OR
        NEW.required_skills != OLD.required_skills OR NEW.max_members != OLD.max_members OR
        NEW.deadline != OLD.deadline) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot edit a proposal that is already closed or completed.';
    END IF;

    -- Prevent setting deadline to a past date
    IF NEW.deadline < CURRENT_DATE AND NEW.deadline != OLD.deadline THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Deadline cannot be set to a past date.';
    END IF;

    -- Log the edit in Activity_Log
    IF NEW.title != OLD.title OR NEW.description != OLD.description OR
       NEW.required_skills != OLD.required_skills OR NEW.max_members != OLD.max_members OR
       NEW.deadline != OLD.deadline THEN
        INSERT INTO Activity_Log (user_id, proposal_id, action_type, description)
        VALUES (NEW.creator_id, NEW.id, 'EDIT', CONCAT('Proposal updated: ', NEW.title));
    END IF;
END; //

-- 11. Validate new user email and phone number
DROP TRIGGER IF EXISTS trg_users_insert_val;
CREATE TRIGGER trg_users_insert_val
BEFORE INSERT ON Users
FOR EACH ROW
BEGIN
    IF NEW.email NOT LIKE '%@gmail.com' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email must be a valid email (@gmail.com)';
    END IF;
    IF NEW.phone IS NOT NULL AND NEW.phone NOT REGEXP '^[0-9]{10}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phone number must be exactly 10 digits';
    END IF;
END; //

-- 12. Validate updated user email and phone number
DROP TRIGGER IF EXISTS trg_users_update_val;
CREATE TRIGGER trg_users_update_val
BEFORE UPDATE ON Users
FOR EACH ROW
BEGIN
    IF NEW.email NOT LIKE '%@gmail.com' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email must be a valid email (@gmail.com)';
    END IF;
    IF NEW.phone IS NOT NULL AND NEW.phone NOT REGEXP '^[0-9]{10}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phone number must be exactly 10 digits';
    END IF;
END; //

DELIMITER ;
