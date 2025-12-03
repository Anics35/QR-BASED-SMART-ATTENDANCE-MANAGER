const express = require('express');
const router = express.Router();

// 1. Import Controllers
const { 
  googleAuth, 
  updateProfile, 
  devLogin, 
  register, 
  resetDevice 
} = require('../controllers/authController');

// 2. Import Middleware (This was missing!)
const verifyJWT = require('../middleware/verifyJWT');

// --- ROUTES ---

// Google Auth (Original)
router.get('/google', googleAuth);
router.put('/profile', updateProfile);

// Dev Login (For testing without Google)
router.post('/dev-login', devLogin);

// Registration (Student/Teacher Signup)
router.post('/register', register);

// Device Management (Teacher/Admin only)
router.post('/reset-device', verifyJWT, resetDevice);

module.exports = router;