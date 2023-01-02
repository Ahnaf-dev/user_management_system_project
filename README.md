# user_management_system_project

## Instructions To Run Locally

To run the project and test the API, we must go through the following steps.

1. Download GitHub Repo as a zip, extract it and open it in a code editor.
2. Make sure you have NodeJS installed (https://nodejs.org/en/) and type npm install on the root folder in a terminal to install the neccesary dependencies of this project.
3. Install PostgreSQL
4. Locally setup the database and tables
5. Configure database settings
6. Run node server
7. Test the API

### Installing PostgreSQL

For the API endpoints to work, you need to locally setup PostgreSQL. Here is a short video on how to install PostgreSQL and to get comfortable with the SQL shell (psql)
https://www.youtube.com/watch?v=BLH3s5eTL4Y

### Locally setting up database and tables

Once you have installed PostgreSQL and have access to the SQL shell (psql), you can head over to database.sql file in the project and copy paste the code into the SQL shell (psql). What it will do is create a database, connect to it and set the necessary tables for this project. You may choose to customize the database names.

![image](https://user-images.githubusercontent.com/52428475/210263940-c85d42b7-ec77-483c-89cb-71580bfe0320.png)

### Configuring Database Settings

Once you have done the above, we need to configure the database settings so that the nodeJS server can connect to your local database. Head over to server/database_config/config.js.

Here the user, host and port are set to PostgreSQL defaults, you need to enter your password for PostgreSQL and name of the database that you have created above.

![image](https://user-images.githubusercontent.com/52428475/210264260-b2c80232-0434-4f4e-8a54-871db578b94b.png)

### Running Node Server

Now when you have configured the settings to connect to your local database, you may start the server. To start the server, type npm run dev in the terminal or npm run start. It should say Succesfully connected to port 5000 when it is succesfully ran.

![image](https://user-images.githubusercontent.com/52428475/210264546-460a14b0-453f-4829-a2dc-bdbd1b351a9c.png)

### Testing API

If all the above steps went correctly, the API endpoints should be able to work. So now you can test the API. 

There are many ways to test the API, the easiest option would be to head over to http://localhost:5000/api-docs/ where everything is setup for testing.

Another way to test the API is to type npm run test on the terminal, this will run tests on all the API endpoints.

Another way is to use an API testing tool like postman or the VSCODE thunder client extension.

Once done with testing, you may switch to the default PostgreSQL database and delete the one created for this project. Drop.sql file in the project has those statements.

### Testing Snippets

#### Register

![image](https://user-images.githubusercontent.com/52428475/210265064-8b8468f9-92fe-4ee2-ae95-4d2fc1bc40e6.png)

#### Login

![image](https://user-images.githubusercontent.com/52428475/210265141-007e1df4-b9dd-4c0c-8a09-5bf548b2413b.png)

#### User Details (set access token to Authorization header)

![image](https://user-images.githubusercontent.com/52428475/210265366-c7424b29-82ac-4aa1-8424-061ec9f5dfec.png)

#### Logout

![image](https://user-images.githubusercontent.com/52428475/210265438-dcc36ab8-e9e7-4a90-b24e-659fb9c226ab.png)

#### Refresh Token

![image](https://user-images.githubusercontent.com/52428475/210265635-7982f4f1-c876-47a0-9046-d428ddbde5c6.png)

#### Revoke Token

![image](https://user-images.githubusercontent.com/52428475/210265685-704573f1-f21a-4552-9d40-9abc8305d3c1.png)

#### Valid Refresh Tokens Of User

![image](https://user-images.githubusercontent.com/52428475/210265783-85b79e3d-712b-4eaf-a570-3a58506e18eb.png)

