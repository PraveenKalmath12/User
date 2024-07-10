import express from 'express';
const router = express.Router();
import multer from 'multer';

import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} from '../Contollers/User.controller.js'; 


const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

router.post('/createuser', createUser);
router.get('/getallusers', getUsers);
router.get('/getuserbyid/:id', getUserById);
router.put('/updateuser/:id', upload.fields([{ name: 'aadhar', maxCount: 1 }, { name: 'pan', maxCount: 1 }]), updateUser);
router.delete('/deleteuser/:id', deleteUser);

export default router;
