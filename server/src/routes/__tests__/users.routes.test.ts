jest.mock("../../models/User");
jest.mock("jsonwebtoken");
jest.mock("../../middleware/upload", () => ({
  uploadProfilePic: {
    single: () => (_req: any, _res: any, next: any) => {
      // Simulate multer not providing a file by default
      next();
    },
  },
  uploadMessageImage: {
    single: () => (_req: any, _res: any, next: any) => next(),
  },
  uploadMessageAudio: {
    single: () => (_req: any, _res: any, next: any) => next(),
  },
}));

import request from "supertest";
import app from "../../app";
import User from "../../models/User";
import jwt from "jsonwebtoken";

//Create mock user and auth header
const AUTH_HEADER = { Authorization: "Bearer test-token" };

const mockUser = {
  _id: "test-user-id",
  email: "test@rpi.edu",
  firstName: "Test",
  lastName: "User",
  bio: "Hello",
  profilePicture: "",
  knownLanguages: [],
  learningLanguages: [],
  interests: [],
  university: "RPI",
  major: "CS",
  yearOfStudy: "Junior",
  accountStatus: "active",
  role: "both",
};

beforeEach(() => {
  jest.clearAllMocks();
  (jwt.verify as jest.Mock).mockReturnValue({ userId: "test-user-id" });
});

//get profile describe
describe("GET /api/users/profile", () => {
  it("returns 200 with user profile", async () => {
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app).get("/api/users/profile").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.firstName).toBe("Test");
  });

  it("returns 404 when user is not found", async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get("/api/users/profile").set(AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "User not found");
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/users/profile");

    expect(res.status).toBe(401);
  });
});

//profile describe
describe("PUT /api/users/profile", () => {
  it("updates profile with allowed fields and returns updated user", async () => {
    const updatedUser = { ...mockUser, bio: "Updated bio" };
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedUser);

    const res = await request(app)
      .put("/api/users/profile")
      .set(AUTH_HEADER)
      .send({ bio: "Updated bio" });

    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe("Updated bio");
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "test-user-id",
      { bio: "Updated bio" },
      { new: true, runValidators: true }
    );
  });

  it("ignores fields not in the allowed list", async () => {
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

    await request(app)
      .put("/api/users/profile")
      .set(AUTH_HEADER)
      .send({ bio: "Updated", email: "hack@evil.com", password: "newpass" });

    const updateArg = (User.findByIdAndUpdate as jest.Mock).mock.calls[0][1];
    expect(updateArg).toHaveProperty("bio", "Updated");
    expect(updateArg).not.toHaveProperty("email");
    expect(updateArg).not.toHaveProperty("password");
  });

  it("returns 404 when user is not found", async () => {
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .put("/api/users/profile")
      .set(AUTH_HEADER)
      .send({ bio: "Updated" });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "User not found");
  });
});

//post profile picture set
describe("POST /api/users/profile/picture", () => {
  it("returns 400 when no file is provided", async () => {
    const res = await request(app).post("/api/users/profile/picture").set(AUTH_HEADER);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "No image file provided");
  });
});

//test getting id
describe("GET /api/users/:id", () => {
  it("returns 200 with another user's public profile", async () => {
    const selectMock = jest.fn().mockResolvedValue(mockUser);
    (User.findById as jest.Mock).mockReturnValue({ select: selectMock });

    const res = await request(app).get("/api/users/other-user-id").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(selectMock).toHaveBeenCalledWith("-email -updatedAt");
  });

  it("returns 404 when user is not found", async () => {
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).get("/api/users/nonexistent-id").set(AUTH_HEADER);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "User not found");
  });
});

//test getting list of users
describe("GET /api/users", () => {
  it("returns a list of users excluding self", async () => {
    const sortMock = jest.fn().mockResolvedValue([mockUser]);
    const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
    const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
    (User.find as jest.Mock).mockReturnValue({ select: selectMock });

    const res = await request(app).get("/api/users").set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("users");
    expect(Array.isArray(res.body.users)).toBe(true);

    const filter = (User.find as jest.Mock).mock.calls[0][0];
    expect(filter._id).toEqual({ $ne: "test-user-id" });
    expect(filter.accountStatus).toBe("active");
  });

  it("applies language filter when language query param is provided", async () => {
    const sortMock = jest.fn().mockResolvedValue([]);
    const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
    const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
    (User.find as jest.Mock).mockReturnValue({ select: selectMock });

    await request(app).get("/api/users?language=Spanish").set(AUTH_HEADER);

    const filter = (User.find as jest.Mock).mock.calls[0][0];
    expect(filter.$or).toEqual([
      { "knownLanguages.language": "Spanish" },
      { "learningLanguages.language": "Spanish" },
    ]);
  });

  it("applies role filter when role query param is provided", async () => {
    const sortMock = jest.fn().mockResolvedValue([]);
    const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
    const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
    (User.find as jest.Mock).mockReturnValue({ select: selectMock });

    await request(app).get("/api/users?role=tutor").set(AUTH_HEADER);

    const filter = (User.find as jest.Mock).mock.calls[0][0];
    expect(filter.role).toBe("tutor");
  });

  it("applies search filter when search query param is provided", async () => {
    const sortMock = jest.fn().mockResolvedValue([]);
    const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
    const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
    (User.find as jest.Mock).mockReturnValue({ select: selectMock });

    await request(app).get("/api/users?search=John").set(AUTH_HEADER);

    const filter = (User.find as jest.Mock).mock.calls[0][0];
    expect(filter.$or).toHaveLength(2);
    expect(filter.$or[0]).toHaveProperty("firstName");
    expect(filter.$or[1]).toHaveProperty("lastName");
  });
});
