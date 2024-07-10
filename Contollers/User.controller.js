import User  from "../Models/User.model.js";
import { v4 as uuid } from 'uuid';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import axios from 'axios';
import dotenv from 'dotenv'
import multer from "multer";
import { initializeApp } from "firebase/app";
dotenv.config();

const upload = multer();

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);



/*  
=>creating new user here email and contact are unique 
=>aadhar and pan stored as empty because of usercase
=>verificationstatus is false default
*/
export const createUser = async (req, res, next) => {
    const { name, contact, email, aadhar, pan, verificationstatus } = req.body;
    
    if (!name || !contact || !email) {
        return res.status(400).json({ error: 'Name, contact, and email are required' });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { contact }] });
        if (existingUser) {
            console.log('User with this email or phone number already exists');
            return res.status(400).json({ error: 'User with this email or phone number already exists' });
        }

        const newUser = await User.create({
            name,
            contact,
            email,
            aadhar: aadhar || "",
            pan: pan || "",
            verificationstatus: false
        });

        res.status(201).json({
            success: true,
            user: newUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};


/*  
=>Updating user by id all  
=>Here image fields like aadhar and pan are recieving to backend in form data and uploading in bites to firebase base
=>lastely storing the image link of firebase to mongodb 
=>if you updated one data it will changes only one data and stores remaing data same before 
*/

export const updateUser = async (req, res) => {
    try {
      const userId = req.params.id;
      const { name, contact, email, verificationstatus } = req.body;
  
      let user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!/^[0-9]{10}$/.test(user.contact)) {
        return res.status(400).json({ error: 'Please enter a valid phone number' });
     }

      user.name = name || user.name;
      user.contact = contact || user.contact;
      user.email = email || user.email;
      user.verificationstatus = verificationstatus !== undefined ? verificationstatus : user.verificationstatus;
  
      // Handle Aadhar file upload
      if (req.files && req.files.aadhar && req.files.aadhar[0]) {
        const aadharFile = req.files.aadhar[0];
        const aadharFilename = `${uuid()}_${aadharFile.originalname}`;
        const storageRef = ref(storage, `aadhar/${aadharFilename}`);
        await uploadBytes(storageRef, aadharFile.buffer);
        const aadharDownloadURL = await getDownloadURL(storageRef);
        user.aadhar = aadharDownloadURL;
      } else if (req.body.aadharUrl) {
        // If Aadhar URL is provided directly
        try {
          const response = await axios.get(req.body.aadharUrl, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data, 'binary');
          const aadharFilename = `${uuid()}.jpg`;
          const storageRef = ref(storage, `aadhar/${aadharFilename}`);
          await uploadBytes(storageRef, buffer);
          const aadharDownloadURL = await getDownloadURL(storageRef);
          user.aadhar = aadharDownloadURL;
        } catch (error) {
          console.error("Error fetching Aadhar URL:", error);
          return res.status(400).json({ error: "Failed to fetch Aadhar URL" });
        }
      }
  
      // Handle PAN file upload
      if (req.files && req.files.pan && req.files.pan[0]) {
        const panFile = req.files.pan[0];
        const panFilename = `${uuid()}_${panFile.originalname}`;
        const storageRef = ref(storage, `pan/${panFilename}`);
        await uploadBytes(storageRef, panFile.buffer);
        const panDownloadURL = await getDownloadURL(storageRef);
        user.pan = panDownloadURL;
      } else if (req.body.panUrl) {
        // If PAN URL is provided directly
        try {
          const response = await axios.get(req.body.panUrl, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data, 'binary');
          const panFilename = `${uuid()}.jpg`;
          const storageRef = ref(storage, `pan/${panFilename}`);
          await uploadBytes(storageRef, buffer);
          const panDownloadURL = await getDownloadURL(storageRef);
          user.pan = panDownloadURL;
        } catch (error) {
          console.error("Error fetching PAN URL:", error);
          return res.status(400).json({ error: "Failed to fetch PAN URL" });
        }
      }
  
      await user.save();
  
      res.status(200).json({ message: "User updated successfully", user: user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };



/*  
=>Fetching all the users 
=>based on the pagination we are getting 10 user at page and default page no is 1
*/
export const getUsers = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;

    try {
        const users = await User.find().skip(skipIndex).limit(limit);
        const totalUserCount = await User.countDocuments();

        res.status(200).json({
            success: true,
            totalUserCount,
            currentPage: page,
            totalPages: Math.ceil(totalUserCount / limit),
            users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

/*  
=>Fetching user by particular mongoid passing in params the users 
*/
export const getUserById = async (req, res, next) => {
    const userId = req.params.id;
   
    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "UserId Formet Invalid or Server error" });
    }
};

/*  
=>Deleting user by particular mongoid passing in params the users 
*/
export const deleteUser = async (req, res, next) => {
    const userId = req.params.id;

    try {
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "UserId Formet Invalid or Server error" });
    }
};
