let currentVillas = [];
let selectedVilla = null;

// Format IDR Rupiah
function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

// Format Date YYYY-MM-DD
function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadVillas();

  // Set default checkin/checkout dates in booking modal
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 2);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const checkInInput = document.getElementById('bookCheckIn');
  const checkOutInput = document.getElementById('bookCheckOut');
  if (checkInInput && checkOutInput) {
    checkInInput.min = tomorrow.toISOString().split('T')[0];
    checkInInput.value = tomorrow.toISOString().split('T')[0];
    checkOutInput.min = dayAfter.toISOString().split('T')[0];
    checkOutInput.value = dayAfter.toISOString().split('T')[0];
  }
});

// Load villas from API
async function loadVillas() {
  const grid = document.getElementById('villaGrid');

  try {
    const res = await fetch('/api/villas');
    const json = await res.json();

    if (!json.success || !json.data.length) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-500 font-medium">Gagal memuat katalog villa.</div>`;
      return;
    }

    currentVillas = json.data;
    renderVillas(currentVillas);
  } catch (err) {
    console.error('Error fetching villas:', err);
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-500">Tidak dapat terhubung ke server.</div>`;
  }
}

// Render cards
function renderVillas(villas) {
  const grid = document.getElementById('villaGrid');
  if (!villas.length) return;

  grid.innerHTML = villas.map(villa => `
    <div class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12">
      <!-- Image / Gallery preview -->
      <div class="lg:col-span-6 relative h-80 sm:h-96 lg:h-auto overflow-hidden bg-slate-900 cursor-pointer" onclick="openBookingModal('${villa.id}')">
        <img src="${villa.images[0]}" alt="${villa.name}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
        
        <div class="absolute top-4 left-4 flex gap-2">
          <span class="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-md">
            Konsep Bohemian Bali
          </span>
          <span class="px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-md text-slate-900 shadow-md">
            Kota Batu
          </span>
        </div>

        <div class="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold text-slate-900 shadow-md">
          <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>
          <span>${villa.rating}/10</span>
          <span class="text-slate-400 font-normal">(${villa.reviewCount || 18} ulasan)</span>
        </div>

        <div class="absolute bottom-4 left-4 right-4 text-white">
          <a href="https://maps.app.goo.gl/9wx568xu14obMBP3A" target="_blank" onclick="event.stopPropagation()" class="inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200 font-medium bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-sm">
            <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
            <span>${villa.location}</span>
          </a>
          <h3 class="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 truncate">${villa.name}</h3>
        </div>
      </div>

      <!-- Content & Specs -->
      <div class="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <i data-lucide="sparkles" class="w-4 h-4"></i>
            <span>${villa.tagline}</span>
          </div>

          <h2 class="text-2xl font-extrabold text-slate-900">${villa.name} — Private Pool Villa</h2>
          <p class="text-sm text-slate-600 leading-relaxed mt-2">
            ${villa.description}
          </p>

          <!-- Core Highlights (3 KT, 3 KM, Private Pool) -->
          <div class="grid grid-cols-3 gap-3 my-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <div>
              <p class="text-[11px] text-slate-400 font-bold uppercase">Kolam</p>
              <p class="text-sm font-extrabold text-emerald-600 mt-0.5">Private Pool</p>
            </div>
            <div class="border-x border-slate-200">
              <p class="text-[11px] text-slate-400 font-bold uppercase">Kamar Tidur</p>
              <p class="text-sm font-extrabold text-slate-800 mt-0.5">3 KT</p>
            </div>
            <div>
              <p class="text-[11px] text-slate-400 font-bold uppercase">Kamar Mandi</p>
              <p class="text-sm font-extrabold text-slate-800 mt-0.5">3 KM</p>
            </div>
          </div>

          <!-- Key Amenities Checklist -->
          <div class="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
            <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i> Private Swimming Pool</div>
            <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i> Floating Breakfast Tray</div>
            <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i> Rooftop Gazebo & Pergola</div>
            <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i> Dapur & Alat Masak Lengkap</div>
            <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i> Wi-Fi Cepat & Water Heater</div>
            <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i> Dekat Wisata BNS & Coban Rais</div>
          </div>
        </div>

        <!-- Price & CTA Buttons -->
        <div class="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="text-xs text-slate-400 block font-semibold uppercase">Mulai Dari</span>
            <span class="text-2xl font-extrabold text-emerald-600">${formatIDR(villa.pricePerNight)}</span>
            <span class="text-xs text-slate-400 font-medium"> / malam</span>
          </div>

          <div class="flex items-center gap-2.5">
            <a href="https://wa.me/6282225665610?text=Halo%20Admin%20Villa%20Aksata,%20saya%20tertarik%20untuk%20booking" target="_blank" class="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>Chat WA 082225665610</span>
            </a>
            <button onclick="openBookingModal('${villa.id}')" class="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all">
              <span>Reservasi</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

// Modal handling
function openBookingModal(villaId) {
  const villa = currentVillas.find(v => v.id === villaId) || currentVillas[0];
  if (!villa) return;

  selectedVilla = villa;

  document.getElementById('bookVillaId').value = villa.id;
  document.getElementById('modalVillaImg').src = villa.images[0] || '/images/pool-floating-breakfast.jpg';
  document.getElementById('modalVillaName').textContent = villa.name;
  document.getElementById('modalVillaLoc').innerHTML = `<i data-lucide="map-pin" class="w-4 h-4 text-emerald-400"></i> ${villa.location}`;
  document.getElementById('modalVillaDesc').textContent = villa.description;
  document.getElementById('modalVillaPrice').textContent = formatIDR(villa.pricePerNight);
  document.getElementById('modalVillaRating').textContent = `${villa.rating}/10 (${villa.reviewCount || 18} ulasan Google)`;

  // Amenities
  const amContainer = document.getElementById('modalVillaAmenities');
  amContainer.innerHTML = (villa.amenities || []).map(am => `
    <div class="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
      <div class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
        <i data-lucide="check" class="w-3 h-3"></i>
      </div>
      <span class="text-xs font-semibold text-slate-700">${am}</span>
    </div>
  `).join('');

  calculatePrice();

  document.getElementById('bookingModal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.add('hidden');
}

// Calculate Price Live
function calculatePrice() {
  if (!selectedVilla && currentVillas.length) {
    selectedVilla = currentVillas[0];
  }
  if (!selectedVilla) return;

  const checkInVal = document.getElementById('bookCheckIn').value;
  const checkOutVal = document.getElementById('bookCheckOut').value;

  if (!checkInVal || !checkOutVal) return;

  const checkIn = new Date(checkInVal);
  const checkOut = new Date(checkOutVal);

  if (checkOut <= checkIn) {
    document.getElementById('priceCalcLabel').textContent = 'Pilih rentang tanggal valid';
    document.getElementById('priceSubtotal').textContent = '-';
    document.getElementById('priceTotal').textContent = '-';
    return;
  }

  const diffTime = checkOut.getTime() - checkIn.getTime();
  const nights = Math.max(1, Math.round(diffTime / (1000 * 3600 * 24)));
  const total = nights * selectedVilla.pricePerNight;

  document.getElementById('priceCalcLabel').textContent = `${formatIDR(selectedVilla.pricePerNight)} x ${nights} malam`;
  document.getElementById('priceSubtotal').textContent = formatIDR(total);
  document.getElementById('priceTotal').textContent = formatIDR(total);
}

// Submit Reservation
async function submitReservation(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitBooking');
  btn.disabled = true;
  btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> Memproses...`;

  const payload = {
    villaId: document.getElementById('bookVillaId').value,
    guestName: document.getElementById('bookGuestName').value.trim(),
    guestEmail: document.getElementById('bookGuestEmail').value.trim(),
    guestPhone: document.getElementById('bookGuestPhone').value.trim(),
    checkIn: document.getElementById('bookCheckIn').value,
    checkOut: document.getElementById('bookCheckOut').value,
    guests: document.getElementById('bookGuests').value,
    specialRequest: document.getElementById('bookSpecialRequest').value.trim()
  };

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (!result.success) {
      alert(`Gagal membuat reservasi: ${result.message}`);
      btn.disabled = false;
      btn.innerHTML = `<span>Konfirmasi Reservasi Villa</span>`;
      return;
    }

    // Success! Show Voucher Modal
    closeBookingModal();
    showVoucherModal(result.data);
  } catch (err) {
    console.error('Error submitting booking:', err);
    alert('Terjadi kesalahan jaringan saat mengirim pemesanan.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i> <span>Konfirmasi Reservasi Villa</span>`;
    if (window.lucide) lucide.createIcons();
  }
}

// Show Voucher Modal
function showVoucherModal(booking) {
  document.getElementById('voucherCode').textContent = booking.bookingCode;
  document.getElementById('voucherVilla').textContent = booking.villaName || 'Villa Aksata';
  document.getElementById('voucherGuest').textContent = booking.guestName;
  document.getElementById('voucherDates').textContent = `${formatDate(booking.checkIn)} — ${formatDate(booking.checkOut)} (${booking.nights} malam)`;
  document.getElementById('voucherTotal').textContent = formatIDR(booking.totalAmount);

  // Set WhatsApp confirmation text
  const waBtn = document.getElementById('btnWaConfirmation');
  if (waBtn) {
    const waText = encodeURIComponent(
      `Halo Admin Villa Aksata,\nSaya telah melakukan reservasi online:\n- Kode Booking: ${booking.bookingCode}\n- Nama: ${booking.guestName}\n- Periode: ${formatDate(booking.checkIn)} s/d ${formatDate(booking.checkOut)} (${booking.nights} malam)\n- Total: ${formatIDR(booking.totalAmount)}\nMohon konfirmasi ketersediaan dan detail check-in. Terima kasih!`
    );
    waBtn.href = `https://wa.me/6282225665610?text=${waText}`;
  }

  document.getElementById('voucherModal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeVoucherModal() {
  document.getElementById('voucherModal').classList.add('hidden');
}
