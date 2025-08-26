import express from 'express';
import { getUserDailyActivity } from './get-user-daily-activity';
import { getTagDailyActivity } from './get-tag-daily-activity';

export const statsRouter = express.Router();

statsRouter.get('/user/daily/activity', getUserDailyActivity);
statsRouter.get('/tag/daily/activity', getTagDailyActivity);
