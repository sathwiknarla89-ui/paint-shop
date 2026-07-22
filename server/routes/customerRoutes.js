const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerById } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);

module.exports = router;
