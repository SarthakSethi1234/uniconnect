require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Connected to Aiven database for seeding.');

    const seedPath = path.join(__dirname, '../database/seed.sql');
    let seedSql = fs.readFileSync(seedPath, 'utf8');

    // Remove the USE uniconnect statement to adapt to Aiven
    seedSql = seedSql.replace(/USE uniconnect;/g, '');

    console.log('⏳ Seeding database with courses and admin account...');
    await connection.query(seedSql);
    console.log('✅ Seeding complete!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
    process.exit(1);
  }
}

seedDatabase();
