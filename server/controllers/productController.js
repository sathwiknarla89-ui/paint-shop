const Product = require('../models/Product');

// @desc    Get all products (with search & pagination)
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const lowStock = req.query.lowStock === 'true';

    // Build filter query
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { colour: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Low stock filter (quantity < 10)
    if (lowStock) {
      query.quantity = { $lt: 10 };
    }

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ dateAdded: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      products,
      page,
      pages: Math.ceil(count / limit),
      totalProducts: count,
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ message: 'Server error retrieving products', error: error.message });
  }
};

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error.message);
    res.status(500).json({ message: 'Server error retrieving product' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  const {
    name,
    brand,
    category,
    colour,
    size,
    buyingPrice,
    sellingPrice,
    quantity,
    supplier,
    dateAdded,
  } = req.body;

  try {
    // Validate inputs
    if (!name || !brand || !category || !colour || !size || buyingPrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const product = new Product({
      name,
      brand,
      category,
      colour,
      size,
      buyingPrice: Number(buyingPrice),
      sellingPrice: Number(sellingPrice),
      quantity: Number(quantity) || 0,
      supplier: supplier || 'General Supplier',
      dateAdded: dateAdded || Date.now(),
    });

    const createdProduct = await Product.create(product);
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).json({ message: 'Server error adding product', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  const {
    name,
    brand,
    category,
    colour,
    size,
    buyingPrice,
    sellingPrice,
    quantity,
    supplier,
    dateAdded,
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.name = name !== undefined ? name : product.name;
    product.brand = brand !== undefined ? brand : product.brand;
    product.category = category !== undefined ? category : product.category;
    product.colour = colour !== undefined ? colour : product.colour;
    product.size = size !== undefined ? size : product.size;
    product.buyingPrice = buyingPrice !== undefined ? Number(buyingPrice) : product.buyingPrice;
    product.sellingPrice = sellingPrice !== undefined ? Number(sellingPrice) : product.sellingPrice;
    product.quantity = quantity !== undefined ? Number(quantity) : product.quantity;
    product.supplier = supplier !== undefined ? supplier : product.supplier;
    product.dateAdded = dateAdded !== undefined ? dateAdded : product.dateAdded;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error.message);
    res.status(500).json({ message: 'Server error updating product', error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

// @desc    Quick update product quantity (e.g. adjust stock directly)
// @route   PATCH /api/products/:id/quantity
// @access  Private
const updateQuantity = async (req, res) => {
  const { quantity } = req.body;

  try {
    if (quantity === undefined || isNaN(quantity)) {
      return res.status(400).json({ message: 'Please provide a valid quantity' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.quantity = Number(quantity);
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error adjusting quantity:', error.message);
    res.status(500).json({ message: 'Server error adjusting stock quantity' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateQuantity,
};
