import mongoose from 'mongoose';
const { Schema, model } = mongoose; 

const adminSchema = new Schema({
  name: {
    type: String,
  },
  createdby: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    default: 'Admin',
  },
  block: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

const Admin = model('Admin', adminSchema); 

export default Admin; 
