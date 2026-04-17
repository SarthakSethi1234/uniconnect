require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDatabaseFiles() {
  try {
    console.log(`Connecting to: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
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

    console.log('✅ Connected to Aiven database successfully.');

    // 1. Read the schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Remove the CREATE DATABASE and USE uniconnect statements 
    // because Aiven forces us to use 'defaultdb' and restricts database creation
    schemaSql = schemaSql.replace(/CREATE DATABASE IF NOT EXISTS uniconnect;/g, '');
    schemaSql = schemaSql.replace(/USE uniconnect;/g, '');

    console.log('⏳ Creating tables...');
    await connection.query(schemaSql);
    console.log('✅ Tables created successfully!');

    // 2. Load basic seed data if you have any
    // (Optional: you can also read triggers.sql here later if needed)

    console.log('🎉 Database setup is fully complete!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error setting up database:', err.message);
    process.exit(1);
  }
}

importDatabaseFiles();
