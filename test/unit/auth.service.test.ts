import { PrismaClient, User } from "@prisma/client";
import { AuthService } from "../../src/services/auth.service";
import { SignUpDto } from "../../src/dtos/auth.dto";
import { AuthData } from "../../src/interfaces/auth.interface"

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.cancelledBooking.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.waitList.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.cancelledBooking.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.waitList.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  await prisma.$disconnect();
});

describe("Auth Service", () => {
  it("should encrypt password", async () => {
    const authService = new AuthService();

    const signUpDto: SignUpDto = {
      name: "Agatha",
      email: "christine@test.com",
      password: "password",
      phoneNumber: "08000000000",
    };
    const response: AuthData = await authService.signUp(signUpDto);
    expect(response.user).toHaveProperty("id");
    expect(response.user.password).not.toBe(signUpDto);
  });
});
