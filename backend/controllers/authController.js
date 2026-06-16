const { User } = require('../utils/dbAdapter');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'civicflow_local_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });

/**
 * POST /api/auth/firebase-sync
 * Bridge Firebase Auth users into the DB (Atlas or local).
 */
const firebaseSync = async (req, res, next) => {
  try {
    const { uid, email, name, role } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ status: 'fail', message: 'Missing Firebase credentials' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
      user = await User.create({
        name: name || 'Citizen',
        email,
        password: randomPassword,
        role: role || 'citizen',
        isActive: true,
      });
    }

    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    res.status(201).json({ status: 'success', data: { user, token } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    res.status(200).json({ status: 'success', data: { user, token } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/setup-profile
 */
const setupProfile = async (req, res, next) => {
  try {
    const { name, surname, address, gender, phone, email, dob } = req.body;
    const user = await User.findOne({ _id: req.user._id });
    
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    if (name) user.name = name;
    if (surname !== undefined) user.surname = surname;
    if (address) user.address = address;
    if (gender) user.gender = gender;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (dob) user.dob = dob;

    // Save profile picture file path if uploaded
    if (req.file) {
      user.photo = `/uploads/${req.file.filename}`;
    }

    // Generate unique Nagrik ID if not already generated
    if (!user.nagrikId) {
      let isUnique = false;
      let code = '';
      while (!isUnique) {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        code = `DL-NG-${randomNum}`;
        const existing = await User.findOne({ nagrikId: code });
        if (!existing) {
          isUnique = true;
        }
      }
      user.nagrikId = code;
    }

    user.isProfileSetup = true;

    await user.save();

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, firebaseSync, setupProfile };
