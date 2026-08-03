const API_URL = 'https://sheetdb.io/api/v1/84vr5ataax542';
let products = [];
let filterCache = 'Semua';

function formatRupiah(angka) {
    if (!angka) return '0';
    return new Intl.NumberFormat('id-ID').format(Number(angka));
}

async function checkAndUpdate() {
    try {
        const res = await fetch(API_URL);
        const newData = await res.json();

        if (JSON.stringify(products) !== JSON.stringify(newData)) {
            products = newData;
            
            if(filterCache === 'Semua') {
                renderProducts(products);
            } else {
                renderProducts(products.filter(p => p.kategori === filterCache));
            }
            populateCategories(products);
            console.log("Data toko berhasil diperbarui!");
        } else {
            console.log("Tidak ada perubahan harga/barang.");
        }
    } catch (e) { 
        console.log("Gagal ambil data dari Google Sheets (cek internet)."); 
    }
}

function renderProducts(data) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        let badge = '';
//---naik turun harga--
        if(item.harga_sebelumnya && item.tanggal_perubahan) {
            const selisih = Number(item.harga) - Number(item.harga_sebelumnya);
            if(selisih > 0) {
                badge = `<div class="badge badge-naik">⬆ Naik Rp ${formatRupiah(selisih)} (${item.tanggal_perubahan})</div>`;
            } else if (selisih < 0) {
                badge = `<div class="badge badge-turun">⬇ Turun Rp ${formatRupiah(Math.abs(selisih))} (${item.tanggal_perubahan})</div>`;
            }
        }

        // --- PERBAIKAN TAMPILAN HARGA DI KARTU PRODUK ---
        card.innerHTML = `
            <img src="${item.foto}" alt="${item.nama}" onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'">
            <h4>${item.nama}</h4>
            <div class="price-tag">Rp ${formatRupiah(item.harga)}</div>
            ${badge}
        `;
        card.onclick = () => openModal(item);
        grid.appendChild(card);
    });
}

// Search & Kategori
document.getElementById('searchInput').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = products.filter(p => p.nama.toLowerCase().includes(val));
    renderProducts(filtered);
});

function populateCategories(data) {
    const cont = document.getElementById('categoryFilters');
    cont.innerHTML = '';
    const cats = ['Semua', ...new Set(data.map(p => p.kategori).filter(Boolean))];
    cats.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (c===filterCache ? ' active' : '');
        btn.innerText = c;
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterCache = c;
            if(c==='Semua') renderProducts(products);
            else renderProducts(products.filter(p => p.kategori === c));
        }
        cont.appendChild(btn);
    });
}

// Modal Detail & Saran
function openModal(item) {
    const m = document.getElementById('productModal');
    m.classList.remove('hidden');
    document.getElementById('modalImage').src = item.foto;
    document.getElementById('modalTitle').innerText = item.nama;
    
    // --- PERBAIKAN HARGA DI DALAM POP UP DETAIL ---
    document.getElementById('modalPrice').innerText = 'Rp ' + formatRupiah(item.harga);

    const keywords = item.nama.split(' ');
    const related = products.filter(p => 
        p.nama !== item.nama && keywords.some(k => p.nama.toLowerCase().includes(k.toLowerCase()))
    ).slice(0, 4);

    const rCont = document.getElementById('relatedProducts');
    rCont.innerHTML = '<p style="grid-column: span 2;">Rekomendasi Barang Mirip:</p>';
    related.forEach(p => {
        const rCard = document.createElement('div');
        rCard.className = 'related-item';
        // --- PERBAIKAN HARGA DI SARAN BARANG ---
        rCard.innerHTML = `<img src="${p.foto}" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'"><p>${p.nama}</p><small>Rp ${formatRupiah(p.harga)}</small>`;
        rCard.onclick = () => { m.classList.add('hidden'); openModal(p); };
        rCont.appendChild(rCard);
    });
}

// Close Modal
document.querySelector('.close-btn').onclick = () => document.getElementById('productModal').classList.add('hidden');
window.onclick = (e) => { if(e.target == document.getElementById('productModal')) e.target.classList.add('hidden'); }

// JALANKAN WEBSITE
checkAndUpdate();
setInterval(checkAndUpdate, 300000);