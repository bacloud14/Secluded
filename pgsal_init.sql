-- run: psql -U postgres -d secluded -f test.sql
CREATE DATABASE secluded WITH OWNER = postgres ENCODING = 'UTF8' TABLESPACE = pg_default CONNECTION LIMIT = -1;
CREATE SCHEMA 'STATIC_CONTENT' AUTHORIZATION postgres;
-- LC_COLLATE = 'English_United States.1252' LC_CTYPE = 'English_United States.1252'