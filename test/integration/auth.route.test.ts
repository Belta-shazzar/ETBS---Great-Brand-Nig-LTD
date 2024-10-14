import request from "supertest";
import { App } from "../../src/app";
import { AuthRoute } from "../../src/routes/auth.route";
import { LoginDto, SignUpDto } from "../../src/dtos/auth.dto";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
});

afterAll(async () => {
  // //   Clean up database after test
  // await prisma.cancelledBooking.deleteMany();
  // await prisma.waitList.deleteMany();
  // await prisma.booking.deleteMany();
  // await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  await prisma.$disconnect();
});

describe("Auth integration test", () => {
  const authRoute: AuthRoute = new AuthRoute();
  const app: App = new App([authRoute]);
  describe("[POST] /auth/sign-up", () => {
    it("should return a 400 if invalid data is sent", async () => {
      const signUpDto: Partial<SignUpDto> = {
        name: "Agatha",
        email: "agatha@test.com",
        phoneNumber: "08000000000",
      };

      return request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send(signUpDto)
        .expect(400);
    });
    it("should return a 201 if email already exist", async () => {
      const signUpDto: SignUpDto = {
        name: "Agatha",
        email: "agatha@test.com",
        password: "password",
        phoneNumber: "08000000000",
      };

      return request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send(signUpDto)
        .expect(201);
    });
    it("should return a 409 if email already exist", async () => {
      const signUpDto: SignUpDto = {
        name: "Agatha",
        email: "agatha@test.com",
        password: "password",
        phoneNumber: "08000000000",
      };

      return request(app.getServer())
        .post(`${authRoute.path}/sign-up`)
        .send(signUpDto)
        .expect(409);
    });
  });
  describe("[POST] /auth/login", () => {
    it("should return a 404 if email is not found", async () => {
      const loginDto: LoginDto = {
        email: "sandra@test.com",
        password: "password",
      };

      return request(app.getServer())
        .post(`${authRoute.path}/login`)
        .send(loginDto)
        .expect(404);
    });
    it("should return a 401 if password is incorrect", async () => {
      const loginDto: LoginDto = {
        email: "agatha@test.com",
        password: "passworddd",
      };

      return request(app.getServer())
        .post(`${authRoute.path}/login`)
        .send(loginDto)
        .expect(401);
    });

    it("should return a 200", async () => {
      const loginDto: LoginDto = {
        email: "agatha@test.com",
        password: "password",
      };

      return await request(app.getServer())
        .post(`${authRoute.path}/login`)
        .send(loginDto)
        .expect(200);
    });
  });
});
