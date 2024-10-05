import "reflect-metadata";
import { PrismaClient, User } from "@prisma/client";
import { UserService } from "../../src/services/user.service";
import { BookTicketDto } from "../../src/dtos/booking.dto";
import Container from "typedi";

let prisma: PrismaClient;
let userService: UserService;

beforeAll(async () => {
  prisma = new PrismaClient();
  userService = Container.get(UserService);

  await prisma.$connect();
  // await prisma.user.deleteMany();
});

beforeEach(async () => {
  await prisma.waitList.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("User Service", () => {
  it("should return a user", async () => {
    const userData: Partial<BookTicketDto> = {
      name: "Agatha",
      email: "agatha@test.com",
      phoneNumber: "09000000000",
    };

    const user: User = await userService.createUser(userData);

    expect(user).toHaveProperty("id");
    expect(typeof user.id).toBe("string");
  });
});
