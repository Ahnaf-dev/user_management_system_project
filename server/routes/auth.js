const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../database_config/config");
const isEnumMatched = require("../utils/isEnumMatched");
const generateToken = require("../utils/generateToken");
const authMiddleware = require("../auth_middleware/auth_middleware");
const Redis = require("redis");
const router = express.Router();

const redisClient = Redis.createClient({
  legacyMode: true,
});
redisClient.connect();
const REDIS_EXPIRATION = 3600;

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

    const userDataWithAccessToken = {
      accessToken,
      user: { username: user.username, role: user.role },
    };

    // Redis Example

    redisClient.setEx(
      "usersDataWithAccessToken",
      REDIS_EXPIRATION,
      JSON.stringify(userDataWithAccessToken)
    );

    redisClient.setEx(
      "refreshToken",
      REDIS_EXPIRATION,
      JSON.stringify({ refreshToken })
    );

    return res.status(201).json(userDataWithAccessToken);
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

    let checkFirstLoginDate = await pool.query(
      "SELECT * FROM first_login WHERE user_id = $1",
      [user.id]
    );

    if (!checkFirstLoginDate.rows.length) {
      await pool.query(
        "INSERT INTO first_login(firstlogin, user_id) VALUES($1, $2)",
        [new Date(), user.id]
      );
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

    const userDataWithAccessToken = {
      accessToken,
      user: { username: user.username, role: user.role },
    };

    redisClient.setEx(
      "usersDataWithAccessToken",
      REDIS_EXPIRATION,
      JSON.stringify(userDataWithAccessToken)
    );

    redisClient.setEx(
      "refreshToken",
      REDIS_EXPIRATION,
      JSON.stringify({ refreshToken })
    );

    return res.status(201).json(userDataWithAccessToken);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete("/logout", authMiddleware, async (req, res) => {
  revokeTokens(true, req.user.id, req.cookies?.refreshToken, req, res);
});

router.post("/refresh-token", async (req, res) => {
  let refreshToken = req.cookies?.refreshToken;
  let hasValidToken = await pool.query(
    "SELECT token, user_id from refresh_tokens WHERE token = $1 AND valid = true",
    [refreshToken]
  );

  if (hasValidToken.rows.length) {
    let userID = hasValidToken.rows[0].user_id;

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(400).json({ message: "Invalid Token" });

      let accessToken = generateToken("access", { id: user.id });
      res.status(200).json({ accessToken });
    });
  } else {
    res.status(400).json({ message: "Invalid Token" });
  }
});

router.post("/revoke-token", authMiddleware, async (req, res) => {
  revokeTokens(false, req.user.id, req.cookies?.refreshToken, req, res);
});

router.get("/me", authMiddleware, async (req, res) => {
  const userID = req.user.id;

  redisClient.get(`user-${userID}`, async (error, user) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ message: "Server Error" });
    }
    if (user != null) {
      return res.status(200).json(JSON.parse(user));
    } else {
      const userResponse = await pool.query(
        "SELECT id, name, username, role FROM users WHERE id = $1",
        [userID]
      );

      if (userResponse.rows.length) {
        let userDetails = userResponse.rows[0];

        redisClient.setEx(
          `user-${userID}`,
          REDIS_EXPIRATION,
          JSON.stringify({ user: userDetails })
        );

        return res.status(200).json({ user: userDetails });
      } else {
        return res.status(401).json({ message: "Invalid Credentials" });
      }
    }
  });
});

async function revokeTokens(clearCookie, id, token, req, res) {
  const userID = id;
  let refreshToken = token;

  let hasValidToken = await pool.query(
    "SELECT token from refresh_tokens WHERE user_id = $1 AND valid = true",
    [userID]
  );

  if (hasValidToken.rows.length) {
    if (clearCookie) {
      res.clearCookie("refreshToken");
    }

    await pool.query(
      "UPDATE refresh_tokens SET valid = false WHERE token = $1",
      [refreshToken]
    );
    return res.status(200).json({
      message: `${
        clearCookie
          ? "You have succesfully logged out!"
          : "Revoked Refresh Token"
      }`,
    });
  } else {
    return res.status(400).json({ message: "Invalid Credentials" });
  }
}
module.exports = router;

