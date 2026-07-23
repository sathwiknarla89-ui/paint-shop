const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice,
  updateInvoice,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice);

module.exports = router;
