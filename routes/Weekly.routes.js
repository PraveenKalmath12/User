import express from 'express';
import {  getAllWeeklyToppers } from '../Contollers/Weekly.controller.js';

const router = express.Router();

// Route to get all historical weekly toppers
router.get('/weeklytopperalldocuments', getAllWeeklyToppers);

export default router;
