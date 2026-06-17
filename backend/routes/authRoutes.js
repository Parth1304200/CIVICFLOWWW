const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validations/authValidation');

const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// POST /api/auth/firebase-sync
router.post('/firebase-sync', authController.firebaseSync);

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/setup-profile
router.post('/setup-profile', auth, upload.single('photo'), authController.setupProfile);

// GET /api/auth/me
router.get('/me', auth, authController.getMe);

module.exports = router;
