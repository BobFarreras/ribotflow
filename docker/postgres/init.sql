-- RIBOTFLOW PostgreSQL Initialization Script
-- Creation/modification date: 21/05/2026
-- Description: Creates the ribotflow database and initial extensions.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database (if running as superuser)
SELECT 'CREATE DATABASE ribotflow'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ribotflow')\gexec
