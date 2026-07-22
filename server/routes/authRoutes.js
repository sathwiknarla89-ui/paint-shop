const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify', protect, verifyUser);

module.exports = router;
