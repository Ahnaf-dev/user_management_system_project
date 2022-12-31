const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../database_config/config");
const isEnumMatched = require("../utils/isEnumMatched");
const generateToken = require("../utils/generateToken");
const authMiddleware = require("../auth_middleware/auth_middleware");

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

    await pool.query(
      "INSERT INTO refresh_tokens(token, valid, user_id) VALUES ($1, $2, $3)",
      [refreshToken, true, user.id]
    );

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

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const userResponse = await pool.query(
      "SELECT id, username, role, password FROM users WHERE username = $1",
      [username]
    );

    let usernameDoesNotExist = !userResponse.rows.length;

    if (usernameDoesNotExist) {
      return res.status(400).json({
        message:
          "Invalid username, please try again or register a new account.",
      });
    }

    const user = userResponse.rows[0];

    const verifyPassword = await bcrypt.compare(password, user.password);

    let invalidPassword = !verifyPassword;

    if (invalidPassword) {
      return res.status(400).json({ message: "Password does not match." });
    }

    let accessToken = generateToken("access", { id: user.id });
    let refreshToken = generateToken("refresh", { id: user.id });

    let invalidatePreviousRefreshTokens = await pool.query(
      "UPDATE refresh_tokens SET valid = false WHERE user_id = $1",
      [user.id]
    );

    await pool.query(
      "INSERT INTO refresh_tokens(token, valid, user_id) VALUES ($1, $2, $3)",
      [refreshToken, true, user.id]
    );

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

router.get("/me", authMiddleware, async (req, res) => {
  const userID = req.user.id;

  const userResponse = await pool.query(
    "SELECT id, name, username, role FROM users WHERE id = $1",
    [userID]
  );

  if (userResponse.rows.length) {
    let userDetails = userResponse.rows[0];

    return res.status(200).json({ user: userDetails });
  } else {
    return res.status(401).json({ message: "Invalid Credentials" });
  }
});

module.exports = router;
