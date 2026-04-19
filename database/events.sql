USE defaultdb;

DELIMITER //

-- Event 1: Auto-close proposals past their deadline
CREATE EVENT IF NOT EXISTS evt_auto_close_proposals
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
    UPDATE Team_Proposals 
    SET status = 'closed', closed_at = CURRENT_TIMESTAMP
    WHERE status = 'open' AND deadline < CURRENT_DATE;
END //

-- Event 2: Auto-complete proposals that have reached max capacity
CREATE EVENT IF NOT EXISTS evt_auto_complete_full_proposals
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
    UPDATE Team_Proposals tp
    SET tp.status = 'completed', tp.closed_at = CURRENT_TIMESTAMP
    WHERE tp.status = 'open'
    AND (
        SELECT COUNT(*) FROM Team_Members tm WHERE tm.proposal_id = tp.id
    ) >= tp.max_members;
END //

-- Event 3: Archive proposals that have been closed for 3+ days
-- Archived proposals are hidden from the main feed but visible in Past Requests
CREATE EVENT IF NOT EXISTS evt_archive_old_closed_proposals
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    UPDATE Team_Proposals
    SET status = 'archived'
    WHERE status = 'closed'
    AND closed_at IS NOT NULL
    AND TIMESTAMPDIFF(DAY, closed_at, NOW()) >= 3;
END //

DELIMITER ;
