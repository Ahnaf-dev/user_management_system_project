const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();

function generateToken(type, data) {
  if (type === "access") {
    return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "10m",
    });
  } else {
    return jwt.sign(data, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
  }
}

module.exports = generateToken;
