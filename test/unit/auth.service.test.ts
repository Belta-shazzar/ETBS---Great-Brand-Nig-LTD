import { PrismaClient } from "@prisma/client";
import { AuthService } from "../../src/services/auth.service";
import { SignUpDto } from "../../src/dtos/auth.dto";
import { AuthData } from "../../src/interfaces/auth.interface"
import { faker } from "@faker-js/faker";

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.user.deleteMany();

  await prisma.$disconnect();
});

describe("Auth Service", () => {
  it("should encrypt password", async () => {
    const authService = new AuthService();

    const signUpDto: SignUpDto = {
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      email: faker.internet.email(),
      password: "password",
      phoneNumber: faker.phone.number(),
    };
    const response: AuthData = await authService.signUp(signUpDto);
    expect(response.user).toHaveProperty("id");
    expect(response.user.password).not.toBe(signUpDto);
  });
});
