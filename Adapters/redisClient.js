import Redis from 'ioredis';
import { promisify } from 'util';
import mongoose from 'mongoose';
import Admin from '../Models/Admin.model.js';

let instance = null;

class RedisSingleton {
  constructor() {
    if (!instance) {
      this.client = new Redis({
        host: '127.0.0.1',
        port: 6379,
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
        // Promisify Redis commands for async/await usage
        this.client.getAsync = promisify(this.client.get).bind(this.client);
        this.client.setAsync = promisify(this.client.set).bind(this.client);
        this.client.delAsync = promisify(this.client.del).bind(this.client);
        this.client.hmgetAsync = promisify(this.client.hmget).bind(this.client);
        this.client.hmsetAsync = promisify(this.client.hmset).bind(this.client);
      });

      this.client.on('error', (err) => {
        console.error('Redis connection error:', err);
      });

      instance = this;
    }

    return instance;
  }

  getClient() {
    return this.client;
  }

  async hmsetAsync(key, data) {
    await this.client.hmsetAsync(key, data);
  }

  async hmgetAsync(key, fields) {
    return await this.client.hmgetAsync(key, fields);
  }

  async setAsync(key, value) {
    await this.client.setAsync(key, value);
  }

  async getAsync(key) {
    return await this.client.getAsync(key);
  }

  async delAsync(key) {
    await this.client.delAsync(key);
  }

  async saveCachedEntriesToMongo() {
    try {
      const keys = await this.client.keys('*');
      const pipeline = this.client.pipeline();

      for (const key of keys) {
        const cachedData = await this.client.hmgetAsync(key, ['email', 'name', 'createdby', 'phone', 'role', 'block']);
        
        if (cachedData[0]) {
          const adminData = {
            email: cachedData[0],
            name: cachedData[1],
            createdby: cachedData[2],
            phone: cachedData[3],
            role: cachedData[4],
            block: cachedData[5] === 'true',
          };

          // Check if admin with the same email already exists in MongoDB
          const existingAdmin = await Admin.findOne({ email: adminData.email }).exec();

          if (!existingAdmin) {
            // If admin does not exist, save it to MongoDB
            const newAdmin = new Admin(adminData);
            await newAdmin.save();
          }else {
            // If admin exists, update it in MongoDB
            await Admin.updateOne({ email: adminData.email }, {
              name: adminData.name,
              createdby: adminData.createdby,
              phone: adminData.phone,
              block: adminData.block,
            });
          }

        }
      }
    } catch (error) {
      console.error('Error saving cached entries to MongoDB:', error);
      throw error;
    }
  }
}

const redisInstance = new RedisSingleton();
Object.freeze(redisInstance);

export default redisInstance;
