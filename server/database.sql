
/* choose database name of your choosing */

CREATE DATABASE user_management_project;

\connect user_management_project;


CREATE TYPE roles as ENUM ('User', 'Admin', 'Ghost');

CREATE TABLE users (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  username VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password text NOT NULL,
  role roles NOT NULL
);

CREATE TABLE refresh_tokens (
  id BIGSERIAL NOT NULL PRIMARY KEY,
  token text NOT NULL,
  user_id BIGSERIAL references users(id)
);
