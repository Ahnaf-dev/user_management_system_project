const express = require("express");
const cookieParser = require("cookie-parser");

require("dotenv").config();
const app = express();
let port = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", require("./routes/auth"));

app.listen(port, () => console.log(`Succesfully Connected To Port: ${port}`));
