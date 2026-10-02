-- SSC Transparency PostgreSQL Initialization Script
-- Runs automatically when the ssc_postgres Docker container is first created.

SELECT 'CREATE DATABASE ssc_transparency'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ssc_transparency')\gexec

ALTER DATABASE ssc_transparency SET timezone TO 'Asia/Manila';
