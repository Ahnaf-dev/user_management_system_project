const express = require("express");
const pool = require("../database_config/config");
const authMiddleware = require("../auth_middleware/auth_middleware");
const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const { loginDate } = req.query;
  let userID = req.user.id;
  if (loginDate) {
    let response = await pool.query("SELECT role FROM users where id = $1", [
      userID,
    ]);

    let userRole = response.rows[0];

    if (userRole.role === "Admin") {
      res.status(200).json({ message: "Admin verified, access granted." });
    } else {
      res.status(400).json({ message: "Access denied, unauthorized." });
    }
  } else {
    res
      .status(400)
      .json({ message: "Please provide a query ?loginDate=aDate" });
  }
});

router.get("/refresh-tokens", async (req, res) => {
  const { userId, isValid } = req.query;

  if ((userId && isValid) || isValid === false) {
    let response = await pool.query(
      "SELECT token, valid FROM refresh_tokens WHERE user_id = $1 AND valid = $2",
      [userId, isValid]
    );

    if (response.rows.length) {
      let responseTokens = response.rows;
      res.status(200).json({ responseTokens });
    } else {
      return res
        .status(400)
        .json({
          message:
            "No Data Present (Invalid userID or no valid / invalid tokens)",
        });
    }
  } else {
    return res.status(400).json({
      message:
        "Please send query string ?userId=userIDValue&isValid=booleanValue",
    });
  }
});

module.exports = router;
