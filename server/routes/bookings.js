const express = require('express');
const router = express.Router();
const storage = require('../db/storage');

// GET /api/bookings
router.get('/', (req, res) => {
  try {
    let bookings = storage.getBookings();
    const { status, villaId } = req.query;

    if (status) {
      bookings = bookings.filter(b => b.status.toUpperCase() === status.toUpperCase());
    }

    if (villaId) {
      bookings = bookings.filter(b => b.villaId === villaId);
    }

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings/:code (Lookup by code or ID)
router.get('/:code', (req, res) => {
  try {
    const booking = storage.getBookingByCode(req.params.code);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Kode booking tidak ditemukan.' });
    }
    const villa = storage.getVillaById(booking.villaId);
    res.json({ success: true, data: { ...booking, villa } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/bookings (Create new reservation)
router.post('/', (req, res) => {
  try {
    const { villaId, guestName, guestEmail, guestPhone, checkIn, checkOut, guests } = req.body;

    if (!villaId || !guestName || !guestEmail || !guestPhone || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi semua data pemesanan (Nama, Email, No. Telepon, Tanggal Check-in & Check-out).'
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Format tanggal tidak valid.' });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal check-out harus setelah tanggal check-in.'
      });
    }

    const newBooking = storage.createBooking(req.body);
    res.status(201).json({
      success: true,
      message: 'Reservasi berhasil dibuat!',
      data: newBooking
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/bookings/:id/status (Admin change status)
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['CONFIRMED', 'PENDING', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT'];
    if (!status || !allowed.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Status tidak valid. Pilihan: ${allowed.join(', ')}`
      });
    }

    const updated = storage.updateBookingStatus(req.params.id, status.toUpperCase());
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Pemesanan tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Status pemesanan berhasil diubah.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/bookings/:id
router.delete('/:id', (req, res) => {
  try {
    const deleted = storage.deleteBooking(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Pemesanan tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Pemesanan berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
