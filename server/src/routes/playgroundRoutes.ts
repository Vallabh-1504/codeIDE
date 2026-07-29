import { Router } from 'express';
import { runCodeController, getJobStatusController } from '../controllers/PlaygroundController';

const router = Router();

router.post('/run', runCodeController);
router.get('/status/:id', getJobStatusController);

export default router;