import { MockProxy, mock } from "jest-mock-extended";
import { PrismaClient, User } from "@prisma/client";
import { AuthService } from "../../src/services/auth.service";
import { UserService } from "../../src/services/user.service";
import { HttpException } from "../../src/exceptions/http.exception";
import { LoginDto, SignUpDto } from "../../src/dtos/auth.dto";
import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { faker } from "@faker-js/faker";
import { generateUUID } from "../util";
import config from "../../src/config";

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

describe("AuthService unit test", () => {
  let authService: AuthService;
  let userService: MockProxy<UserService>;
  // let prisma: MockProxy<PrismaClient>;

  const userId = generateUUID();
  const name = `${faker.person.firstName()} ${faker.person.lastName()}`;
  const email = faker.internet.email();
  const phoneNumber = faker.phone.number();
  const mockToken = "mock.jwt.token";

  const mockUser: User = {
    id: userId,
    name,
    email,
    phoneNumber,
    password: "hashedPassword",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStrippedUser: Partial<User> = {
    id: userId,
    name,
    email,
    phoneNumber,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // prisma = mock<PrismaClient>();
    userService = mock<UserService>();
    authService = new AuthService(userService);
  });

  describe("Sign up cases", () => {
    const signUpDto: SignUpDto = {
      name,
      email,
      phoneNumber,
      password: "password",
    };

    it("should successfully create a new user", async () => {
      // Mock hash password
      const hashedPassword = "hashedPassword";
      (hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Mock user service methods
      userService.getUserByMail.mockResolvedValue(null);
      userService.createUser.mockResolvedValue(mockUser);
      userService.stripUserPassword.mockReturnValue(mockStrippedUser);

      // Mock the createToken method
      jest.spyOn(authService as any, "createToken").mockReturnValue(mockToken);

      // Execute signup
      const result = await authService.signUp(signUpDto);

      // Verify all service calls
      expect(userService.getUserByMail).toHaveBeenCalledWith(signUpDto.email);
      expect(hash).toHaveBeenCalledWith(signUpDto.password, 10);
      expect(userService.createUser).toHaveBeenCalledWith({
        ...signUpDto,
        password: hashedPassword,
      });
      expect(userService.stripUserPassword).toHaveBeenCalledWith(mockUser);
      expect((authService as any).createToken).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        user: mockStrippedUser,
        token: mockToken,
      });
    });

    it("should throw HttpException if email already exists", async () => {
      // Mock existing user
      userService.getUserByMail.mockResolvedValue(mockUser);

      // Execute and verify exception
      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        new HttpException(409, `This email ${signUpDto.email} already exists`)
      );

      // Verify service calls
      expect(userService.getUserByMail).toHaveBeenCalledWith(signUpDto.email);
      expect(userService.createUser).not.toHaveBeenCalled();
      expect(hash).not.toHaveBeenCalled();
    });
  });

  describe("Login cases", () => {
    const loginDto: LoginDto = {
      email,
      password: "password",
    };

    it("should successfully log a user in", async () => {
      userService.getUserByMail.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(true);

      userService.stripUserPassword.mockReturnValue(mockStrippedUser);

      // Mock the createToken method
      jest.spyOn(authService as any, "createToken").mockReturnValue(mockToken);

      // Execute signup
      const result = await authService.login(loginDto);

      // Verify all service calls
      expect(userService.getUserByMail).toHaveBeenCalledWith(loginDto.email);
      expect(compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      );
      expect(userService.stripUserPassword).toHaveBeenCalledWith(mockUser);
      expect((authService as any).createToken).toHaveBeenCalledWith(mockUser); // Verify the result
      expect(result).toEqual({
        user: mockStrippedUser,
        token: mockToken,
      });
    });

    it("should throw HttpException when incorrect email is sent", async () => {
      userService.getUserByMail.mockResolvedValue(null);

      // Execute and verify
      await expect(authService.login(loginDto)).rejects.toThrow(HttpException);
      expect(userService.getUserByMail).toHaveBeenCalledWith(loginDto.email);
      expect(compare).not.toHaveBeenCalled();
    });

    it("should throw HttpException when incorrect password is sent", async () => {
      userService.getUserByMail.mockResolvedValue(mockUser);
      (compare as jest.Mock).mockResolvedValue(false);

      // Execute and verify
      await expect(authService.login(loginDto)).rejects.toThrow(HttpException);
      expect(userService.getUserByMail).toHaveBeenCalledWith(loginDto.email);
      expect(compare).toHaveBeenCalled();
    });
  });

  describe("createToken", () => {
    it("should create a valid JWT token", () => {
      (sign as jest.Mock).mockResolvedValue(mockToken);

      // Call the private method
      const token = (authService as any).createToken(mockUser);

      expect(sign).toHaveBeenCalledWith({ id: mockUser.id }, config.app.jwtSecret, {
        expiresIn: 60 * 3600,
      });

      expect(token).toEqual(token)
    });
  });
});
