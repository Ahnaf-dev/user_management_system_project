const express = require("express");
const pool = require("../database_config/config");
const authMiddleware = require("../auth_middleware/auth_middleware");
const router = express.Router();

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
      return res.status(400).json({ message: "Invalid UserID" });
    }
  } else {
    return res.status(400).json({
      message:
        "Please send query string ?userId=userIDValue&isValid=booleanValue",
    });
  }
});

module.exports = router;
