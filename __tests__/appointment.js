// /* eslint-disable no-undef */
// const request = require("supertest");
// var cheerio = require("cheerio");
// const db = require("../models/index");
// const app = require("../app");
// //const todo = require("../models/todo");
// let server, agent;

// function extractCsrfToken(res) {
//   var $ = cheerio.load(res.text);
//   return $("[name=_csrf]").val();
// }

// const login = async (agent, username, password) => {
//   let res = await agent.get("/login");
//   let csrfToken = extractCsrfToken(res);
//   res = await agent.post("/session").send({
//     email: username,
//     password: password,
//     _csrf: csrfToken,
//   });
// };

// describe("Todo test cases ", () => {
//   beforeAll(async () => {
//     await db.sequelize.sync({ force: true });
//     server = app.listen(4000, () => {});
//     agent = request.agent(server);
//   });
//   afterAll(async () => {
//     await db.sequelize.close();
//     server.close();
//   });

//   test("Sign up", async () => {
//     let res = await agent.get("/signup");
//     const csrfToken = extractCsrfToken(res);
//     res = await agent.post("/users").send({
//       firstName: "Test",
//       lastName: "User A",
//       email: "user.a@test.com",
//       password: "12345678",
//       _csrf: csrfToken,
//     });
//     expect(res.statusCode).toBe(302);
//   });

//   test("Sign out", async () => {
//     let res = await agent.get("/todo");
//     expect(res.statusCode).toBe(200);
//     res = await agent.get("/signout");
//     expect(res.statusCode).toBe(302);
//     res = await agent.get("/todo");
//     expect(res.statusCode).toBe(302);
//   });

// });
