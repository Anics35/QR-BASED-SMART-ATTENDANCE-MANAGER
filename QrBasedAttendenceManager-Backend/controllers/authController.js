const axios = require('axios');
const jwt = require('jsonwebtoken');
const { oauth2Client } = require('../utils/googleClient');
const User = require('../models/userModel');
const logAction = require("../middleware/logAction");

// 1. DEV LOGIN (Manual Login without Google)
const devLogin = async (req, res) => {
  try {
    const { email, deviceId } = req.body; 
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ message: "User not found. Please Register first." });
    }

    // DEVICE BINDING LOGIC (For Students Only)
    if (user.role === 'student') {
        if (!deviceId) {
            return res.status(400).json({ message: "Device ID is required for students" });
        }

        if (!user.deviceId) {
            // SCENARIO A: First time login - Bind the device
            user.deviceId = deviceId;
            await user.save();
            console.log(`Device bound for ${user.name}: ${deviceId}`);
            
            await logAction({
                userId: user._id,
                action: "device_registered",
                entityType: "user",
                entityId: user._id,
                details: { outcome: "success", deviceId },
                ip: req.ip
            });

        } else if (user.deviceId !== deviceId) {
            // SCENARIO B: Proxy Attempt - Device doesn't match
            await logAction({
                userId: user._id,
                action: "unauthorized_attempt",
                entityType: "user",
                entityId: user._id,
                details: { outcome: "failure", message: "Device mismatch" },
                ip: req.ip
            });

            return res.status(403).json({ 
                message: "Login denied! This account is bound to another device." 
            });
        }
    }

    // Generate Token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, deviceId: user.deviceId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Log Login
    await logAction({
        userId: user._id,
        action: "login",
        entityType: "user",
        entityId: user._id,
        details: { outcome: "success", role: user.role },
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

    // Validation
    if (!name || !email || !role) {
      return res.status(400).json({ message: "Name, Email, and Role are required." });
    }

    // Admin Security Check
    if (role === 'admin') {
        if (adminSecret !== process.env.ADMIN_SECRET) { // Ensure ADMIN_SECRET is in .env
            return res.status(403).json({ message: "Invalid Admin Secret Key. Registration denied." });
        }
    }

    // Check Duplicates
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists. Please Login." });
    }

    // Mock Google ID for manual users
    const mockGoogleId = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const userData = {
      name,
      email: email.toLowerCase(),
      role,
      department,
      googleId: mockGoogleId,
      isActive: true
    };

    if (role === 'student') {
      if (!rollNumber || !deviceId) {
        return res.status(400).json({ message: "Student must have Roll Number and Device ID." });
      }
      userData.rollNumber = rollNumber;
      userData.deviceId = deviceId;
      userData.semester = semester || "Autumn";
    }

    const newUser = await User.create(userData);

    await logAction({
      userId: newUser._id,
      action: "device_registered",
      entityType: "user",
      entityId: newUser._id,
      details: { role, email, outcome: "success" },
      ip: req.ip,
    });

    // Auto-Login (Generate Token)
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
    if (err.name === 'ValidationError') {
       return res.status(400).json({ message: err.message });
    }
    // Handle Mongoose Duplicate Key Error (E11000) specifically
    if (err.code === 11000) {
        return res.status(400).json({ message: "Duplicate Error: Email or Roll Number already taken." });
    }
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// 3. GOOGLE AUTH (Original)
const googleAuth = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ message: 'Authorization code missing' });

    const { tokens } = await oauth2Client.getToken({ code, redirect_uri: 'postmessage' });
    oauth2Client.setCredentials(tokens);

    const { data } = await axios.get(
      'https://openidconnect.googleapis.com/v1/userinfo',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    const { sub, email, name, picture } = data;

    if (!email?.toLowerCase().endsWith('@tezu.ac.in')) {
      return res.status(403).json({ message: 'Only tezu.ac.in emails are allowed' });
    }

    // ... (Keep existing profile update logic if passed in query) ...

    const user = await User.findOneAndUpdate(
      { $or: [{ googleId: sub }, { email: email.toLowerCase() }] },
      { 
          name, 
          email: email.toLowerCase(), 
          googleId: sub, 
          photoUrl: picture, 
          lastLogin: new Date() 
      },
      { new: true, upsert: true, runValidators: true }
    );

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({ user, token });

  } catch (err) {
    return res.status(500).json({ message: 'Google auth failed', error: err.message });
  }
};

// 4. UPDATE PROFILE
const updateProfile = async (req, res) => {
    // ... (Keep your existing updateProfile logic here) ...
    // Assuming you have it from previous uploads, it's fine to leave as is.
    // Just ensure it handles req.user (from verifyJWT) instead of decoding manually if possible.
    // But your previous code decoded manually, which is fine too.
    res.status(501).json({message: "Use Register endpoint instead for manual updates"});
};

// 5. RESET DEVICE (Teacher Only)
const resetDevice = async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.deviceId = ""; 
    await student.save();

    await logAction({
      userId: req.user.id, 
      action: "device_registered", 
      entityType: "user",
      entityId: student._id,
      details: { outcome: "success", errorMessage: "Device unbound by teacher" },
      ip: req.ip,
    });

    return res.status(200).json({ message: "Device unbound successfully." });
  } catch (err) {
    res.status(500).json({ message: "Reset failed", error: err.message });
  }
};

module.exports = {
  googleAuth,
  updateProfile,
  devLogin,
  register,
  resetDevice
};