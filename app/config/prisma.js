require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const dbUrl = process.env.DATABASE_URL || '';
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
console.log('Initializing DB connection with URL:', maskedUrl);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
