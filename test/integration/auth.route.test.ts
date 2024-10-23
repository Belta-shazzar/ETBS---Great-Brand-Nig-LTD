import request from "supertest";
import { App } from "../../src/app";
import { AuthRoute } from "../../src/routes/auth.route";
import { LoginDto, SignUpDto } from "../../src/dtos/auth.dto";
import prisma from "../../src/config/prisma";
import { faker } from "@faker-js/faker";

describe("Auth integration test", () => {
  afterAll(async () => {
    // Clean up database after test
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  const authRoute: AuthRoute = new AuthRoute();
  const app: App = new App([authRoute]);

  describe("[POST] /auth/sign-up", () => {
    it("should return a 400 if invalid data is sent", async () => {
      const invalidSignUpDto: Partial<SignUpDto> = {
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        email: "user1@testmail.com",
        phoneNumber: faker.phone.number(),
      };

      const response = await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send(invalidSignUpDto);

      expect(response.status).toBe(400);
    });
    it("should return sign up a user and return 201 ", async () => {
      const signUpDto: SignUpDto = {
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        email: "user2@testmail.com",
        phoneNumber: faker.phone.number(),
        password: "password",
      };

      const response = await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send(signUpDto);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty("token");
    });
    it("should return a 409 if email already exist", async () => {
      const email = "user3@testmail.com";
      // Save a user to ensure the email exists in the database before the actual test
      await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send({
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          email,
          phoneNumber: faker.phone.number(),
          password: "password",
        });

      const signUpDto: SignUpDto = {
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        email,
        phoneNumber: faker.phone.number(),
        password: "password",
      };

      const response = await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send(signUpDto);

      expect(response.status).toBe(409);
    });
  });
  describe("[POST] /auth/login", () => {
    it("should return a 200", async () => {
      const email = "user4@testmail.com";
      // Save a user to ensure the email exists in the database before the actual test
      await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send({
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          email,
          phoneNumber: faker.phone.number(),
          password: "password",
        });

      const loginDto: LoginDto = {
        email,
        password: "password",
      };

      const response = await request(app.getServer())
        .post(`${authRoute.path}/login`)
        .send(loginDto);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("token");
    });

    it("should return a 404 if email is not found", async () => {
      const invalidMailLoginDto: LoginDto = {
        email: faker.internet.email(),
        password: "password",
      };

      const response = await request(app.getServer())
        .post(`${authRoute.path}/login`)
        .send(invalidMailLoginDto);

      expect(response.status).toBe(404);
    });
    it("should return a 401 if password is incorrect", async () => {
      const email = "user5@testmail.com";
      // Save a user to ensure the email exists in the database before the actual test
      await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send({
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          email,
          phoneNumber: faker.phone.number(),
          password: "password",
        });

      const invalidPasswordLoginDto: LoginDto = {
        email,
        password: "incorrect-password",
      };

      const response = await request(app.getServer())
        .post(`${authRoute.path}/login`)
        .send(invalidPasswordLoginDto);

      expect(response.status).toBe(401);
    });
  });

  describe("[GET] /auth/authenticated", () => {
    it("should return a 200", async () => {
      const signupResponse = await request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send({
          name: `${faker.person.firstName()} ${faker.person.lastName()}`,
          email: "user6@testmail.com",
          phoneNumber: faker.phone.number(),
          password: "password",
        });

      const response = await request(app.getServer())
        .get(`${authRoute.path}/authenticated`)
        .set("Authorization", `Bearer ${signupResponse.body.data.token}`);

      expect(response.status).toBe(200);
    });

    it("should return a 401 if token is invalid", async () => {
      const response = await request(app.getServer())
        .get(`${authRoute.path}/authenticated`)
        .set("Authorization", `Bearer invalid-token`);

      expect(response.status).toBe(401);
    });
  });
});
