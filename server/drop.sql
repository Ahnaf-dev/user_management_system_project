/* When done testing API, switch to default database and delete the local database for this project */

\connect postgres;

DELETE DATABASE user_management_project;
