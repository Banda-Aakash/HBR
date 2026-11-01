import {Router, Request, Response} from 'express';
import {currentFestival, todayInIndia} from '../festivals';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(currentFestival(todayInIndia(), process.env.FESTIVE_THEME));
});

export default router;
