import pg from 'pg';

const databaseName = 'store_erp_local';
const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  database: 'postgres',
});

await client.connect();
const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);

if (result.rowCount === 0) {
  await client.query(`CREATE DATABASE ${databaseName}`);
  console.log(`Created local PostgreSQL database: ${databaseName}`);
} else {
  console.log(`Local PostgreSQL database already exists: ${databaseName}`);
}

await client.end();
