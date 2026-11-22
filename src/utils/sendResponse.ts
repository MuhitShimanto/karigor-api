import { Response } from 'express';

export const sendResponse = (
  res: Response,
  status: number,
  message: string,
  data: unknown = null,
  meta?: unknown,
) =>
  res
    .status(status)
    .json({ success: true, message, data, ...(meta ? { meta } : {}) });
