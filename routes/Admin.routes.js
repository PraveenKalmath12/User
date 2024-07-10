import express from 'express'; 
const router = express.Router();
import {
    signupAdmin,
    getAllAdmins,
    getAdminById,
    updateAdminById,
    deleteAdmin
}  from '../Contollers/Admin.controller.js'

router.post('/signup', signupAdmin);
router.get('/get', getAllAdmins);
router.get('/get/:id', getAdminById);
router.put('/updatebyid', updateAdminById);
router.delete('/delete/:id', deleteAdmin);

export default router; 
