const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// Helper to generate Invoice Number (e.g., INV-20260709-XXXX)
const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${rand}`;
};

// @desc    Get all invoices (with search by customer, invoice number, or date range)
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const search = req.query.search || '';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = {};

    // Customer or Invoice number search
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of that day (23:59:59)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const invoices = await Invoice.find(query).sort({ date: -1 });
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error.message);
    res.status(500).json({ message: 'Server error retrieving invoice history' });
  }
};

// @desc    Get single invoice details
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice details:', error.message);
    res.status(500).json({ message: 'Server error retrieving invoice details' });
  }
};

// @desc    Create an invoice (processes billing, customer records, and inventory decrement)
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  const {
    customerName,
    customerPhone,
    products, // Array of { product: id, quantity: n, sellingPrice: p }
    gstPercent,
  } = req.body;

  try {
    // 1. Validation
    if (!customerName || !products || products.length === 0) {
      return res.status(400).json({ message: 'Please provide customer name and at least one product' });
    }

    // 2. Verify stock levels for all products before editing anything
    const itemsToBill = [];
    let subtotal = 0;

    for (let item of products) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        return res.status(404).json({ message: `Product not found: ID ${item.product}` });
      }

      if (dbProduct.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${dbProduct.name} (${dbProduct.size}). Available: ${dbProduct.quantity}, Requested: ${item.quantity}`,
        });
      }

      const totalItemAmount = dbProduct.sellingPrice * item.quantity;
      subtotal += totalItemAmount;

      itemsToBill.push({
        product: dbProduct._id,
        name: dbProduct.name,
        brand: dbProduct.brand,
        colour: dbProduct.colour,
        size: dbProduct.size,
        quantity: item.quantity,
        sellingPrice: dbProduct.sellingPrice,
        total: totalItemAmount,
        dbProductRef: dbProduct, // Temp reference for stock reduction
      });
    }

    // Calculate Taxes & Totals
    const gstRate = parseFloat(gstPercent) || 0;
    const gstAmount = Math.round(((subtotal * gstRate) / 100) * 100) / 100;
    const grandTotal = subtotal + gstAmount;

    // 3. Find or Create Customer
    let customer;
    const normalizedPhone = customerPhone ? customerPhone.trim() : '';

    if (normalizedPhone) {
      // Find customer by phone
      customer = await Customer.findOne({ phone: normalizedPhone });
    }

    // If not found or no phone was provided, find by name or create
    if (!customer) {
      customer = new Customer({
        name: customerName.trim(),
        phone: normalizedPhone,
        totalPurchases: 0,
        bills: [],
      });
    }

    // Save initial customer record if new
    await customer.save();

    // 4. Generate Invoice and save it
    const invoiceNumber = generateInvoiceNumber();
    const invoice = new Invoice({
      invoiceNumber,
      customer: customer._id,
      customerName: customerName.trim(),
      customerPhone: normalizedPhone,
      products: itemsToBill.map((item) => ({
        product: item.product,
        name: item.name,
        brand: item.brand,
        colour: item.colour,
        size: item.size,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        total: item.total,
      })),
      subtotal,
      gstPercent: gstRate,
      gstAmount,
      grandTotal,
    });

    const savedInvoice = await invoice.save();

    // 5. Update inventory stock & save changes
    for (let item of itemsToBill) {
      item.dbProductRef.quantity -= item.quantity;
      await item.dbProductRef.save();
    }

    // 6. Update Customer metrics
    customer.bills.push(savedInvoice._id);
    customer.totalPurchases += grandTotal;
    customer.lastPurchaseDate = savedInvoice.date;
    await customer.save();

    res.status(201).json(savedInvoice);
  } catch (error) {
    console.error('Invoice Creation Error:', error.message);
    res.status(500).json({ message: 'Server error processing transaction', error: error.message });
  }
};

// @desc    Delete an invoice (reverts billing, restores stock levels, updates customer history)
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // 1. Restore product inventory quantities
    for (let item of invoice.products) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += item.quantity;
        await product.save();
      }
    }

    // 2. Adjust customer history
    const customer = await Customer.findById(invoice.customer);
    if (customer) {
      // Remove bill from list
      customer.bills = customer.bills.filter(
        (billId) => billId.toString() !== invoice._id.toString()
      );
      // Deduct total spent
      customer.totalPurchases = Math.max(0, customer.totalPurchases - invoice.grandTotal);
      
      // Re-evaluate last purchase date
      if (customer.bills.length > 0) {
        const remainingInvoices = await Invoice.find({
          _id: { $in: customer.bills },
        }).sort({ date: -1 });

        customer.lastPurchaseDate = remainingInvoices.length > 0 ? remainingInvoices[0].date : null;
      } else {
        customer.lastPurchaseDate = null;
      }

      await customer.save();
    }

    // 3. Delete the invoice
    await Invoice.findByIdAndDelete(req.params.id);

    res.json({ message: 'Invoice deleted successfully. Inventory stock has been restored.' });
  } catch (error) {
    console.error('Invoice Deletion Error:', error.message);
    res.status(500).json({ message: 'Server error deleting invoice', error: error.message });
  }
};

