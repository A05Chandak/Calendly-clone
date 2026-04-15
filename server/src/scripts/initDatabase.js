import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const rootDir = path.resolve(currentDir, "../..");
const sqlDir = path.join(rootDir, "sql");

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true
});

try {
  const dbName = process.env.DB_NAME || "calendly_clone";
  const schema = await fs.readFile(path.join(sqlDir, "schema.sql"), "utf8");
  const seed = await fs.readFile(path.join(sqlDir, "seed.sql"), "utf8");

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.query(`USE \`${dbName}\``);
  await connection.query(schema);
  await connection.query(seed);
  console.log(`Database ${dbName} initialized successfully.`);
} finally {
  await connection.end();
}
