const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/", async (req, res) => {
  res.status(200).json("Hello World");
});

module.exports = router;
