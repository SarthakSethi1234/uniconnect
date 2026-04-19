require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_key_123';

const dbConfig = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'uniconnect',
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306
};

const pool = mysql.createPool(dbConfig);

/* ---------- MIDDLEWARE ---------- */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Access denied. No token provided.' });
  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required.' });
  }
};

/* ---------- AUTHENTICATION & LOGIN REGISTRATION ---------- */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, bio, major, grad_year, role } = req.body;
    const userRole = role === 'admin' ? 'admin' : 'student';
    
    // Check existing
    const [existing] = await pool.query('SELECT email FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already in use.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO Users (name, email, password_hash, bio, major, grad_year, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, bio, major || null, grad_year || null, userRole]
    );

    res.json({ success: true, message: 'User registered successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
    
    if (users.length === 0) return res.status(400).json({ error: 'Invalid email or password.' });
    const user = users[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
    
    res.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role }});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ---------- USERS & PROFILES ---------- */
// Get profile based on token
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Student_Profile_View WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Resume Text
app.post('/api/users/resume', authenticateToken, async (req, res) => {
  try {
    const { resume_text } = req.body;
    await pool.query('UPDATE Users SET resume_text = ? WHERE id = ?', [resume_text, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Full Profile Update (name, bio, major, grad_year, phone, photo, skills)
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { name, bio, major, grad_year, phone, profile_photo_url, skills } = req.body;
    await conn.beginTransaction();

    await conn.execute(
      'UPDATE Users SET name = ?, bio = ?, major = ?, grad_year = ?, phone = ?, profile_photo_url = ? WHERE id = ?',
      [name, bio, major, grad_year || null, phone || null, profile_photo_url || null, req.user.id]
    );
    // Update skills: delete all then re-insert
    if (skills !== undefined) {
      await conn.execute('DELETE FROM Student_Skills WHERE user_id = ?', [req.user.id]);
      if (skills && skills.trim()) {
        const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
        for (const skill of skillList) {
          await conn.execute('INSERT IGNORE INTO Student_Skills (user_id, skill_name) VALUES (?, ?)', [req.user.id, skill]);
        }
      }
    }

    await conn.commit();
    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// Search available users with optional major filter
app.get('/api/users/search', authenticateToken, async (req, res) => {
  try {
    const { major } = req.query;
    let query = 'SELECT * FROM Student_Profile_View';
    const params = [];
    if (major) {
      query += ' WHERE major = ?';
      params.push(major);
    }
    const [users] = await pool.query(query, params);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get distinct majors for filter dropdown
app.get('/api/users/majors', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT major FROM Users WHERE role = "student" AND major IS NOT NULL ORDER BY major');
    res.json(rows.map(r => r.major));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ---------- COURSES ---------- */
app.get('/api/courses', async (req, res) => {
  try {
    const [courses] = await pool.query('SELECT * FROM Courses ORDER BY course_name');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------- PROPOSALS ---------- */
app.get('/api/proposals', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Proposal_Summary_View WHERE status = "open"');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Active proposals for the current user (creator view)
app.get('/api/proposals/mine/active', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Proposal_Summary_View WHERE creator_id = ? AND status = "open" ORDER BY deadline ASC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Past proposals for the current user (creator view)
app.get('/api/proposals/mine/past', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Proposal_Summary_View WHERE creator_id = ? AND status IN ("closed", "completed", "archived") ORDER BY closed_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/proposals', authenticateToken, async (req, res) => {
  try {
    const { title, description, requiredSkills, maxMembers, deadline } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO Team_Proposals (creator_id, title, description, required_skills, max_members, deadline)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description, requiredSkills, maxMembers, deadline]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit a Proposal (creator only) — Trigger validates, cursor handles capacity reduction
app.put('/api/proposals/:id', authenticateToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const propId = req.params.id;
    const { title, description, requiredSkills, maxMembers, deadline } = req.body;

    // Verify this user is the creator
    const [props] = await conn.query('SELECT creator_id, max_members FROM Team_Proposals WHERE id = ?', [propId]);
    if (props.length === 0) { conn.release(); return res.status(404).json({ error: 'Proposal not found.' }); }
    if (props[0].creator_id !== req.user.id) { conn.release(); return res.status(403).json({ error: 'Only the proposal creator can edit it.' }); }

    const oldMax = props[0].max_members;
    const newMax = parseInt(maxMembers);

    await conn.beginTransaction();

    // Run the UPDATE — the BEFORE UPDATE trigger will validate and log this
    await conn.execute(
      `UPDATE Team_Proposals SET title = ?, description = ?, required_skills = ?, max_members = ?, deadline = ? WHERE id = ?`,
      [title, description, requiredSkills, newMax, deadline, propId]
    );

    // If max_members was reduced, call cursor procedure to auto-reject excess pending applications
    if (newMax < oldMax) {
      await conn.query('CALL sp_handle_capacity_reduction(?, ?)', [propId, newMax]);
    }

    await conn.commit();
    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    // Surface the trigger SIGNAL message cleanly
    const msg = error.sqlMessage || error.message;
    res.status(400).json({ error: msg });
  } finally {
    conn.release();
  }
});

// Apply to Proposal (added for user interaction)
app.post('/api/proposals/:id/apply', authenticateToken, async (req, res) => {
  try {
    await pool.execute(
      'INSERT INTO Applications (proposal_id, applicant_id, status) VALUES (?, ?, "pending")',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Report a Proposal
app.post('/api/proposals/report', authenticateToken, async (req, res) => {
  try {
    const { proposal_id, reason } = req.body;
    await pool.execute(
      'INSERT INTO Reported_Proposals (proposal_id, reported_by, reason) VALUES (?, ?, ?)',
      [proposal_id, req.user.id, reason]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accepted contacts reveal — only for creator or fellow accepted member
app.get('/api/proposals/:id/accepted-contacts', authenticateToken, async (req, res) => {
  try {
    const propId = req.params.id;
    const userId = req.user.id;

    // Check if requester is the creator or an accepted member
    const [prop] = await pool.query('SELECT creator_id FROM Team_Proposals WHERE id = ?', [propId]);
    if (prop.length === 0) return res.status(404).json({ error: 'Proposal not found.' });

    const isCreator = prop[0].creator_id === userId;
    const [membership] = await pool.query(
      'SELECT * FROM Applications WHERE proposal_id = ? AND applicant_id = ? AND status = "accepted"',
      [propId, userId]
    );
    const isAccepted = membership.length > 0;

    if (!isCreator && !isAccepted) {
      return res.status(403).json({ error: 'Contact details are only visible to accepted members.' });
    }

    const [contacts] = await pool.query(
      'SELECT * FROM Accepted_Contact_View WHERE proposal_id = ?',
      [propId]
    );
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------- APPLICATION WORKFLOW & MODERATION (Creators & Users) ---------- */

// Withdraw Application (Users pulling themselves out)
app.delete('/api/applications/withdraw/:proposalId', authenticateToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const propId = req.params.proposalId;
    await conn.beginTransaction();
    // Delete from both tables atomically — if either fails, neither change persists
    await conn.execute('DELETE FROM Applications WHERE proposal_id = ? AND applicant_id = ?', [propId, req.user.id]);
    await conn.execute('DELETE FROM Team_Members WHERE proposal_id = ? AND user_id = ?', [propId, req.user.id]);
    await conn.commit();
    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// Kick Participant out (Creator action)
app.delete('/api/proposals/:id/members/:userId', authenticateToken, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const propId = req.params.id;
    const targetUserId = req.params.userId;

    // Verify Creator
    const [props] = await conn.query('SELECT creator_id FROM Team_Proposals WHERE id = ?', [propId]);
    if (props.length === 0 || props[0].creator_id !== req.user.id) {
      conn.release();
      return res.status(403).json({ error: 'Not the creator of this proposal.' });
    }

    await conn.beginTransaction();
    // Remove from team and mark application rejected atomically
    await conn.execute('DELETE FROM Team_Members WHERE proposal_id = ? AND user_id = ?', [propId, targetUserId]);
    await conn.execute('UPDATE Applications SET status = "rejected" WHERE proposal_id = ? AND applicant_id = ?', [propId, targetUserId]);
    await conn.commit();

    res.json({ success: true });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
});

// Application endpoints
app.get('/api/applications/dashboard', authenticateToken, async (req, res) => {
  try {
    const [incoming] = await pool.query(`
      SELECT a.id, a.applicant_id as applicantId, u.name as applicantName, tp.title as proposalTitle, tp.id as proposalId, a.status, a.applied_at as appliedAt, u.resume_text
      FROM Applications a
      JOIN Team_Proposals tp ON a.proposal_id = tp.id
      JOIN Users u ON a.applicant_id = u.id
      WHERE tp.creator_id = ? AND a.status != 'rejected'
    `, [req.user.id]);
    
    const [sent] = await pool.query(`
      SELECT a.id, tp.title as proposalTitle, tp.id as proposalId, a.status, a.applied_at as appliedAt
      FROM Applications a
      JOIN Team_Proposals tp ON a.proposal_id = tp.id
      WHERE a.applicant_id = ?
    `, [req.user.id]);
    
    res.json({ incoming, sent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/applications/:id/status', authenticateToken, async (req, res) => {
  try {
    const { action } = req.body; // 'accepted' or 'rejected'
    if (action !== 'accepted' && action !== 'rejected') return res.status(400).json({ error: 'Invalid action' });
    
    if (action === 'accepted') {
      // Check capacity
      const [appInfo] = await pool.query(`
        SELECT a.proposal_id, tp.max_members,
               (SELECT COUNT(*) FROM Team_Members WHERE proposal_id = a.proposal_id) as current_members
        FROM Applications a
        JOIN Team_Proposals tp ON a.proposal_id = tp.id
        WHERE a.id = ?
      `, [req.params.id]);

      if (appInfo.length > 0) {
        const { max_members, current_members } = appInfo[0];
        if (current_members >= max_members) {
          return res.status(400).json({ error: 'Team is already at full capacity.' });
        }
      }
    }

    await pool.execute('UPDATE Applications SET status = ? WHERE id = ?', [action, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------- ADMIN MODULE ---------- */
// Get Dashboard Stats & Flags
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM Admin_Management_View');
    const [reported] = await pool.query(`
      SELECT rp.id AS report_id, tp.title, u.name as reporter, rp.reason, rp.created_at, tp.id as proposal_id
      FROM Reported_Proposals rp
      JOIN Team_Proposals tp ON rp.proposal_id = tp.id
      JOIN Users u ON rp.reported_by = u.id
      WHERE rp.status = 'pending'
    `);

    res.json({ users, reported });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete User
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.execute('DELETE FROM Users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dismiss Report (Mark as dismissed instead of deleting the proposal)
app.put('/api/admin/reports/:id/dismiss', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.execute('UPDATE Reported_Proposals SET status = "dismissed" WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Proposal (Cascades to Reports, Applications, Members)
app.delete('/api/admin/proposals/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.execute('DELETE FROM Team_Proposals WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------- ANALYTICS FOR DEMO ---------- */
app.get('/api/analytics/skills', async (req, res) => {
  try {
    const [rows] = await pool.query('CALL sp_skill_popularity_report()');
    res.json(rows[0] ? rows[0] : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/recommendations', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('CALL sp_recommendations(?)', [req.user.id]); 
    res.json(rows[0] ? rows[0] : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Enhanced UniConnect API running on port ' + PORT);
});
