//untuk data harga json  kalo diskon "harga_asli": 22000, "status_harga": "turun"
const GITHUB_BASE_URL = 'https://jatijayastore.github.io/PerabotanRumahTangga/';
const WA_NUMBER = '6281212664277';
let products = [];
let currentFilter = 'Semua';

function formatHarga(value) {
  if (value === null || value === undefined || value === '') return 'Hubungi CS';
  if (typeof value === 'string' && value.includes('-')) {
    const [min, max] = value.split('-').map(Number);
    if (!isNaN(min) && !isNaN(max)) return `Rp ${min.toLocaleString('id-ID')} - ${max.toLocaleString('id-ID')}`;
    return 'Hubungi CS';
  }
  const num = Number(value);
  if (isNaN(num)) return 'Hubungi CS';
  if (num === 0) return 'Gratis';
  return `Rp ${num.toLocaleString('id-ID')}`;
}

// --- PERBAIKAN 1: Memotong awalan "images/" ---
function getImageUrl(url) {
  if (url && typeof url === 'string' && url.trim().length > 0) {
    if (url.startsWith('images/')) {
      // Hapus 'images/' agar pathnya langsung digabung dengan base url
      return GITHUB_BASE_URL + url.substring(7);
    }
    return url;
  }
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"%3E%3Crect width="300" height="300" fill="%23f3f4f6"/%3E%3Ctext x="150" y="150" font-family="sans-serif" font-size="18" fill="%239ca3af" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
}

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:20px;">Memuat data toko...</p>';

  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('File data.json tidak ditemukan!');
    
    const data = await res.json();
    
    const filteredData = data.filter(item => {
      if (!item.nama || typeof item.nama !== 'string' || item.nama.trim() === '') return false;
      if (item.harga === null || item.harga === undefined || item.harga === '') return false;
      if (Number(item.harga) === 0) return false; 
      return true;
    });

    if (!filteredData || filteredData.length === 0) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Tidak ada produk valid.</p>';
      return;
    }
    
    products = filteredData;
    renderProducts(products);
    populateCategories(products);
  } catch (error) {
    grid.innerHTML = `<p style="color:red;grid-column:1/-1;text-align:center;">Error: ${error.message}</p>`;
  }
}

function renderProducts(data) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  
  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    
    // LOGIKA HARGA NAIK/TURUN
    let badgeHtml = '';
    let priceHtml = `<div class="price-tag">${formatHarga(item.harga)}</div>`;

    if (item.status_harga) {
      if (item.status_harga === 'turun' && item.harga_asli) {
        badgeHtml = `<span class="badge-container diskon">Diskon!</span>`;
        priceHtml = `
          <div class="price-wrapper" style="position:relative; display:inline-block;">
            <span style="display:block; font-size:0.7rem; text-decoration:line-through; color:#94a3b8;">${formatHarga(item.harga_asli)}</span>
            <div class="price-tag" style="background:#fee2e2; color:#dc2626;">${formatHarga(item.harga)}</div>
          </div>
        `;
      } else if (item.status_harga === 'naik') {
        badgeHtml = `<span class="badge-container naik">Naik</span>`;
        priceHtml = `<div class="price-tag" style="background:#fef3c7; color:#d97706;">${formatHarga(item.harga)}</div>`;
      }
    }

    // --- PERBAIKAN 2: Tukar urutan h4 dan img-wrapper ---
    card.innerHTML = `
      <div class="img-wrapper">
        <img src="${getImageUrl(item.image_url)}" alt="${item.nama}" loading="lazy" onerror="this.onerror=null;this.src='${getImageUrl()}';">
        ${badgeHtml}
      </div>
      <h4>${item.nama}</h4>
      ${priceHtml}
    `;
    card.addEventListener('click', () => openModal(item));
    grid.appendChild(card);
  });
}

function populateCategories(data) {
  const container = document.getElementById('categoryFilters');
  container.innerHTML = '';
  const cats = ['Semua', ...new Set(data.map(p => p.kategori).filter(Boolean))];
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === currentFilter ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = cat;
      applyFilterAndSearch();
    });
    container.appendChild(btn);
  });
}

function applyFilterAndSearch() {
  const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
  let filtered = products;
  if (currentFilter !== 'Semua') filtered = filtered.filter(p => p.kategori === currentFilter);
  if (keyword) filtered = filtered.filter(p => p.nama && p.nama.toLowerCase().includes(keyword));
  renderProducts(filtered);
}
document.getElementById('searchInput').addEventListener('input', applyFilterAndSearch);

function openModal(item) {
  document.getElementById('modalImage').src = getImageUrl(item.image_url);
  document.getElementById('modalImage').onerror = function() { this.src = getImageUrl(); };
  document.getElementById('modalTitle').textContent = item.nama || 'Tanpa Nama';
  
  let modalPriceHtml = `<div class="price-large">${formatHarga(item.harga)}</div>`;
  if (item.status_harga === 'turun' && item.harga_asli) {
    modalPriceHtml = `
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="text-decoration:line-through; color:#94a3b8; font-size:1rem;">${formatHarga(item.harga_asli)}</span>
            <div class="price-large discount">${formatHarga(item.harga)}</div>
            <span class="badge-container diskon" style="position:static;">Diskon!</span>
        </div>
    `;
  } else if (item.status_harga === 'naik') {
    modalPriceHtml = `
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <div class="price-large" style="color:#d97706;">${formatHarga(item.harga)}</div>
            <span class="badge-container naik" style="position:static;">Naik</span>
        </div>
    `;
  }
  document.getElementById('modalPrice').innerHTML = modalPriceHtml;

  const hargaString = formatHarga(item.harga);
  const message = `Halo, saya tertarik dengan produk "${item.nama}" dengan harga "${hargaString}" dan ingin menanyakan lebih lanjut`;
  document.getElementById('modalChatBtn').href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  document.getElementById('productModal').classList.remove('hidden');

  const keywords = (item.nama || '').toLowerCase().split(' ').filter(k => k.length > 1);
  const related = products
    .filter(p => p.nama !== item.nama)
    .filter(p => keywords.some(k => p.nama?.toLowerCase().includes(k)))
    .slice(0, 4);
    
  const container = document.getElementById('relatedProducts');
  container.innerHTML = '<div class="related-title">🔍 Produk Serupa</div>';
  if (related.length === 0) {
    container.innerHTML += '<p style="grid-column:1/-1;color:#999;font-size:0.85rem;">Tidak ada produk serupa.</p>';
  } else {
    related.forEach(p => {
      const div = document.createElement('div');
      div.className = 'related-item';
      div.innerHTML = `
        <img src="${getImageUrl(p.image_url)}" onerror="this.src='${getImageUrl()}';" loading="lazy">
        <p>${p.nama}</p>
        <span class="rec-price">${formatHarga(p.harga)}</span>`;
      div.addEventListener('click', () => {
        document.getElementById('productModal').classList.add('hidden');
        openModal(p);
      });
      container.appendChild(div);
    });
  }
}

document.querySelector('.close-btn').addEventListener('click', () => document.getElementById('productModal').classList.add('hidden'));
window.addEventListener('click', (e) => {
  if (e.target === document.getElementById('productModal')) document.getElementById('productModal').classList.add('hidden');
});

loadProducts();