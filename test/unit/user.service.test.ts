import { PrismaClient, User } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import prisma from "../../src/config/prisma";
import { UserService } from "../../src/services/user.service";
import { generateUUID } from "../util";
import { faker } from "@faker-js/faker";
import { SignUpDto } from "../../src/dtos/auth.dto";
import { HttpException } from "../../src/exceptions/http.exception";

// Mock the prisma config module
jest.mock("../../src/config/prisma.ts", () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

describe("UserService unit test", () => {
  const mockedPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;
  let userService: UserService;

  const userId: string = generateUUID();
  const email: string = faker.internet.email();
  const name: string = `${faker.person.firstName()} ${faker.person.lastName()}`;
  const phoneNumber = faker.phone.number();

  const mockUser: User = {
    id: userId,
    name,
    email,
    phoneNumber,
    password: "hashedPassword",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
  });

  describe("Create user case", () => {
    it("should create a new user", async () => {
      const signUpDto: SignUpDto = {
        email,
        name,
        password: "password",
      };

      mockedPrisma.user.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(signUpDto);

      expect(mockedPrisma.user.create).toHaveBeenCalledWith({
        data: signUpDto,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe("Get User By Mail cases", () => {
    it("should return a user when found", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserByMail(email);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user is not found", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserByMail(email);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toBeNull();
    });
  });

  describe("Get user by id cases", () => {
    it("should return a user when found", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw HttpException when user is not found", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.getUserById(userId)).rejects.toThrow(
        new HttpException(404, "User does not exist")
      );

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe("Strip user password", () => {
    it("should remove password from user object", () => {
      const result = userService.stripUserPassword(mockUser);

      expect(result).not.toHaveProperty("password");
    });
  });
});
