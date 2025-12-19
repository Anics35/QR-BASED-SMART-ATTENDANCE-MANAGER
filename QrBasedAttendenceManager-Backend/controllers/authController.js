// backend/controllers/authController.js

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { oauth2Client } = require('../utils/googleClient');
const User = require('../models/userModel');
const logAction = require("../middleware/logAction");

// 1. DEV LOGIN (Manual Login without Google)
const devLogin = async (req, res) => {
  try {
    // 1. Accept deviceId from request
    const { email, deviceId } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ message: "User not found. Please Register first." });
    }

    // 2. DEVICE BINDING LOGIC (For Students Only)
    if (user.role === 'student') {
        if (!deviceId) {
            return res.status(400).json({ message: "Device ID is required for students" });
        }

        if (!user.deviceId) {
            // SCENARIO A: First time login - Bind the device
            user.deviceId = deviceId;
            await user.save();
            
            // Log the binding event
            await logAction({
                userId: user._id,
                action: "device_registered",
                entityType: "user",
                entityId: user._id,
                details: { outcome: "success", deviceId },
                ip: req.ip,
            });

            console.log(`Device bound for ${user.name}: ${deviceId}`);

        } else if (user.deviceId !== deviceId) {
            // SCENARIO B: Proxy Attempt - Device doesn't match
            await logAction({
                userId: user._id,
                action: "unauthorized_attempt",
                entityType: "user",
                entityId: user._id,
                details: { outcome: "failure", message: "Device mismatch" },
                ip: req.ip,
            });

            return res.status(403).json({ 
                message: "Login denied! This account is bound to another device." 
            });
        }
    }

    // 3. Generate Token (unchanged)
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, deviceId: user.deviceId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log successful login
    await logAction({
        userId: user._id,
        action: "login",
        entityType: "user",
        entityId: user._id,
        details: { outcome: "success" },
        ip: req.ip,
    });

    return res.status(200).json({
      message: "Login successful",
      user,
      token
    });

  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// 2. MANUAL REGISTRATION (New Feature)
