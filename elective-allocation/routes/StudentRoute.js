
const express = require('express')

const router = express.Router()

const{
    submitPreferences,
    uploadCGPAFromCSV,
    allocateSubjects,
    resetSystem,
   
    submitPreferencesBulk,
    getStudentByRollNo,
    login,
    adminlogin,
    logoutAdmin,
    maxPreference,
    Addsubjects,
    deleteStudent,
    getAllstudents,
    getAllsubjects,
    getMaxPreference
} = require('../controllers/allocationController')
const adminAuth = require('../middlewares/adminauth')
const multer = require('multer');
const upload = multer({ storage:multer.memoryStorage() });



router.post('/submit-preferences-bulk',adminAuth, submitPreferencesBulk);
router.post('/login', login)
router.post('/upload-cgpa',adminAuth, upload.single('file'), uploadCGPAFromCSV);
router.post('/preferences', submitPreferences)
router.get('/allocate',adminAuth, allocateSubjects)
router.post('/reset',adminAuth, resetSystem)
router.post('/addsubjects', adminAuth, Addsubjects)
router.post('/max-pref', adminAuth, maxPreference)
router.get('/result/:rollNo',adminAuth, getStudentByRollNo)
router.post('/admin_login', adminlogin)
router.post('/admin_logout', logoutAdmin)
router.delete('/delete_student/:rollNo', adminAuth, deleteStudent)
router.get('/getallstudents', adminAuth, getAllstudents)
router.get('/getAllsubjects', adminAuth, getAllsubjects)
router.get('/get-max-pref', adminAuth, getMaxPreference)


module.exports = router