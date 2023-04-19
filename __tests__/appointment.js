/* eslint-disable no-unused-vars */
const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
//const todo = require("../models/todo");
let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  res = await agent.post("/session").send({
    email: username,
    password: password,
  });
};

describe("Todo test cases ", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(6000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Sign up", async () => {
    let res = await agent.get("/signup");
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "user.a@test.com",
      password: "12345678",
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out", async () => {
    let res = await agent.get("/appointment");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/appointment");
    expect(res.statusCode).toBe(302);
  });
});
