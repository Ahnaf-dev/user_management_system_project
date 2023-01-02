/* When done testing API, switch to default database and delete the local database for this project */

\connect postgres;

DROP DATABASE user_management_project;