// @desc    Update an invoice (recalculates billing, adjusts stock levels, updates customer history)
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
  const {
    customerName,
    customerPhone,
    products, // Array of { product: id, quantity: n, sellingPrice: p }
    gstPercent,
  } = req.body;

  try {
    // 1. Validation
    if (!customerName || !products || products.length === 0) {
      return res.status(400).json({ message: 'Please provide customer name and at least one product' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // 2. Temporarily restore stock levels of the old products
    const oldProductsMap = new Map();
    for (let oldItem of invoice.products) {
      const dbProd = await Product.findById(oldItem.product);
      if (dbProd) {
        dbProd.quantity += oldItem.quantity;
        await dbProd.save();
        oldProductsMap.set(oldItem.product.toString(), dbProd);
      }
    }

    // 3. Verify stock levels for the new products list
    const itemsToBill = [];
    let subtotal = 0;

    for (let newItem of products) {
      let dbProduct = oldProductsMap.get(newItem.product.toString());
      if (!dbProduct) {
        dbProduct = await Product.findById(newItem.product);
      }

      if (!dbProduct) {
        // Revert the temporary stock restoration before erroring out
        for (let oldItem of invoice.products) {
          const dbProd = await Product.findById(oldItem.product);
          if (dbProd) {
            dbProd.quantity -= oldItem.quantity;
            await dbProd.save();
          }
        }
        return res.status(404).json({ message: `Product not found: ID ${newItem.product}` });
      }

      if (dbProduct.quantity < newItem.quantity) {
        // Revert the temporary stock restoration before erroring out
        for (let oldItem of invoice.products) {
          const dbProd = await Product.findById(oldItem.product);
          if (dbProd) {
            dbProd.quantity -= oldItem.quantity;
            await dbProd.save();
          }
        }
        return res.status(400).json({
          message: `Insufficient stock for ${dbProduct.name} (${dbProduct.size}). Available: ${dbProduct.quantity}, Requested: ${newItem.quantity}`,
        });
      }

      const totalItemAmount = dbProduct.sellingPrice * newItem.quantity;
      subtotal += totalItemAmount;

      itemsToBill.push({
        product: dbProduct._id,
        name: dbProduct.name,
        brand: dbProduct.brand,
        colour: dbProduct.colour,
        size: dbProduct.size,
        quantity: newItem.quantity,
        sellingPrice: dbProduct.sellingPrice,
        total: totalItemAmount,
        dbProductRef: dbProduct,
      });
    }

    // Calculate Taxes & Totals
    const gstRate = parseFloat(gstPercent) || 0;
    const gstAmount = Math.round(((subtotal * gstRate) / 100) * 100) / 100;
    const grandTotal = subtotal + gstAmount;

    // 4. Commit new stock levels
    for (let item of itemsToBill) {
      item.dbProductRef.quantity -= item.quantity;
      await item.dbProductRef.save();
    }

    // 5. Update Customer Metrics
    const oldCustomerId = invoice.customer;
    const normalizedPhone = customerPhone ? customerPhone.trim() : '';

    let customer;
    if (normalizedPhone) {
      customer = await Customer.findOne({ phone: normalizedPhone });
    }

    if (!customer) {
      customer = new Customer({
        name: customerName.trim(),
        phone: normalizedPhone,
        totalPurchases: 0,
        bills: [],
      });
      await customer.save();
    }

    const customerHasChanged = oldCustomerId.toString() !== customer._id.toString();

    // Adjust old customer metrics
    const oldCustomer = await Customer.findById(oldCustomerId);
    if (oldCustomer) {
      if (customerHasChanged) {
        // Remove bill from old customer list
        oldCustomer.bills = oldCustomer.bills.filter(
          (billId) => billId.toString() !== invoice._id.toString()
        );
        oldCustomer.totalPurchases = Math.max(0, oldCustomer.totalPurchases - invoice.grandTotal);
      } else {
        // Adjust the spending difference
        oldCustomer.totalPurchases = Math.max(0, oldCustomer.totalPurchases - invoice.grandTotal + grandTotal);
        oldCustomer.name = customerName.trim();
      }

      // Re-evaluate last purchase date
      if (oldCustomer.bills.length > 0) {
        const remainingInvoices = await Invoice.find({
          _id: { $in: oldCustomer.bills },
        }).sort({ date: -1 });
        oldCustomer.lastPurchaseDate = remainingInvoices.length > 0 ? remainingInvoices[0].date : null;
      } else {
        oldCustomer.lastPurchaseDate = null;
      }
      await oldCustomer.save();
    }

    // Adjust new customer metrics if changed
    if (customerHasChanged) {
      if (!customer.bills.some(b => b.toString() === invoice._id.toString())) {
        customer.bills.push(invoice._id);
      }
      customer.totalPurchases += grandTotal;
      // Re-evaluate last purchase date
      const remainingInvoices = await Invoice.find({
        _id: { $in: customer.bills },
      }).sort({ date: -1 });
      customer.lastPurchaseDate = remainingInvoices.length > 0 ? remainingInvoices[0].date : null;
      customer.name = customerName.trim();
      await customer.save();
    }

    // 6. Update the invoice record
    invoice.customer = customer._id;
    invoice.customerName = customerName.trim();
    invoice.customerPhone = normalizedPhone;
    invoice.products = itemsToBill.map((item) => ({
      product: item.product,
      name: item.name,
      brand: item.brand,
      colour: item.colour,
      size: item.size,
      quantity: item.quantity,
      sellingPrice: item.sellingPrice,
      total: item.total,
    }));
    invoice.subtotal = subtotal;
    invoice.gstPercent = gstRate;
    invoice.gstAmount = gstAmount;
    invoice.grandTotal = grandTotal;

    const updatedInvoice = await invoice.save();
    res.json(updatedInvoice);
  } catch (error) {
    console.error('Invoice Update Error:', error.message);
    res.status(500).json({ message: 'Server error updating transaction', error: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice,
  updateInvoice,
};
