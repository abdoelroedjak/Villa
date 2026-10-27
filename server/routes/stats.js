const express = require('express');
const router = express.Router();
const storage = require('../db/storage');

// GET /api/stats (KPI & analytics metrics)
router.get('/', (req, res) => {
  try {
    const villas = storage.getVillas();
    const bookings = storage.getBookings();

    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN');
    const pendingBookings = bookings.filter(b => b.status === 'PENDING');
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalNightsBooked = confirmedBookings.reduce((sum, b) => sum + (b.nights || 0), 0);

    // Recent 5 bookings
    const recentBookings = [...bookings].slice(0, 5);

    // Revenue by villa
    const villaRevenueMap = {};
    bookings.forEach(b => {
      if (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') {
        villaRevenueMap[b.villaName] = (villaRevenueMap[b.villaName] || 0) + b.totalAmount;
      }
    });

    const revenueByVilla = Object.entries(villaRevenueMap).map(([name, amount]) => ({
      name,
      amount
    }));

    res.json({
      success: true,
      data: {
        totalVillas: villas.length,
        totalBookings: bookings.length,
        confirmedCount: confirmedBookings.length,
        pendingCount: pendingBookings.length,
        cancelledCount: cancelledBookings.length,
        totalRevenue,
        totalNightsBooked,
        recentBookings,
        revenueByVilla
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/stats/reset (Reset to initial sample data)
router.post('/reset', (req, res) => {
  try {
    const result = storage.resetToDefault();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
