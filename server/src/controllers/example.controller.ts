import { Request, Response, NextFunction } from 'express';
import { exampleService } from '../services/example.service';
import { AppError } from '../middleware/errorHandler';

export class ExampleController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await exampleService.getAll();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = await exampleService.getById(id);

      if (!data) {
        throw new AppError('Item not found', 404);
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;

      if (!name) {
        throw new AppError('Name is required', 400);
      }

      const data = await exampleService.create({ name });
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await exampleService.delete(id);

      if (!deleted) {
        throw new AppError('Item not found', 404);
      }

      res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const exampleController = new ExampleController();
