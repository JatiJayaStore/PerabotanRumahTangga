// Konfigurasi Supabase
const SUPABASE_URL = 'https://fmfsdqexilhswoqlawes.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-EVqHClMsBfPyI_1ZjqUQw_e8cpcags';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const WA_NUMBER = '6281212664277';
let products = [];
let currentFilter = 'Semua';

function formatHarga(value) {
  if (value === null || value === undefined || value === '') return 'Hubungi CS';
  if (typeof value === 'string' && value.includes('-')) {
    const [min, max] = value.split('-').map(Number);
    if (!isNaN(min) && !isNaN(max)) {
      return `Rp ${min.toLocaleString('id-ID')} - ${max.toLocaleString('id-ID')}`;
    }
    return 'Hubungi CS';
  }
  const num = Number(value);
  if (isNaN(num)) return 'Hubungi CS';
  if (num === 0) return 'Gratis';
  return `Rp ${num.toLocaleString('id-ID')}`;
}

// Fungsi gambar: langsung pakai URL jika ada, fallback ke placeholder
function getImageUrl(url) {
  if (url && typeof url === 'string' && url.trim().length > 0) {
    return url;
  }
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"%3E%3Crect width="300" height="300" fill="%23f3f4f6"/%3E%3Ctext x="150" y="150" font-family="sans-serif" font-size="18" fill="%239ca3af" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
}

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Memuat...</p>';
  const { data, error } = await supabase.from('ProdukKatalog').select('*');
  if (error) {
    grid.innerHTML = `<p style="color:red;">Gagal: ${error.message}</p>`;
    return;
  }
  if (!data || data.length === 0) {
    grid.innerHTML = '<p>Tidak ada produk.</p>';
    return;
  }
  products = data;
  renderProducts(products);
  populateCategories(products);
}

function renderProducts(data) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    const nama = item.nama || 'Tanpa Nama';
    const harga = item.harga;
    const imgSrc = getImageUrl(item.image_url); // <-- kolom image_url

    card.innerHTML = `
      <img src="${imgSrc}" alt="${nama}" loading="lazy" 
           onerror="this.onerror=null;this.src='${getImageUrl()}';">
      <h4>${nama}</h4>
      <div class="price-tag">${formatHarga(harga)}</div>
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
  document.getElementById('modalPrice').textContent = formatHarga(item.harga);
  const message = `Halo, saya tertarik produk "${item.nama}"`;
  document.getElementById('modalChatBtn').href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  document.getElementById('productModal').classList.remove('hidden');

  // Rekomendasi
  const keywords = (item.nama || '').split(' ').filter(k => k.length > 1);
  const related = products
    .filter(p => p.id !== item.id && keywords.some(k => p.nama?.includes(k)))
    .slice(0, 4);
  const container = document.getElementById('relatedProducts');
  container.innerHTML = '<p style="grid-column:1/-1;font-weight:bold;">🔍 Produk Serupa</p>';
  if (related.length === 0) {
    container.innerHTML += '<p style="grid-column:1/-1;color:#999;">Tidak ada.</p>';
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

document.querySelector('.close-btn').addEventListener('click', () => {
  document.getElementById('productModal').classList.add('hidden');
});
window.addEventListener('click', (e) => {
  if (e.target === document.getElementById('productModal')) {
    document.getElementById('productModal').classList.add('hidden');
  }
});

loadProducts();