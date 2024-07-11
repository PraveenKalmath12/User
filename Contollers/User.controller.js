import User  from "../Models/User.model.js";
import { v4 as uuid } from 'uuid';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import axios from 'axios';
import dotenv from 'dotenv'
import multer from "multer";
import { initializeApp } from "firebase/app";
import WeeklyTopper from '../Models/Weekly.model.js';
import MonthlyTopper from "../Models/Monthly.model.js";

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


/* 
=>here only updating points based on increment old points + added points
=>this code maintaining weekly and monthly leader board and storing the data in respective schema 
=>along code comments are their for particular function
 */
export const updatePoints = async (req, res) => {
  const { userId } = req.params;
  const { pointsToAdd } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const prevPoints = user.points;
    user.points += pointsToAdd;
    await user.save();

    // Determine current week and month information
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentWeekStartDate = getWeekStartDate(currentDate);
    const currentWeekEndDate = getWeekEndDate(currentDate);
    const currentMonthStartDate = getMonthStartDate(currentDate);
    const currentMonthEndDate = getMonthEndDate(currentDate);

    // Find WeeklyTopper document for the current week
    let weeklyTopper = await WeeklyTopper.findOne({
      year: currentYear,
      weekStartDate: currentWeekStartDate,
      weekEndDate: currentWeekEndDate
    });

    if (!weeklyTopper) {
      // Create new WeeklyTopper document for the current week
      weeklyTopper = new WeeklyTopper({
        year: currentYear,
        weekStartDate: currentWeekStartDate,
        weekEndDate: currentWeekEndDate,
        topUsers: []
      });
    }

    // Update or add user to topUsers for this week
    if (weeklyTopper.topUsers) {
      const existingUserWeek = weeklyTopper.topUsers.find(u => u.clientId.toString() === userId);

      if (existingUserWeek) {
        // Update existing user's points
        existingUserWeek.points += pointsToAdd;
      } else {
        // Add new user to topUsers if there's space
        if (weeklyTopper.topUsers.length < 10) {
          weeklyTopper.topUsers.push({
            clientId: userId,
            points: pointsToAdd
          });
        } else {
          // Replace the user with the lowest points if not in top 10
          weeklyTopper.topUsers.sort((a, b) => a.points - b.points);
          if (pointsToAdd > weeklyTopper.topUsers[0].points) {
            weeklyTopper.topUsers[0] = {
              clientId: userId,
              points: pointsToAdd
            };
          }
        }
      }
    } else {
      console.error('WeeklyTopper.topUsers is null or undefined');
      return res.status(500).json({ error: 'Server error' });
    }

    // Save the updated WeeklyTopper document for the week
    await weeklyTopper.save();

    // Find MonthlyTopper document for the current month
    let monthlyTopper = await MonthlyTopper.findOne({
      year: currentYear,
      monthStartDate: currentMonthStartDate,
      monthEndDate: currentMonthEndDate
    });

    if (!monthlyTopper) {
      // Create new MonthlyTopper document for the current month
      monthlyTopper = new MonthlyTopper({
        year: currentYear,
        monthStartDate: currentMonthStartDate,
        monthEndDate: currentMonthEndDate,
        topUsers: []
      });
    }

    // Update or add user to topUsers for this month
    if (monthlyTopper.topUsers) {
      const existingUserMonth = monthlyTopper.topUsers.find(u => u.clientId.toString() === userId);

      if (existingUserMonth) {
        // Update existing user's points
        existingUserMonth.points += pointsToAdd;
      } else {
        // Add new user to topUsers if there's space
        if (monthlyTopper.topUsers.length < 10) {
          monthlyTopper.topUsers.push({
            clientId: userId,
            points: pointsToAdd
          });
        } else {
          // Replace the user with the lowest points if not in top 10
          monthlyTopper.topUsers.sort((a, b) => a.points - b.points);
          if (pointsToAdd > monthlyTopper.topUsers[0].points) {
            monthlyTopper.topUsers[0] = {
              clientId: userId,
              points: pointsToAdd
            };
          }
        }
      }
    } else {
      console.error('MonthlyTopper.topUsers is null or undefined');
      return res.status(500).json({ error: 'Server error' });
    }

    // Save the updated MonthlyTopper document for the month
    await monthlyTopper.save();

    // Prepare response
    const updatedUser = await User.findById(userId);
    res.json({
      success: true,
      message: 'Points updated successfully',
      user: updatedUser,
      previousPoints: prevPoints
    });
  } catch (error) {
    console.error('Error updating points:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/*
=>Test pupose setting time as 1 minute and 2 minute
*/

// function getWeekStartDate(date) {
//   const roundedDate = new Date(Math.floor(date.getTime() / (1 * 60 * 1000)) * (1 * 60 * 1000));
//   console.log(roundedDate, "roundedDateweek");
//   return roundedDate;
// }

// function getWeekEndDate(date) {
//   const roundedDate = new Date(Math.floor(date.getTime() / (1 * 60 * 1000)) * (1 * 60 * 1000) + 1 * 60 * 1000); // 1 minute interval
//   console.log(roundedDate, "roundedDateendweek");
//   return roundedDate;
// }

// function getMonthStartDate(date) {
//   const roundedDate = new Date(Math.floor(date.getTime() / (2 * 60 * 1000)) * (2 * 60 * 1000));
//   console.log(roundedDate, "roundedDatemonth");
//   return roundedDate;
// }

// function getMonthEndDate(date) {
//   const roundedDate = new Date(Math.floor(date.getTime() / (2 * 60 * 1000)) * (2 * 60 * 1000) + 2 * 60 * 1000); // 2 minutes interval
//   console.log(roundedDate, "roundedDateendmonth");
//   return roundedDate;
// }

/*
=>Actual Week and month from calender fetching and adding 5 hrs 30 minutes to convert it to indian time 
*/
function getWeekStartDate(date) {
  const currentDate = new Date(date);
  const currentDay = currentDate.getDay();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDay); // Move to the start of the current week (Sunday)
  startOfWeek.setHours(0, 0, 0, 0); // Set time to 00:00:00

  // Add 5 hours and 30 minutes
  startOfWeek.setHours(startOfWeek.getHours() + 5);
  startOfWeek.setMinutes(startOfWeek.getMinutes() + 30);

  return startOfWeek;
}

function getWeekEndDate(date) {
  const startOfWeek = getWeekStartDate(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7); // Move to the end of the week (next Sunday)
  endOfWeek.setHours(23, 59, 59, 999); // Set time to 23:59:59.999

  // Add 5 hours and 30 minutes
  endOfWeek.setHours(endOfWeek.getHours() + 5);
  endOfWeek.setMinutes(endOfWeek.getMinutes() + 30);

  return endOfWeek;
}


function getMonthStartDate(date) {
  const currentDate = new Date(date);
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // First day of the current month
  startOfMonth.setHours(0, 0, 0, 0); // Set time to 00:00:00

  // Add 5 hours and 30 minutes
  startOfMonth.setHours(startOfMonth.getHours() + 5);
  startOfMonth.setMinutes(startOfMonth.getMinutes() + 30);

  return startOfMonth;
}

function getMonthEndDate(date) {
  const startOfMonth = getMonthStartDate(date);
  const nextMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1); // First day of next month
  const endOfMonth = new Date(nextMonth.getTime() - 1); // Last millisecond of current month

  // Add 5 hours and 30 minutes
  endOfMonth.setHours(endOfMonth.getHours() + 5);
  endOfMonth.setMinutes(endOfMonth.getMinutes() + 30);

  return endOfMonth;
}