const register = async (req, res) => {
    try {
      const { name, email, role, department, semester, rollNumber, deviceId, adminSecret } = req.body;
  
      // 1. Basic Validation
      if (!name || !email || !role) {
        return res.status(400).json({ message: "Name, Email, and Role are required." });
      }
  
      // --- NEW: ADMIN SECURITY CHECK ---
      if (role === 'admin') {
          // Must match the key in .env
          if (adminSecret !== process.env.ADMIN_SECRET) {
              return res.status(403).json({ message: "Invalid Admin Secret Key. Registration denied." });
          }
      }
      // ---------------------------------
  
      // 2. Check if User Exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists. Please Login." });
      }
  
      // 3. Schema Requirements Handling
      const mockGoogleId = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
      // 4. Create User Object
      const userData = {
        name,
        email: email.toLowerCase(),
        role,
        department,
        googleId: mockGoogleId, // Satisfy schema requirement
        isActive: true
      };
  
      // Role Specific Fields
      if (role === 'student') {
        if (!rollNumber || !deviceId) {
          return res.status(400).json({ message: "Student must have Roll Number and Device ID." });
        }
        userData.rollNumber = rollNumber;
        userData.deviceId = deviceId; // Bind device immediately on signup
        userData.semester = semester || "Autumn";
      }
  
      // 5. Save to DB
      const newUser = await User.create(userData);
  
      // 6. Log the Action
      await logAction({
        userId: newUser._id,
        action: "device_registered", // For students, this counts as registration
        entityType: "user",
        entityId: newUser._id,
        details: { role, email, outcome: "success" },
        ip: req.ip,
      });
  
      // 7. Generate Token (Auto-Login)
      const token = jwt.sign(
        { id: newUser._id, email: newUser.email, role: newUser.role, deviceId: newUser.deviceId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      return res.status(201).json({
        message: "Registration Successful",
        user: newUser,
        token
      });
  
    } catch (err) {
      console.error("Registration Error:", err);
      // Handle Mongoose Validation Errors nicely
      if (err.name === 'ValidationError') {
         return res.status(400).json({ message: err.message });
      }
      // Handle Duplicate Key Error
      if (err.code === 11000) {
         return res.status(400).json({ message: "Duplicate Error: Email or Roll Number already exists." });
      }
      res.status(500).json({ message: "Registration failed", error: err.message });
    }
};

// 3. RESET DEVICE ID (Teacher/Admin only)
const resetDevice = async (req, res) => {
    try {
      const { studentId } = req.body;
  
      const student = await User.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      // Clear the device ID
      student.deviceId = ""; 
      await student.save();
  
      await logAction({
        userId: req.user.id, 
        action: "device_registered", 
        entityType: "user",
        entityId: student._id,
        // FIX: Clean details to match schema exactly
        details: { outcome: "success", errorMessage: "Device unbound by teacher" },
        ip: req.ip,
      });
  
      return res.status(200).json({ message: "Device unbound successfully." });
  
    } catch (err) {
      console.error("Reset Error:", err);
      res.status(500).json({ message: "Reset failed", error: err.message });
    }
};

// 4. GOOGLE AUTH (Original Flow)
const googleAuth = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ message: 'Authorization code missing' });
    }

    // Exchange auth code from popup flow
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: 'postmessage',
    });
    oauth2Client.setCredentials(tokens);

    // OpenID Connect userinfo (has 'sub' identifier)
    const { data } = await axios.get(
      'https://openidconnect.googleapis.com/v1/userinfo',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    // Expect: sub, email, name, picture
    const { sub, email, name, picture } = data;

    // Enforce tezu.ac.in
    if (!email?.toLowerCase().endsWith('@tezu.ac.in')) {
      return res.status(403).json({ message: 'Only tezu.ac.in emails are allowed' });
    }

    // Optional attributes from client during first login/complete profile
    const role = req.query.role; 
    const rollNumber = req.query.rollNumber; 
    const deviceId = req.query.deviceId; 
    const department = req.query.department;
    const semester = req.query.semester;

    // Build updates
    const set = {
      name,
      email: email.toLowerCase(),
      googleId: sub,
      photoUrl: picture,
      lastLogin: new Date(),
    };
    if (role) set.role = role;
    if (department) set.department = department;
    if (semester) set.semester = semester;
    if (role === 'student') {
      if (!rollNumber || !deviceId) {
        return res.status(400).json({ message: 'rollNumber and deviceId are required for students' });
      }
      set.rollNumber = rollNumber;
      set.deviceId = deviceId;
    }

    // Upsert by googleId/email and validate schema rules
    const user = await User.findOneAndUpdate(
      { $or: [{ googleId: sub }, { email: email.toLowerCase() }] },
      { $set: set },
      { new: true, upsert: true, runValidators: true }
    );

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_TIMEOUT || '7d' }
    );
    
    await logAction({
      userId: user._id,
      action: "login",
      entityType: "user",
      entityId: user._id,
      details: { outcome: "success" },
      ip: req.ip,
    });

    const profileComplete =
      !!user.role && (user.role !== 'student' || (!!user.rollNumber && !!user.deviceId));

    return res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        image: user.photoUrl,
        role: user.role,
        rollNumber: user.rollNumber,
        deviceId: user.deviceId,
        department: user.department,
        semester: user.semester,
        profileComplete,
      },
      token,
    });
  } catch (err) {
    const status = err?.response?.status || 500;
    await logAction({
      userId: null,
      action: "login",
      entityType: "user",
      entityId: null,
      details: { outcome: "failure", error: err.message },
      ip: req.ip,
    });
    return res.status(status).json({
      message: 'Google authentication failed',
      error: err?.response?.data || err.message,
    });
  }
};

// 5. UPDATE PROFILE (Existing)
const updateProfile = async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;
    if (!userId) return res.status(401).json({ message: 'Invalid token' });

    const { role, rollNumber, deviceId, department, semester } = req.body || {};

    if (role === 'student' && (!rollNumber || !deviceId)) {
      return res
        .status(400)
        .json({ message: 'rollNumber and deviceId are required for students' });
    }

    const set = {};
    if (role) set.role = role;
    if (typeof department === 'string') set.department = department;
    if (typeof semester === 'string') set.semester = semester;
    if (role === 'student') {
      set.rollNumber = rollNumber;
      set.deviceId = deviceId;
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: set },
      { new: true, runValidators: true }
    );

    const profileComplete =
      !!updated.role && (updated.role !== 'student' || (!!updated.rollNumber && !!updated.deviceId));

    return res.status(200).json({
      user: {
        name: updated.name,
        email: updated.email,
        image: updated.photoUrl,
        role: updated.role,
        rollNumber: updated.rollNumber,
        deviceId: updated.deviceId,
        department: updated.department,
        semester: updated.semester,
        profileComplete,
      },
    });
  } catch (err) {
    const status = err.name === 'JsonWebTokenError' ? 401 : 500;
    return res.status(status).json({ message: 'Profile update failed', error: err.message });
  }
};


/**
 * Get Current User Profile
 * Route: GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
module.exports = {
  googleAuth,
  updateProfile,
  devLogin,
  register,
  resetDevice,
  getMe
};