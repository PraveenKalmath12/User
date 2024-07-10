import express from 'express'; // Import express
import cors from 'cors'; // Import cors
import connectToMongoDB from './Adapters/Mongodb.adapter.js'; 
import adminRoutes from './routes/Admin.routes.js'; 
import userRoutes from './routes/User.routes.js'
const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectToMongoDB();

// Import and use admin routes
app.use('/admin', adminRoutes);
app.use('/api/v-1/user', userRoutes);
const port = 5051;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