/**
 * @swagger
 * components:
 *  schemas:
 *    RegisterResponse:
 *      type: object
 *      properties:
 *        accessToken:
 *          type: string
 *        user:
 *          type: object
 *          properties:
 *            username:
 *              type: string
 *            role:
 *              type: string
 *    UserDetails:
 *      type: object
 *      properties:
 *        user:
 *          type: object
 *          properties:
 *            id:
 *              type: string
 *            name:
 *              type: string
 *            username:
 *              type: string
 *            role:
 *              type: string
 *    RegisterBody:
 *      type: object
 *      properties:
 *        name:
 *         type: string
 *        username:
 *         type: string
 *        password:
 *         type: string
 *        role:
 *         type: string
 *    LoginBody:
 *      type: object
 *      properties:
 *        username:
 *         type: string
 *        password:
 *         type: string
 *    LogoutResponse:
 *      type: object
 *      properties:
 *        message:
 *         type: string
 *    RevokedResponse:
 *      type: object
 *      properties:
 *        message:
 *         type: string
 *    TokenResponse:
 *      type: object
 *      properties:
 *        accessToken:
 *         type: string
 *
 */

/**
 * @swagger
 * /api/auth/register:
 *  post:
 *   summary: Register an user and get details + access token.
 *   requestBody:
 *    required: true
 *    content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/RegisterBody'
 *   responses:
 *      200:
 *         description: User Succesfully Registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *      500:
 *         description: Some server error
 *
 */

/**
 * @swagger
 * /api/auth/login:
 *  post:
 *   summary: login an user and get details + access token.
 *   requestBody:
 *    required: true
 *    content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/LoginBody'
 *   responses:
 *      200:
 *         description: User Succesfully Logged In
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *      400:
 *        description: Invalid User or Password
 *      500:
 *         description: Some server error
 *
 */

/**
 * @swagger
 * /api/auth/logout:
 *  delete:
 *   summary: Logout user.
 *   parameters:
 *    - name: test-auth
 *      in: header
 *      type: string
 *      description: set access token value that you get from login or register such as eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIiLCJpYXQiOjE2NzI2MzA3OTcsImV4cCI6MTY3MjYzMTM5N30.29gATlQrGAA6Jybr2ZIPWGwdAuK949RqWpU2j-a3f1I
 *   responses:
 *      200:
 *         description: Logged Out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *      400:
 *        description: Invalid Credentials
 *      500:
 *         description: Some server error
 *
 */

/**
 * @swagger
 * /api/auth/me:
 *  get:
 *   summary: Get user details.
 *   parameters:
 *    - name: test-auth
 *      in: header
 *      type: string
 *      description: set access token value that you get from login or register such as eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIiLCJpYXQiOjE2NzI2MzA3OTcsImV4cCI6MTY3MjYzMTM5N30.29gATlQrGAA6Jybr2ZIPWGwdAuK949RqWpU2j-a3f1I
 *   responses:
 *      200:
 *         description: User Details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDetails'
 *      401:
 *        description: Invalid User
 *      500:
 *         description: Some server error
 *
 */

/**
 * @swagger
 * /api/auth/refresh-token:
 *  post:
 *   summary: Refreshes access token when user has valid refresh token as a cookie from logging in or register.
 *
 *   responses:
 *      200:
 *         description: New Access Token Granted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *      400:
 *        description: Invalid Token
 *
 *
 */

/**
 * @swagger
 * /api/auth/revoke-token:
 *  post:
 *   summary: Revoke Token.
 *   parameters:
 *    - name: test-auth
 *      in: header
 *      type: string
 *      description: set access token value that you get from login or register such as eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIiLCJpYXQiOjE2NzI2MzA3OTcsImV4cCI6MTY3MjYzMTM5N30.29gATlQrGAA6Jybr2ZIPWGwdAuK949RqWpU2j-a3f1I
 *   responses:
 *      200:
 *         description: Revoked Token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RevokedResponse'
 *      400:
 *        description: Invalid Credentials
 *      500:
 *         description: Some server error
 *
 */
