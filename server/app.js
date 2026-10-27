const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const villaRoutes = require('./routes/villas');
const bookingRoutes = require('./routes/bookings');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files (Frontend Client & Admin UI)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/villas', villaRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stats', statsRoutes);

// Direct shortcuts for routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🌴 Villa Platform Server Berjalan!`);
    console.log(`🌐 Tamu & Portal Booking : http://localhost:${PORT}`);
    console.log(`⚙️  Admin & Pemilik Villa : http://localhost:${PORT}/admin`);
    console.log(`🔌 API Base URL          : http://localhost:${PORT}/api/villas`);
    console.log(`===============================================`);
  });
}

module.exports = app;
