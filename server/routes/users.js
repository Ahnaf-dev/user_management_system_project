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
      let users = await pool.query(
        "SELECT user_id, role, firstlogin FROM first_login INNER JOIN users on users.id = user_id"
      );

      let onlyUsers = users.rows.filter((user) => user.role === "User");

      let checkStatus = onlyUsers.map((user) => {
        let status;
        let hour = new Date(user.firstlogin).getHours();

        if (hour > 10) {
          status = "Absent";
        } else if (hour > 9) {
          status = "Late";
        } else if (hour <= 9) {
          status = "Intime";
        }

        return { ...user, status };
      });

      res.status(200).json(checkStatus);
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
      return res.status(400).json({
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

/**
 * @swagger
 * components:
 *  schemas:
 *    ResponseTokens:
 *      type: object
 *      properties:
 *        responseTokens:
 *         type: string
 *    AdminResponse:
 *     type: array
 *     items:
 *      type: object
 *      properties:
 *       user_id:
 *        type: string
 *       role:
 *        type: string
 *       firstlogin:
 *        type: string
 *       status:
 *        type: string
 */

/**
 * @swagger
 * /api/users/:
 *  get:
 *   summary: Can be accessed by admin
 *   parameters:
 *    - name: test-auth
 *      in: header
 *      type: string
 *      description: set access token value from login or register
 *    - in: query
 *      name: loginDate
 *      type: string
 *      description: any string
 *   responses:
 *      200:
 *         description: Access Granted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminResponse'
 *      400:
 *        description: Not admin or invalid query
 *      500:
 *         description: Some server error
 *
 */

/**
 * @swagger
 * /api/users/refresh-tokens:
 *  get:
 *   summary: Get refresh tokens of an user.
 *   parameters:
 *      - in: query
 *        name: userId
 *        type: string
 *        description: Valid user ID, you can get from SELECT * FROM users;
 *      - in: query
 *        name: isValid
 *        type: boolean
 *        default: true
 *        description: Get valid or invalid tokens based on boolean value
 *   responses:
 *      200:
 *         description: User Details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseTokens'
 *      400:
 *        description: Invalid data or query string
 *      500:
 *         description: Some server error
 *
 */
