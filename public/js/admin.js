let allVillas = [];
let allBookings = [];

function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
});

async function loadDashboard() {
  await Promise.all([loadStats(), loadBookings(), loadVillasAdmin()]);
  if (window.lucide) lucide.createIcons();
}

// 1. Load Stats
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const json = await res.json();
    if (!json.success) return;

    const s = json.data;
    document.getElementById('statRevenue').textContent = formatIDR(s.totalRevenue);
    document.getElementById('statBookings').textContent = s.totalBookings;
    document.getElementById('statBookingsSub').textContent = `${s.confirmedCount} confirmed • ${s.pendingCount} pending`;
    document.getElementById('statNights').textContent = `${s.totalNightsBooked} Malam`;
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

// 2. Load Bookings
async function loadBookings() {
  const status = document.getElementById('bookingStatusFilter')?.value || '';
  const tbody = document.getElementById('bookingsTableBody');

  try {
    const url = status ? `/api/bookings?status=${status}` : '/api/bookings';
    const res = await fetch(url);
    const json = await res.json();

    if (!json.success) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-500">Gagal memuat pemesanan.</td></tr>`;
      return;
    }

    allBookings = json.data;

    if (!allBookings.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Belum ada data reservasi tamu.</td></tr>`;
      return;
    }

    const statusBadgeClass = {
      CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
      CHECKED_IN: 'bg-blue-100 text-blue-800 border-blue-200',
      CHECKED_OUT: 'bg-slate-100 text-slate-700 border-slate-200',
      CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200'
    };

    tbody.innerHTML = allBookings.map(b => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-5 py-4">
          <div class="font-mono font-bold text-slate-900">${b.bookingCode}</div>
          <div class="text-[11px] font-semibold text-slate-700 mt-0.5">${b.guestName}</div>
          <div class="text-[10px] text-slate-400">
            <a href="https://wa.me/${b.guestPhone.replace(/[^0-9]/g, '')}" target="_blank" class="hover:text-emerald-600 underline">WA: ${b.guestPhone}</a>
          </div>
        </td>
        <td class="px-5 py-4">
          <div class="font-bold text-slate-800">${b.guests} Orang Tamu</div>
          <div class="text-[10px] text-slate-400 truncate max-w-xs">${b.specialRequest || 'Tidak ada catatan'}</div>
        </td>
        <td class="px-5 py-4">
          <div class="text-slate-800 font-medium">${formatDate(b.checkIn)} — ${formatDate(b.checkOut)}</div>
          <div class="text-[10px] text-slate-400 font-semibold">${b.nights} malam</div>
        </td>
        <td class="px-5 py-4">
          <div class="font-bold text-emerald-700">${formatIDR(b.totalAmount)}</div>
        </td>
        <td class="px-5 py-4">
          <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBadgeClass[b.status] || 'bg-slate-100'}">
            ${b.status}
          </span>
        </td>
        <td class="px-5 py-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            ${b.status === 'PENDING' ? `
              <button onclick="updateBookingStatus('${b.id}', 'CONFIRMED')" title="Konfirmasi Reservasi" class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all">
                <i data-lucide="check" class="w-4 h-4"></i>
              </button>
            ` : ''}
            
            ${b.status === 'CONFIRMED' ? `
              <button onclick="updateBookingStatus('${b.id}', 'CHECKED_IN')" title="Tamu Check-In" class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-[10px] font-bold transition-all">
                Check-In
              </button>
            ` : ''}

            ${b.status === 'CHECKED_IN' ? `
              <button onclick="updateBookingStatus('${b.id}', 'CHECKED_OUT')" title="Tamu Selesai Menginap" class="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-800 hover:text-white text-[10px] font-bold transition-all">
                Check-Out
              </button>
            ` : ''}

            ${b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' ? `
              <button onclick="updateBookingStatus('${b.id}', 'CANCELLED')" title="Batalkan Reservasi" class="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            ` : ''}

            <button onclick="deleteBooking('${b.id}')" title="Hapus Data" class="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('Error loading bookings:', err);
  }
}

// 3. Update Booking Status
async function updateBookingStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const json = await res.json();
    if (!json.success) {
      alert(`Gagal: ${json.message}`);
      return;
    }
    await loadDashboard();
  } catch (err) {
    alert('Terjadi kesalahan jaringan.');
  }
}

// 4. Delete Booking
async function deleteBooking(id) {
  if (!confirm('Yakin ingin menghapus data reservasi ini?')) return;
  try {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) {
      alert(`Gagal: ${json.message}`);
      return;
    }
    await loadDashboard();
  } catch (err) {
    alert('Terjadi kesalahan jaringan.');
  }
}

