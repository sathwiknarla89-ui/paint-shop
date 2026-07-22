const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const search = req.query.search || '';
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query)
      .sort({ totalPurchases: -1 }); // Default sort by highest value clients

    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    res.status(500).json({ message: 'Server error retrieving customer directory' });
  }
};

// @desc    Get customer details and their invoices
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate({
        path: 'bills',
        options: { sort: { date: -1 } }, // Get invoices chronologically
      });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer details:', error.message);
    res.status(500).json({ message: 'Server error retrieving customer details' });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
};
