import { Router } from 'express';
import { exampleController } from '../controllers/example.controller';

export const exampleRouter = Router();

exampleRouter.get('/', exampleController.getAll.bind(exampleController));
exampleRouter.get('/:id', exampleController.getById.bind(exampleController));
exampleRouter.post('/', exampleController.create.bind(exampleController));
exampleRouter.delete('/:id', exampleController.delete.bind(exampleController));
