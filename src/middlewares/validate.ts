import { RequestHandler } from 'express';
import { AnyZodObject } from 'zod';

export const validate =
  (schema: AnyZodObject): RequestHandler =>
  async (req, _res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      req.body = parsed.body ?? req.body;
      next();
    } catch (e) {
      next(e);
    }
  };
