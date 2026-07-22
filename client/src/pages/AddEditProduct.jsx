import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const AddEditProduct = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    colour: '',
    size: '4L', // Default to common size
    customSize: '',
    buyingPrice: '',
    sellingPrice: '',
    quantity: '',
    supplier: '',
    dateAdded: new Date().toISOString().substring(0, 10),
  });

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);

  // Categories list options
  const categoryOptions = [
    'Emulsion Paint',
    'Enamel Paint',
    'Primer Coat',
    'Acrylic Paint',
    'Distemper',
    'Varnish & Lacquer',
    'Wall Putty',
    'Thinner & Solvent',
  ];

  // Size list options
  const sizeOptions = ['500ml', '1L', '4L', '10L', '20L', 'Custom'];

  // Load product if in edit mode
  useEffect(() => {
    const fetchProduct = async () => {
      if (!isEditMode) return;
      try {
        const response = await axios.get(`/api/products/${id}`);
        const prod = response.data;
        
        // Match sizes
        const sizeIsStandard = sizeOptions.includes(prod.size);

        setFormData({
          name: prod.name,
          brand: prod.brand,
          category: prod.category,
          colour: prod.colour,
          size: sizeIsStandard ? prod.size : 'Custom',
          customSize: sizeIsStandard ? '' : prod.size,
          buyingPrice: prod.buyingPrice,
          sellingPrice: prod.sellingPrice,
          quantity: prod.quantity,
          supplier: prod.supplier || '',
          dateAdded: new Date(prod.dateAdded).toISOString().substring(0, 10),
        });
      } catch (err) {
        console.error('Error fetching product data:', err);
        toast.error('Failed to retrieve paint product details');
        navigate('/products');
      } finally {
        setFetchingData(false);
      }
    };

    fetchProduct();
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const {
      name,
      brand,
      category,
      colour,
      size,
      customSize,
      buyingPrice,
      sellingPrice,
      quantity,
      supplier,
      dateAdded,
    } = formData;

    // Validate fields
    if (!name.trim() || !brand.trim() || !category.trim() || !colour.trim()) {
      toast.error('Please fill in all core text fields');
      setLoading(false);
      return;
    }

    const finalSize = size === 'Custom' ? customSize.trim() : size;
    if (!finalSize) {
      toast.error('Please specify a product size');
      setLoading(false);
      return;
    }

    const buyPriceNum = parseFloat(buyingPrice);
    const sellPriceNum = parseFloat(sellingPrice);
    const quantityNum = parseInt(quantity);

    if (isNaN(buyPriceNum) || buyPriceNum < 0) {
      toast.error('Buying price must be a positive number');
      setLoading(false);
      return;
    }

    if (isNaN(sellPriceNum) || sellPriceNum < 0) {
      toast.error('Selling price must be a positive number');
      setLoading(false);
      return;
    }

    if (sellPriceNum < buyPriceNum) {
      toast.warn('Selling price is lower than buying price (Loss transaction warning)');
    }

    if (isNaN(quantityNum) || quantityNum < 0) {
      toast.error('Initial quantity must be a non-negative integer');
      setLoading(false);
      return;
    }

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      colour: colour.trim(),
      size: finalSize,
      buyingPrice: buyPriceNum,
      sellingPrice: sellPriceNum,
      quantity: quantityNum,
      supplier: supplier.trim() || 'General Supplier',
      dateAdded: new Date(dateAdded),
    };

    try {
      if (isEditMode) {
        await axios.put(`/api/products/${id}`, payload);
        toast.success('Paint product updated successfully');
      } else {
        await axios.post('/api/products', payload);
        toast.success('New paint product registered successfully');
      }
      navigate('/products');
    } catch (err) {
      console.error('Error saving product:', err);
      toast.error(err.response?.data?.message || 'Failed to save product details');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) return <Loader message="Loading details..." />;

  return (
    <div className="mx-auto" style={{ maxWidth: '800px' }}>
      <div className="d-flex align-items-center mb-3">
        <Link to="/products" className="btn btn-light rounded-circle p-2 me-3 shadow-sm no-print" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-arrow-left"></i>
        </Link>
        <h4 className="fw-bold mb-0 text-dark">
          <i className="bi bi-paint-bucket text-primary me-2"></i>
          {isEditMode ? 'Modify Product Entry' : 'Register New Paint Product'}
        </h4>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white card-hover-effect">
        <form onSubmit={handleSubmit} noValidate>
          {/* Main Info */}
          <div className="row g-4">
            {/* Product Name */}
            <div className="col-12 col-md-6">
              <label htmlFor="name" className="form-label fw-semibold small text-muted">Product Name*</label>
              <input
                type="text"
                name="name"
                id="name"
                className="form-control bg-light py-2"
                placeholder="e.g. Weathercoat Anti-Dust"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Brand */}
            <div className="col-12 col-md-6">
              <label htmlFor="brand" className="form-label fw-semibold small text-muted">Brand*</label>
              <input
                type="text"
                name="brand"
                id="brand"
                className="form-control bg-light py-2"
                placeholder="e.g. Berger, Asian Paints, Dulux"
                value={formData.brand}
                onChange={handleChange}
                required
              />
            </div>

            {/* Category */}
            <div className="col-12 col-md-6">
              <label htmlFor="category" className="form-label fw-semibold small text-muted">Category*</label>
              <input
                type="text"
                name="category"
                id="category"
                className="form-control bg-light py-2"
                placeholder="e.g. Emulsion Paint, Acrylic, Custom Finish"
                value={formData.category}
                onChange={handleChange}
                list="category-suggestions"
                required
              />
              <datalist id="category-suggestions">
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Colour */}
            <div className="col-12 col-md-6">
              <label htmlFor="colour" className="form-label fw-semibold small text-muted">Colour Code / Name*</label>
              <input
                type="text"
                name="colour"
                id="colour"
                className="form-control bg-light py-2"
                placeholder="e.g. Off-White, Cherry Red, Golden Oak"
                value={formData.colour}
                onChange={handleChange}
                required
              />
            </div>

            {/* Size selection */}
            <div className="col-12 col-md-4">
              <label htmlFor="size" className="form-label fw-semibold small text-muted">Standard Size*</label>
              <select
                name="size"
                id="size"
                className="form-select bg-light py-2"
                value={formData.size}
                onChange={handleChange}
                required
              >
                {sizeOptions.map((sz) => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>

            {/* Custom Size field (if Standard Size is set to Custom) */}
            {formData.size === 'Custom' && (
              <div className="col-12 col-md-8">
                <label htmlFor="customSize" className="form-label fw-semibold small text-muted">Specify Custom Size*</label>
                <input
                  type="text"
                  name="customSize"
                  id="customSize"
                  className="form-control bg-light py-2"
                  placeholder="e.g. 2.5L, 15L, 200ml"
                  value={formData.customSize}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* Buying Price */}
            <div className="col-6 col-md-4">
              <label htmlFor="buyingPrice" className="form-label fw-semibold small text-muted">Buying Price ($)*</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="buyingPrice"
                id="buyingPrice"
                className="form-control bg-light py-2"
                placeholder="0.00"
                value={formData.buyingPrice}
                onChange={handleChange}
                required
              />
            </div>

            {/* Selling Price */}
            <div className="col-6 col-md-4">
              <label htmlFor="sellingPrice" className="form-label fw-semibold small text-muted">Selling Price ($)*</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="sellingPrice"
                id="sellingPrice"
                className="form-control bg-light py-2"
                placeholder="0.00"
                value={formData.sellingPrice}
                onChange={handleChange}
                required
              />
            </div>

            {/* Stock Quantity */}
            <div className="col-12 col-md-4">
              <label htmlFor="quantity" className="form-label fw-semibold small text-muted">Stock Quantity*</label>
              <input
                type="number"
                min="0"
                name="quantity"
                id="quantity"
                className="form-control bg-light py-2"
                placeholder="Enter stock units"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            {/* Supplier */}
            <div className="col-12 col-md-6">
              <label htmlFor="supplier" className="form-label fw-semibold small text-muted">Supplier Name</label>
              <input
                type="text"
                name="supplier"
                id="supplier"
                className="form-control bg-light py-2"
                placeholder="e.g. Berger Paints Dist. Ltd."
                value={formData.supplier}
                onChange={handleChange}
              />
            </div>

            {/* Date Added */}
            <div className="col-12 col-md-6">
              <label htmlFor="dateAdded" className="form-label fw-semibold small text-muted">Date Added</label>
              <input
                type="date"
                name="dateAdded"
                id="dateAdded"
                className="form-control bg-light py-2"
                value={formData.dateAdded}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-3 mt-5">
            <Link to="/products" className="btn btn-light rounded-pill px-4 py-2.5 fw-medium">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary rounded-pill px-5 py-2.5 fw-semibold d-flex align-items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Saving product...
                </>
              ) : (
                <>
                  <i className="bi bi-save"></i>
                  {isEditMode ? 'Update Details' : 'Register Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProduct;
