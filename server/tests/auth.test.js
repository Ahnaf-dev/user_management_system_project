const request = require("supertest");
const app = require("../app-test");

// add .skip (describe.skip) when testing register more than first time
describe("POST api/auth/register", () => {
  describe("when register info is given with a unique username", () => {
    it("should return status code of 201", async () => {
      // will only return valid when first time register, change username during re-tests
      const response = await request(app).post("/api/auth/register").send({
        name: "Bob Smith",
        username: "cin125",
        password: "123",
        role: "User",
      });
      expect(response.statusCode).toBe(201);
    });
  });
});

describe("POST api/auth/login", () => {
  describe("When valid login credentials are given", () => {
    it("Should return status code of 201 and have accessToken + user in body", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "cin125",
        password: "123",
      });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty("user", {
        username: "cin125",
        role: "User",
      });
    });
  });

  describe("When invalid login credentials are given", () => {
    describe("When username does not exist", () => {
      it("Should return status code of 400", async () => {
        const response = await request(app).post("/api/auth/login").send({
          username: "cin1254214214wd",
          password: "123",
        });

        expect(response.statusCode).toBe(400);
      });
    });

    describe("When password does not match", () => {
      it("Should return status code of 400", async () => {
        const response = await request(app).post("/api/auth/login").send({
          username: "cin125",
          password: "12945",
        });

        expect(response.statusCode).toBe(400);
      });
    });
  });
});

describe("GET api/auth/me", () => {
  describe("When valid accesstoken is given to Authorization header", () => {
    it("Should return user details", async () => {
      const accessToken = await getAccessTokens({
        username: "cin125",
        password: "123",
      });

      const detailsResponse = await request(app)
        .get("/api/auth/me")
        .set("Authorization", accessToken);

      expect(detailsResponse.body).toHaveProperty("user");
    });
  });

  describe("When invalid accesstoken is given to Authorization header", () => {
    it("Should return 401 status code", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "421421");

      expect(response.statusCode).toBe(401);
    });
  });
});

describe("DELETE /api/auth/logout", () => {
  describe("When endpoint is hit with valid refresh + access token", () => {
    it("Should return message that you are logged out + status code of 200", async () => {
      const accessToken = await getAccessTokens({
        username: "cin125",
        password: "123",
      });

      const response = await request(app)
        .delete("/api/auth/logout")
        .set("Authorization", accessToken);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("You have succesfully logged out!");
    });
  });
});

describe("POST /api/auth/refresh-token", () => {
  describe("When valid refresh token cookie is sent", () => {
    it("Should return a new access token", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "cin125",
        password: "123",
      });

      const cookie = response.headers["set-cookie"][0];

      const refreshResponse = await request(app)
        .post("/api/auth/refresh-token")
        .set("Cookie", [cookie]);

      expect(refreshResponse.accessToken).not.toBe(response.body.accessToken);
    });
  });
});

describe("POST /api/auth/revoke-token", () => {
  describe("When valid refresh token cookie is sent", () => {
    it("Should return message that token was revoked", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "cin125",
        password: "123",
      });

      const cookie = response.headers["set-cookie"][0];

      const revokeResponse = await request(app)
        .post("/api/auth/revoke-token")
        .set("Authorization", response.body.accessToken)
        .set("Cookie", [cookie]);

      expect(revokeResponse.body.message).toBe("Revoked Refresh Token");
    });
  });
});

async function getAccessTokens(loginInfo) {
  const response = await request(app).post("/api/auth/login").send(loginInfo);

  return response.body.accessToken;
}
