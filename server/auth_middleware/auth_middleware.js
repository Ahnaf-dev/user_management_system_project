const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  if (req.headers["test-auth"]) {
    let token = req.headers["test-auth"];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(401).json({ message: "Invalid Credentials" });
      let userID = { id: user.id };
      req.user = userID;
      next();
    });
  } else if (req.headers && req.headers.authorization) {
    let token = req.headers.authorization;

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(401).json({ message: "Invalid Credentials" });
      let userID = { id: user.id };
      req.user = userID;
      next();
    });
  } else {
    return res.status(401).json({ error: "Unauthorized, Access Denied" });
  }
};
