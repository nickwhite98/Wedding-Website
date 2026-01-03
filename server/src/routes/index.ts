import { Router } from 'express';
import { exampleRouter } from './example.routes';

export const router = Router();

router.use('/example', exampleRouter);
