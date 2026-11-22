import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { categoryService } from './category.service';

export const categoryController = {
  listPublic: catchAsync(async (_req: Request, res: Response) => {
    const categories = await categoryService.listPublicCategories();
    sendResponse(res, 200, 'Categories retrieved successfully', categories);
  }),

  listAdmin: catchAsync(async (_req: Request, res: Response) => {
    const categories = await categoryService.listAdminCategories();
    sendResponse(res, 200, 'All categories retrieved successfully', categories);
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body);
    sendResponse(res, 201, 'Category created successfully', category);
  }),
};
