import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { authService } from './auth.service';

export const authController = {
  register: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    sendResponse(res, 201, 'User registered successfully', result);
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    sendResponse(res, 200, 'Login successful', result);
  }),

  getMe: catchAsync(async (req: Request, res: Response) => {
    const result = await authService.getMe(req.user!.id);
    sendResponse(res, 200, 'Current user profile retrieved', result);
  }),
};
