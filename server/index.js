const express = require("express");
require("dotenv").config();
const app = express();
let port = process.env.PORT || 4000;

app.use(express.json());

app.use("/api/auth", require("./routes/auth"));

app.listen(port, () => console.log(`Succesfully Connected To Port: ${port}`));
