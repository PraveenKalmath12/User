import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Set 'strictQuery' to true to suppress deprecation warning
mongoose.set('strictQuery', true);

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

export default connectToMongoDB;