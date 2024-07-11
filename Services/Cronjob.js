import cron from 'node-cron';
import { getAllWeeklyToppers } from '../Contollers/Weekly.controller';
import { getAllMonthlyToppers } from '../Contollers/Monthly.controller';


//Run weekly leaderboard update every Monday at 12:00 AM
cron.schedule('0 0 * * 1', () => {
    getAllWeeklyToppers();
});

// Run monthly leaderboard update on the 1st day of every month at 12:00 AM
cron.schedule('0 0 1 * *', () => {
    getAllMonthlyToppers();
});