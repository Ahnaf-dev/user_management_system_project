// configure settings after creating database from server/database.sql

const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  password: "test123",
  host: "localhost",
  port: 5432,
  database: "user_management_project",
});

module.exports = pool;
