import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

export interface NewUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  username: string;
  email: string;
  password: string;
}

export interface CookieResponse {
  cookie: Function;
}
export interface ProtectedRouteRequest extends Request {
  user?: Record<string, any>;
  cookies: Record<string, any>;
}
export interface GetMeRequest extends Request {
  user?: Record<string, any>;
}
export interface UserFollowUnfollowRequest
  extends Request<{ id: mongoose.Types.ObjectId }> {
  user?: Record<string, any>;
}
export interface SuggestedProfileRequest extends Request {
  user?: Record<string, any>;
}
export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;
export interface IUser {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  fullName: string;
  password: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  profilePicture?: string;
  coverPicture?: string;
  bio?: string;
  link?: string;
}

export interface UpdateUserRequest extends Request {

  user?: Record<string, any>;
  
}