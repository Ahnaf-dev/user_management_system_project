const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../database_config/config");
const isEnumMatched = require("../utils/isEnumMatched");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, username, password, role } = req.body;

  if (!name || !username || !password || !role) {
    return res.status(400).json({ message: "Please enter all fields" });
  }

  const notValidRole = !isEnumMatched(["User", "Admin", "Ghost"], role);

  if (notValidRole) {
    return res
      .status(400)
      .json({ message: "Please enter a valid role (Admin, User or Ghost)" });
  }

  const doesUsernameExist = await pool.query(
    "SELECT username FROM users WHERE username = $1",
    [username]
  );

  if (doesUsernameExist.rows.length) {
    return res
      .status(400)
      .json({ message: "Username already exists, please try a new one." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const userResponse = await pool.query(
      "INSERT INTO users(name, username, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, role",
      [name, username, hashedPassword, role]
    );

    const user = userResponse.rows[0];

    let accessToken = generateToken("access", { id: user.id });
    let refreshToken = generateToken("refresh", { id: user.id });

    res.cookie("refreshToken", refreshToken, { httpOnly: true });

    return res.status(201).json({
      accessToken,
      user: { username: user.username, role: user.role },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

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

module.exports = router;
