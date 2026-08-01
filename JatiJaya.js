const API_URL = 'https://sheetdb.io/api/v1/84vr5ataax542'; // GANTI DENGAN LINK SHEETDB ANDA
let products = [];
let filterCache = 'Semua'; // Untuk mengingat filter kategori terakhir

async function checkAndUpdate() {
    try {
        const res = await fetch(API_URL);
        const newData = await res.json();

        // Cek pintar: Apakah ada perubahan data?
        // Jika tidak ada perubahan, kita TIDAK merender ulang (agar layar pelanggan tidak loncat ke atas)
        if (JSON.stringify(products) !== JSON.stringify(newData)) {
            products = newData;
            
            // Terapkan filter yang sedang dipilih sebelumnya
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
        if(item.harga_sebelumnya && item.tanggal_perubahan) {
            if(Number(item.harga) > Number(item.harga_sebelumnya)) {
                badge = `<div class="badge badge-naik">⬆ Naik Rp ${Number(item.harga)-Number(item.harga_sebelumnya)} (${item.tanggal_perubahan})</div>`;
            } else if (Number(item.harga) < Number(item.harga_sebelumnya)) {
                badge = `<div class="badge badge-turun">⬇ Turun Rp ${Number(item.harga_sebelumnya)-Number(item.harga)} (${item.tanggal_perubahan})</div>`;
            }
        }
        card.innerHTML = `
            <img src="${item.foto}" alt="${item.nama}" onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'">
            <h4>${item.nama}</h4>
            <div class="price-tag">HARGA: Rp ${item.harga}</div>
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
    cont.innerHTML = ''; // PERBAIKAN: Hapus tombol lama agar tidak numpuk
    const cats = ['Semua', ...new Set(data.map(p => p.kategori).filter(Boolean))];
    cats.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (c===filterCache ? ' active' : '');
        btn.innerText = c;
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterCache = c; // Simpan filter yang dipilih
            if(c==='Semua') renderProducts(products);
            else renderProducts(products.filter(p => p.kategori === c));
        }
        cont.appendChild(btn);
    });
}

// Modal Detail & Saran (mirip nama)
function openModal(item) {
    const m = document.getElementById('productModal');
    m.classList.remove('hidden');
    document.getElementById('modalImage').src = item.foto;
    document.getElementById('modalTitle').innerText = item.nama;
    document.getElementById('modalPrice').innerText = 'Rp ' + item.harga;

    // Cari barang terkait (berdasarkan kemiripan nama)
    const keywords = item.nama.split(' ');
    const related = products.filter(p => 
        p.nama !== item.nama && keywords.some(k => p.nama.toLowerCase().includes(k.toLowerCase()))
    ).slice(0, 4); // max 4 barang

    const rCont = document.getElementById('relatedProducts');
    rCont.innerHTML = '<p style="grid-column: span 2;">Rekomendasi Barang Mirip:</p>';
    related.forEach(p => {
        const rCard = document.createElement('div');
        rCard.className = 'related-item';
        rCard.innerHTML = `<img src="${p.foto}" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'"><p>${p.nama}</p><small>Rp ${p.harga}</small>`;
        rCard.onclick = () => { m.classList.add('hidden'); openModal(p); };
        rCont.appendChild(rCard);
    });
}

// Close Modal
document.querySelector('.close-btn').onclick = () => document.getElementById('productModal').classList.add('hidden');
window.onclick = (e) => { if(e.target == document.getElementById('productModal')) e.target.classList.add('hidden'); }

// JALANKAN WEBSITE
checkAndUpdate(); // Ambil data pertama kali
// AUTO REFRESH: 300.000 milidetik = 5 menit.
// (Jika ingin 10 menit, ganti 300000 menjadi 600000)
setInterval(checkAndUpdate, 300000);