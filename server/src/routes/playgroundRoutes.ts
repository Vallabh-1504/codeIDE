import { Router } from 'express';
import { runCodeController, getJobStatusController } from '../controllers/playgroundController';

const router = Router();

router.post('/run', runCodeController);
router.get('/status/:id', getJobStatusController);

export default router;