// 5. Load Villas for Admin
async function loadVillasAdmin() {
  const container = document.getElementById('villasAdminGrid');
  try {
    const res = await fetch('/api/villas');
    const json = await res.json();
    if (!json.success) return;

    allVillas = json.data;

    container.innerHTML = allVillas.map(v => `
      <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs flex flex-col justify-between col-span-full md:col-span-2">
        <div>
          <div class="h-64 relative bg-slate-900">
            <img src="${v.images[0]}" alt="${v.name}" class="w-full h-full object-cover">
            <div class="absolute top-3 left-3 flex gap-2">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-md">
                Konsep Bohemian Bali
              </span>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                Kota Batu
              </span>
            </div>
            <div class="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-sm text-white font-bold text-sm">
              ${formatIDR(v.pricePerNight)} / malam
            </div>
          </div>
          <div class="p-6">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-extrabold text-slate-900 text-xl">${v.name}</h3>
                <p class="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-600"></i> ${v.location}
                </p>
              </div>
              <button onclick="editVilla('${v.id}')" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
                <i data-lucide="edit" class="w-3.5 h-3.5"></i> Edit Detail
              </button>
            </div>

            <p class="text-xs text-slate-600 mt-3 leading-relaxed">${v.description}</p>
            
            <div class="grid grid-cols-3 gap-3 my-4 p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase">Fasilitas</span>
                <p class="text-xs font-bold text-emerald-600 mt-0.5">Private Pool</p>
              </div>
              <div class="border-x border-slate-200">
                <span class="text-[10px] font-bold text-slate-400 uppercase">Kamar Tidur</span>
                <p class="text-xs font-bold text-slate-800 mt-0.5">${v.bedrooms} KT</p>
              </div>
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase">Kamar Mandi</span>
                <p class="text-xs font-bold text-slate-800 mt-0.5">${v.bathrooms} KM</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-xs pt-3 border-t border-slate-100 font-semibold text-slate-600">
              <a href="https://wa.me/6282225665610" target="_blank" class="hover:text-emerald-600 flex items-center gap-1 text-emerald-700">
                <i data-lucide="message-circle" class="w-4 h-4"></i> WhatsApp: 082225665610
              </a>
              <a href="https://www.instagram.com/villaaksata/" target="_blank" class="hover:text-pink-600 flex items-center gap-1 text-pink-700">
                <i data-lucide="instagram" class="w-4 h-4"></i> Instagram @villaaksata
              </a>
              <a href="https://maps.app.goo.gl/9wx568xu14obMBP3A" target="_blank" class="hover:text-blue-600 flex items-center gap-1 text-blue-700">
                <i data-lucide="map" class="w-4 h-4"></i> Google Maps Link
              </a>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('Error fetching admin villas:', err);
  }
}

// 6. Villa Modal & Form CRUD
function openVillaModal(villa = null) {
  const target = villa || allVillas[0];
  if (target) {
    document.getElementById('formVillaId').value = target.id;
    document.getElementById('formVillaName').value = target.name || 'Villa Aksata';
    document.getElementById('formVillaLoc').value = target.location || 'Kavling Jalibar, Kota Batu';
    document.getElementById('formVillaPrice').value = target.pricePerNight || 1750000;
    document.getElementById('formVillaTagline').value = target.tagline || 'Villa konsep bohemian di Batu serasa di Bali';
    document.getElementById('formVillaDesc').value = target.description || '';
    document.getElementById('formVillaGuests').value = target.maxGuests || 10;
    document.getElementById('formVillaBeds').value = target.bedrooms || 3;
    document.getElementById('formVillaBaths').value = target.bathrooms || 3;
    document.getElementById('formVillaWa').value = target.whatsapp || '082225665610';
    document.getElementById('formVillaMaps').value = target.mapsUrl || 'https://maps.app.goo.gl/9wx568xu14obMBP3A';
  }

  document.getElementById('villaModal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeVillaModal() {
  document.getElementById('villaModal').classList.add('hidden');
}

function editVilla(id) {
  const villa = allVillas.find(v => v.id === id) || allVillas[0];
  if (villa) openVillaModal(villa);
}

async function saveVilla(e) {
  e.preventDefault();
  const id = document.getElementById('formVillaId').value || 'vil-aksata';

  const payload = {
    name: document.getElementById('formVillaName').value.trim(),
    location: document.getElementById('formVillaLoc').value.trim(),
    pricePerNight: Number(document.getElementById('formVillaPrice').value),
    tagline: document.getElementById('formVillaTagline').value.trim(),
    description: document.getElementById('formVillaDesc').value.trim(),
    maxGuests: Number(document.getElementById('formVillaGuests').value),
    bedrooms: Number(document.getElementById('formVillaBeds').value),
    bathrooms: Number(document.getElementById('formVillaBaths').value),
    whatsapp: document.getElementById('formVillaWa').value.trim(),
    mapsUrl: document.getElementById('formVillaMaps').value.trim()
  };

  try {
    const res = await fetch(`/api/villas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (!json.success) {
      alert(`Gagal: ${json.message}`);
      return;
    }

    closeVillaModal();
    await loadDashboard();
  } catch (err) {
    alert('Terjadi kesalahan jaringan.');
  }
}

// 7. Tab Navigation
function switchTab(tab) {
  const isBookings = tab === 'bookings';
  document.getElementById('tabContentBookings').classList.toggle('hidden', !isBookings);
  document.getElementById('tabContentVillas').classList.toggle('hidden', isBookings);

  const btnB = document.getElementById('tabBtnBookings');
  const btnV = document.getElementById('tabBtnVillas');

  if (isBookings) {
    btnB.className = 'pb-3 text-emerald-600 border-b-2 border-emerald-600 flex items-center gap-2';
    btnV.className = 'pb-3 text-slate-500 hover:text-slate-800 border-b-2 border-transparent flex items-center gap-2';
  } else {
    btnV.className = 'pb-3 text-emerald-600 border-b-2 border-emerald-600 flex items-center gap-2';
    btnB.className = 'pb-3 text-slate-500 hover:text-slate-800 border-b-2 border-transparent flex items-center gap-2';
  }
}
