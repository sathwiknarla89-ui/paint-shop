const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');

// @desc    Get dashboard metrics & sales history data
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Products (Distinct count of catalog items)
    const totalProducts = await Product.countDocuments();

    // 2. Total Stock Quantity (Sum of quantities of all products)
    const stockStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalQty: { $sum: '$quantity' },
        },
      },
    ]);
    const totalStock = stockStats.length > 0 ? stockStats[0].totalQty : 0;

    // 3. Today's Sales
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaySalesStats = await Invoice.aggregate([
      {
        $match: {
          date: { $gte: startOfToday, $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
        },
      },
    ]);
    const todaySales = todaySalesStats.length > 0 ? todaySalesStats[0].totalRevenue : 0;

    // 4. Total Customers count
    const totalCustomers = await Customer.countDocuments();

    // 5. Low Stock Products list (quantity < 10)
    const lowStockProducts = await Product.find({ quantity: { $lt: 10 } })
      .select('name brand colour size quantity sellingPrice')
      .sort({ quantity: 1 })
      .limit(10); // Limit to top 10 most critical low stock items

    // 6. Monthly Sales Chart Data (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = [];

    // Pre-populate last 6 months with 0 value
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      chartData.push({
        year: d.getFullYear(),
        monthNum: d.getMonth() + 1, // 1-indexed for matching Mongoose $month
        month: monthNames[d.getMonth()],
        sales: 0,
      });
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const salesHistory = await Invoice.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          sales: { $sum: '$grandTotal' },
        },
      },
    ]);

    // Merge database aggregation results with pre-populated chart placeholders
    salesHistory.forEach((item) => {
      const match = chartData.find(
        (placeholder) =>
          placeholder.year === item._id.year && placeholder.monthNum === item._id.month
      );
      if (match) {
        match.sales = Math.round(item.sales * 100) / 100;
      }
    });

    // Strip out internal temporary variables before returning to frontend
    const finalChartData = chartData.map(({ month, sales }) => ({
      month,
      sales,
    }));

    res.json({
      totalProducts,
      totalStock,
      todaySales,
      totalCustomers,
      lowStockProducts,
      monthlySales: finalChartData,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error.message);
    res.status(500).json({ message: 'Server error retrieving dashboard analytics' });
  }
};

module.exports = {
  getDashboardStats,
};
