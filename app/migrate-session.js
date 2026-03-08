require('dotenv').config();
const { Pool } = require('pg');

async function migrateSession() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS "session" (
                "sid" varchar NOT NULL COLLATE "default",
                "sess" json NOT NULL,
                "expire" timestamp(6) NOT NULL,
                CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`);
        console.log('Session table migrated successfully');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}
migrateSession();
