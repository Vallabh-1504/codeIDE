import { Router } from 'express';
import { submitJudgeCode } from '../controllers/JudgeController';

const router = Router();

router.post('/submit', submitJudgeCode);

export default router;