import express from 'express'; 
import cors from 'cors';
import cron from 'node-cron';
import connectToMongoDB from './Adapters/Mongodb.adapter.js'; 

import userRoutes from './routes/User.routes.js';
import weeklyLeaderboardRoutes from './routes/Weekly.routes.js';
import monthlyLeaderboardRoutes from './routes/Monthly.routes.js';
import { https } from 'firebase-functions';

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectToMongoDB();


// app.use('/admin', adminRoutes);
app.use('/api/v-1/user', userRoutes);
app.use('/api/v-1/weekly-leaderboard', weeklyLeaderboardRoutes);
app.use('/api/v-1/monthly-leaderboard', monthlyLeaderboardRoutes);




const port = 5051;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// export const api = https.onRequest(app);
