import mongoose from "mongoose";
const { Schema, model } = mongoose; 
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (value) {
          return /^\d{10}$/.test(value);
        },
        message: props => `${props.value} is not a valid 10-digit mobile number!`
      }
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    },
    aadhar: {
      type: String,
    },
    pan: {
      type: String,
    },
    points: {
      type: Number,
      default: 0 },

    verificationstatus:{
        type: Boolean,
        default:false,
    },
  }
);

const User = model('User', userSchema); 

export default User; 

