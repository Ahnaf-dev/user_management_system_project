const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();
let port = process.env.PORT || 4000;
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Management API",
      version: "1.0.0",
      description:
        "A user management API created with NodeJS that implements JWT auth, all data stored in a postgreSQL database.",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  apis: ["server/routes/*.js"],
};

const specs = swaggerJsDoc(options);

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));

app.use((err, req, res, next) => {
  // prevent server crashing from invalid JSON syntax in the req.body

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error(err);
    return res.sendStatus(400); // Bad request
  }

  next();
});

app.listen(port, () => console.log(`Succesfully Connected To Port: ${port}`));
