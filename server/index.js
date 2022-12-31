const express = require("express");
const cookieParser = require("cookie-parser");

require("dotenv").config();
const app = express();
let port = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", require("./routes/auth"));

app.use((err, req, res, next) => {
  // prevent server crashing from invalid JSON syntax in the req.body

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error(err);
    return res.sendStatus(400); // Bad request
  }

  next();
});
app.listen(port, () => console.log(`Succesfully Connected To Port: ${port}`));
