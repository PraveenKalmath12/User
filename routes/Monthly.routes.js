import express from 'express';
import { getAllMonthlyToppers } from '../Contollers/Monthly.controller.js';

const router = express.Router();

// Route to get all historical monthly toppers
router.get('/monthlytopperalldocuments', getAllMonthlyToppers);

export default router;
