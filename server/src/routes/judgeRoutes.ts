import { Router } from 'express';
import {
    submitJudgeCode,
    getQuestionsController,
    getQuestionController,
    getSubmissionsController,
} from '../controllers/JudgeController';

const router = Router();

router.post('/submit', submitJudgeCode);
router.get('/questions', getQuestionsController);
router.get('/questions/:questionId', getQuestionController);
router.get('/submissions', getSubmissionsController);

export default router;