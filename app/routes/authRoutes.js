const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/authValidator');

const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many attempts from this IP, please try again after a minute"
});

router.get('/login', authController.getLoginPage);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.get('/register', authController.getRegisterPage);
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.get('/logout', authController.logout);

module.exports = router;
