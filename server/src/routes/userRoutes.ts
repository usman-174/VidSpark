// src/routes/userRoutes.ts
import express from "express";
import {
  deleteUserRoute,
  getUserByIdRoute,
  getUsersRoute,
  updateUserRoute,
} from "../controller/userController";

const userRouter = express.Router();

userRouter.get("/", getUsersRoute);
userRouter.get("/:id", getUserByIdRoute);
userRouter.put("/:id", updateUserRoute);
userRouter.delete("/:id", deleteUserRoute);

export default userRouter;
