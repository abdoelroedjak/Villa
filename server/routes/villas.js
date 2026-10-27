const express = require('express');
const router = express.Router();
const storage = require('../db/storage');

// GET /api/villas/meta/reviews
router.get('/meta/reviews', (req, res) => {
  try {
    const reviews = storage.getReviews();
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/villas
router.get('/', (req, res) => {
  try {
    let villas = storage.getVillas();
    const { search, location, maxPrice, minGuests, featured } = req.query;

    if (search) {
      const q = search.toLowerCase();
      villas = villas.filter(v => 
        v.name.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
      );
    }

    if (location) {
      const loc = location.toLowerCase();
      villas = villas.filter(v => v.location.toLowerCase().includes(loc));
    }

    if (maxPrice) {
      villas = villas.filter(v => v.pricePerNight <= Number(maxPrice));
    }

    if (minGuests) {
      villas = villas.filter(v => v.maxGuests >= Number(minGuests));
    }

    if (featured === 'true') {
      villas = villas.filter(v => v.featured);
    }

    res.json({ success: true, count: villas.length, data: villas });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/villas/:id
router.get('/:id', (req, res) => {
  try {
    const villa = storage.getVillaById(req.params.id);
    if (!villa) {
      return res.status(404).json({ success: false, message: 'Villa tidak ditemukan.' });
    }
    res.json({ success: true, data: villa });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/villas (Create)
router.post('/', (req, res) => {
  try {
    const { name, pricePerNight, maxGuests, location } = req.body;
    if (!name || !pricePerNight || !location) {
      return res.status(400).json({
        success: false,
        message: 'Nama villa, harga per malam, dan lokasi wajib diisi.'
      });
    }

    const newVilla = storage.createVilla(req.body);
    res.status(201).json({ success: true, message: 'Villa berhasil ditambahkan.', data: newVilla });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/villas/:id (Update)
router.put('/:id', (req, res) => {
  try {
    const updated = storage.updateVilla(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Villa tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Villa berhasil diperbarui.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/villas/:id (Delete)
router.delete('/:id', (req, res) => {
  try {
    const deleted = storage.deleteVilla(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Villa tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Villa berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
