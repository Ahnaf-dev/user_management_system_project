const request = require("supertest");
const app = require("../app-test");

describe("GET /api/users/refresh-tokens", () => {
  describe("When valid userID is sent with isValid set to true", () => {
    it("Should return valid refresh tokens if it exists", async () => {
      // create valid refresh token
      const login = await request(app).post("/api/auth/login").send({
        username: "cin125",
        password: "123",
      });

      // Type SELECT * FROM users; on psql shell to get a valid user ID
      const validID = 4; // set valid ID manually
      const response = await request(app).get(
        `/api/users/refresh-tokens?userId=${validID}&isValid=true`
      );
      // expect(response.body).toHaveProperty("responseTokens");
      expect(response.body.responseTokens[0].valid).toBe(true);
    });
  });

  describe("When no query is given", () => {
    it("Should warn to add a query", async () => {
      const response = await request(app).get(`/api/users/refresh-tokens`);

      expect(response.body.message).toBe(
        "Please send query string ?userId=userIDValue&isValid=booleanValue"
      );
    });
  });
});

describe("GET /api/users?loginDate=aDate", () => {
  describe("When user has admin role", () => {
    it("Should grant access", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Bob Smith",
          username: `bsmith${Math.random() * 100000}`,
          password: "123",
          role: "Admin",
        });

      const accessToken = response.body.accessToken;

      const loginDateResponse = await request(app)
        .get("/api/users?loginDate=213")
        .set("Authorization", accessToken);

      expect(loginDateResponse.body.message).toBe(
        "Admin verified, access granted."
      );
    });
  });

  describe("When user does not have admin role", () => {
    it("Should not grant access", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Bob Smith",
          username: `csmith${Math.random() * 100000}`,
          password: "123",
          role: "User",
        });

      const accessToken = response.body.accessToken;

      const loginDateResponse = await request(app)
        .get("/api/users?loginDate=213")
        .set("Authorization", accessToken);

      expect(loginDateResponse.body.message).toBe(
        "Access denied, unauthorized."
      );
    });
  });
});
