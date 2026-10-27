const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const VILLAS_FILE = path.join(DATA_DIR, 'villas.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const DEFAULT_DATA_FILE = path.join(__dirname, 'defaultData.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const defaultData = JSON.parse(fs.readFileSync(DEFAULT_DATA_FILE, 'utf-8'));

  if (!fs.existsSync(VILLAS_FILE)) {
    fs.writeFileSync(VILLAS_FILE, JSON.stringify(defaultData.villas, null, 2), 'utf-8');
  }

  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(defaultData.bookings, null, 2), 'utf-8');
  }
}

function readJSON(file) {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return [];
  }
}

function writeJSON(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// Villa methods
function getVillas() {
  return readJSON(VILLAS_FILE);
}

function getVillaById(id) {
  const villas = getVillas();
  return villas.find(v => v.id === id);
}

function getReviews() {
  const defaultData = JSON.parse(fs.readFileSync(DEFAULT_DATA_FILE, 'utf-8'));
  return defaultData.reviews || [];
}

function createVilla(payload) {
  const villas = getVillas();
  const newVilla = {
    id: `vil-${Date.now()}`,
    name: payload.name || 'Villa Aksata',
    tagline: payload.tagline || 'Villa konsep bohemian di Batu serasa di Bali',
    description: payload.description || '',
    location: payload.location || 'Kavling Jalibar, Kota Batu, Jawa Timur',
    mapsUrl: payload.mapsUrl || 'https://maps.app.goo.gl/9wx568xu14obMBP3A',
    instagramUrl: payload.instagramUrl || 'https://www.instagram.com/villaaksata/',
    whatsapp: payload.whatsapp || '082225665610',
    pricePerNight: Number(payload.pricePerNight) || 1750000,
    bedrooms: Number(payload.bedrooms) || 3,
    bathrooms: Number(payload.bathrooms) || 3,
    maxGuests: Number(payload.maxGuests) || 10,
    rating: Number(payload.rating) || 9.5,
    reviewCount: 18,
    featured: Boolean(payload.featured),
    images: Array.isArray(payload.images) && payload.images.length > 0
      ? payload.images
      : ['/images/pool-floating-breakfast.jpg'],
    amenities: Array.isArray(payload.amenities) ? payload.amenities : ['Private Pool', '3 KT', '3 KM', 'Free Wi-Fi']
  };

  villas.unshift(newVilla);
  writeJSON(VILLAS_FILE, villas);
  return newVilla;
}

function updateVilla(id, payload) {
  const villas = getVillas();
  const index = villas.findIndex(v => v.id === id);
  if (index === -1) return null;

  villas[index] = {
    ...villas[index],
    ...payload,
    pricePerNight: payload.pricePerNight !== undefined ? Number(payload.pricePerNight) : villas[index].pricePerNight,
    bedrooms: payload.bedrooms !== undefined ? Number(payload.bedrooms) : villas[index].bedrooms,
    bathrooms: payload.bathrooms !== undefined ? Number(payload.bathrooms) : villas[index].bathrooms,
    maxGuests: payload.maxGuests !== undefined ? Number(payload.maxGuests) : villas[index].maxGuests,
    id
  };

  writeJSON(VILLAS_FILE, villas);
  return villas[index];
}

function deleteVilla(id) {
  const villas = getVillas();
  const filtered = villas.filter(v => v.id !== id);
  if (filtered.length === villas.length) return false;
  writeJSON(VILLAS_FILE, filtered);
  return true;
}

// Booking methods
function getBookings() {
  return readJSON(BOOKINGS_FILE);
}

function getBookingByCode(code) {
  const bookings = getBookings();
  const cleanCode = (code || '').trim().toUpperCase();
  return bookings.find(b => b.bookingCode.toUpperCase() === cleanCode);
}

function createBooking(payload) {
  const bookings = getBookings();
  const villa = getVillaById(payload.villaId) || getVillas()[0];
  if (!villa) throw new Error('Villa tidak ditemukan.');

  const checkIn = new Date(payload.checkIn);
  const checkOut = new Date(payload.checkOut);
  const diffTime = checkOut.getTime() - checkIn.getTime();
  const nights = Math.max(1, Math.round(diffTime / (1000 * 3600 * 24)));

  const totalAmount = nights * villa.pricePerNight;
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const bookingCode = `VIL-${randomSuffix}`;

  const newBooking = {
    id: `bk-${Date.now()}`,
    bookingCode,
    villaId: villa.id,
    villaName: villa.name,
    guestName: payload.guestName,
    guestEmail: payload.guestEmail,
    guestPhone: payload.guestPhone,
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    nights,
    guests: Number(payload.guests) || 1,
    totalAmount,
    status: 'CONFIRMED',
    specialRequest: payload.specialRequest || '',
    createdAt: new Date().toISOString()
  };

  bookings.unshift(newBooking);
  writeJSON(BOOKINGS_FILE, bookings);
  return newBooking;
}

function updateBookingStatus(id, status) {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === id || b.bookingCode === id);
  if (index === -1) return null;

  bookings[index].status = status;
  writeJSON(BOOKINGS_FILE, bookings);
  return bookings[index];
}

function deleteBooking(id) {
  const bookings = getBookings();
  const filtered = bookings.filter(b => b.id !== id && b.bookingCode !== id);
  if (filtered.length === bookings.length) return false;
  writeJSON(BOOKINGS_FILE, filtered);
  return true;
}

function resetToDefault() {
  const defaultData = JSON.parse(fs.readFileSync(DEFAULT_DATA_FILE, 'utf-8'));
  writeJSON(VILLAS_FILE, defaultData.villas);
  writeJSON(BOOKINGS_FILE, defaultData.bookings);
  return { message: 'Database reset to default successful' };
}

module.exports = {
  getVillas,
  getVillaById,
  getReviews,
  createVilla,
  updateVilla,
  deleteVilla,
  getBookings,
  getBookingByCode,
  createBooking,
  updateBookingStatus,
  deleteBooking,
  resetToDefault
};
