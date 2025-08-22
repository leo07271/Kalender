document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. HTML Elemanlarını Seçelim ---
    const ayarlarButonu = document.getElementById('ayarlarButonu');
    const ayarlarPaneli = document.getElementById('ayarlarPaneli');
    const kapatmaButonu = document.getElementById('kapatmaButonu');
    const ayarSekmeleri = document.querySelectorAll('.ayar-sekme');
    const ayarIcerikleri = document.querySelectorAll('.ayar-icerik');
    const renkKutulari = document.querySelectorAll('.renk-kutusu');
    const modDegistirButonu = document.getElementById('modDegistirButonu');
    const varsayilanTemaButonu = document.getElementById('varsayilanTemaButonu');
    const dilButonlari = document.querySelectorAll('.dil-butonu');
    const notKategorisiSelect = document.getElementById('notKategorisi');
    const yeniNotButonu = document.getElementById('yeniNotButonu');
    const kategoriSilButonu = document.getElementById('kategoriSilButonu');
    const notKaydetButonu = document.getElementById('notKaydetButonu');
    const musteriAdiInput = document.getElementById('musteriAdi');
    const randevuUcretiInput = document.getElementById('randevuUcreti');
    const randevuTarihiInput = document.getElementById('randevuTarihi');
    const randevuSaatiInput = document.getElementById('randevuSaati');
    const ekleButonu = document.getElementById('ekleButonu');
    const randevuListesiDiv = document.getElementById('randevuListesi');
    const aylikToplamMiktarSpan = document.getElementById('aylikToplamMiktar');
    const toplamCiroBaslik = document.getElementById('toplamCiroBaslik');
    const aySecimi = document.getElementById('aySecimi');
    const yilSecimi = document.getElementById('yilSecimi');
    const canliSaatDiv = document.getElementById('canliSaat');
    const canliTarihDiv = document.getElementById('canliTarih');

    // --- 2. Veri Yönetimi ---
    let randevular = JSON.parse(localStorage.getItem('randevular')) || [];
    let notlar = JSON.parse(localStorage.getItem('notlar')) || {};
    let temaRengi = localStorage.getItem('temaRengi') || '#007bff';
    let gorunumModu = localStorage.getItem('gorunumModu') || 'light-mode';
    let dil = localStorage.getItem('dil') || 'tr';
    let dilVerisi = {};

    function verileriKaydet() { localStorage.setItem('randevular', JSON.stringify(randevular)); }
    function notlariKaydet() { localStorage.setItem('notlar', JSON.stringify(notlar)); }
    function ayarlariKaydet() { localStorage.setItem('temaRengi', temaRengi); localStorage.setItem('gorunumModu', gorunumModu); localStorage.setItem('dil', dil); }

    // --- 3. Dil Yönetimi ---
    async function dilDosyasiniYukle(dilKodu) {
        try {
            const response = await fetch(`./langs/${dilKodu}.json`);
            if (!response.ok) throw new Error('Dil dosyası bulunamadı!');
            dilVerisi = await response.json();
        } catch (error) {
            console.error('Dil yüklenemedi, varsayılan (Türkçe) yükleniyor:', error);
            const response = await fetch(`./langs/tr.json`);
            dilVerisi = await response.json();
        }
    }

    function arayuzuCevir() {
        document.querySelectorAll('[data-lang]').forEach(element => {
            const key = element.dataset.lang;
            if (dilVerisi[key]) element.innerText = dilVerisi[key];
        });
        document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
            const key = element.dataset.langPlaceholder;
            if (dilVerisi[key]) element.placeholder = dilVerisi[key];
        });
        document.documentElement.lang = dil;
    }

    async function diliDegistir(yeniDil) {
        const eskiVarsayilanKategori = dilVerisi.genel_notlar_kategori;
        
        dil = yeniDil;
        await dilDosyasiniYukle(dil);

        const yeniVarsayilanKategori = dilVerisi.genel_notlar_kategori;

        // Notlar objesindeki eski varsayılan kategori adını yenisiyle güncelle
        if (notlar[eskiVarsayilanKategori] && eskiVarsayilanKategori !== yeniVarsayilanKategori) {
            // İçeriği kopyala
            notlar[yeniVarsayilanKategori] = notlar[eskiVarsayilanKategori];
            // Eskisini sil
            delete notlar[eskiVarsayilanKategori];
            notlariKaydet();
        }
        
        arayuzuCevir();
        filtreleriDoldur();
        randevulariGoster();
        kategorileriDoldur();
        ayarlariKaydet();
    }
    
    // --- 4. Quill.js Editörünü Başlatma ---
    const quill = new Quill('#editor', {
        modules: { toolbar: [
            [{ 'header': [1, 2, false] }], ['bold', 'italic', 'underline'], [{'list': 'ordered'}, {'list': 'bullet'}],
            ['link', 'blockquote'], [{'color': []}, {'background': []}], ['clean']
        ]}, theme: 'snow'
    });

    // --- 5. Arayüz Fonksiyonları ---
    function filtreleriDoldur() {
        const aylarLocale = {
            tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
            en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
        };
        const aylar = aylarLocale[dil] || aylarLocale['tr'];
        const mevcutYillar = [...new Set(randevular.map(r => new Date(r.tarih).getFullYear()))].sort((a,b) => b-a);
        aySecimi.innerHTML = `<option value="tumu">${dilVerisi.tum_randevular}</option>`;
        aylar.forEach((ay, index) => aySecimi.innerHTML += `<option value="${index}">${ay}</option>`);
        yilSecimi.innerHTML = '';
        mevcutYillar.forEach(yil => yilSecimi.innerHTML += `<option value="${yil}">${yil}</option>`);
        if(mevcutYillar.length === 0) yilSecimi.innerHTML = `<option value="${new Date().getFullYear()}">${new Date().getFullYear()}</option>`;
    }

    function randevulariGoster() {
        const secilenAy = aySecimi.value;
        const secilenYil = parseInt(yilSecimi.value);
        randevuListesiDiv.innerHTML = '';
        const filtrelenmisRandevular = randevular.filter(r => new Date(r.tarih).getFullYear() === secilenYil && (secilenAy === 'tumu' || new Date(r.tarih).getMonth() == secilenAy));
        const siraliRandevular = filtrelenmisRandevular.sort((a, b) => new Date(`${a.tarih}T${a.saat}`) - new Date(`${b.tarih}T${b.saat}`));
        if (siraliRandevular.length === 0) randevuListesiDiv.innerHTML = `<p>${dilVerisi.randevu_yok}</p>`;
        else siraliRandevular.forEach(randevu => {
            const kart = document.createElement('div');
            kart.className = 'randevu-karti';
            const tarihObjesi = new Date(`${randevu.tarih}T00:00:00`);
            const formatliTarih = tarihObjesi.toLocaleDateString(dil, { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
            kart.innerHTML = `<div class="randevu-ucreti">€${randevu.ucret}</div> <div class="randevu-bilgisi"><p class="isim">${randevu.isim}</p><p class="zaman">${formatliTarih} - ${randevu.saat}</p></div> <button class="sil-butonu" data-id="${randevu.id}"><span class="material-symbols-outlined">delete</span></button>`;
            randevuListesiDiv.appendChild(kart);
        });
        ciroyuHesapla();
    }

    function ciroyuHesapla() {
        const secilenAy = aySecimi.value;
        const secilenYil = parseInt(yilSecimi.value);
        let toplam = 0;
        const filtrelenmisRandevular = randevular.filter(r => new Date(r.tarih).getFullYear() === secilenYil && (secilenAy === 'tumu' || new Date(r.tarih).getMonth() == secilenAy));
        filtrelenmisRandevular.forEach(randevu => { toplam += parseFloat(randevu.ucret) || 0; });
        if (secilenAy === 'tumu') toplamCiroBaslik.innerText = `${secilenYil} ${dilVerisi.toplam_ciro_yil}`;
        else toplamCiroBaslik.innerText = `${aySecimi.options[aySecimi.selectedIndex].text} ${dilVerisi.toplam_ciro_ay}`;
        aylikToplamMiktarSpan.innerText = `€${toplam.toFixed(2)}`;
    }

    function temaGuncelle() {
        document.documentElement.style.setProperty('--ana-renk', temaRengi); document.body.className = gorunumModu;
        const ikon = modDegistirButonu.querySelector('span.material-symbols-outlined');
        const metinSpan = modDegistirButonu.querySelector('span[data-lang]');
        if (gorunumModu === 'dark-mode') {
            ikon.innerText = 'light_mode';
            metinSpan.dataset.lang = 'aydinlik_moda_gec';
        } else {
            ikon.innerText = 'dark_mode';
            metinSpan.dataset.lang = 'karanlik_moda_gec';
        }
        arayuzuCevir();
    }
    
    function kategorileriDoldur() {
        const seciliDeger = notKategorisiSelect.value;
        notKategorisiSelect.innerHTML = '';
        let kategoriler = Object.keys(notlar);
        const varsayilanKategoriAdi = dilVerisi.genel_notlar_kategori;
        if (kategoriler.length === 0) {
            notlar[varsayilanKategoriAdi] = { content: '' };
            notlariKaydet();
            kategoriler = [varsayilanKategoriAdi];
        }
        kategoriler.forEach(kategori => {
            const option = document.createElement('option');
            option.value = kategori;
            option.innerText = kategori;
            notKategorisiSelect.appendChild(option);
        });
        notKategorisiSelect.value = seciliDeger && notlar[seciliDeger] ? seciliDeger : varsayilanKategoriAdi;
        notuYukle();
    }
    function notuYukle() { const seciliKategori = notKategorisiSelect.value; if (seciliKategori && notlar[seciliKategori] && notlar[seciliKategori].content) quill.setContents(notlar[seciliKategori].content); else quill.setText(''); }
    function notuKaydet() { const seciliKategori = notKategorisiSelect.value; if (seciliKategori) { notlar[seciliKategori] = { content: quill.getContents() }; notlariKaydet(); alert(dilVerisi.bilgi_not_kaydedildi); } else alert(dilVerisi.kategori_secili_degil); }
    function yeniNotKategorisi() { const yeniKategoriAdi = prompt(dilVerisi.yeni_kategori_adi_sor); if (yeniKategoriAdi && yeniKategoriAdi.trim() !== "") { if (!notlar[yeniKategoriAdi]) { notlar[yeniKategoriAdi] = { content: '' }; notlariKaydet(); kategorileriDoldur(); notKategorisiSelect.value = yeniKategoriAdi; notuYukle(); } else alert(dilVerisi.uyari_kategori_zaten_var); } }
    function kategoriSil() { const seciliKategori = notKategorisiSelect.value; const varsayilanKategoriAdi = dilVerisi.genel_notlar_kategori; if (seciliKategori === varsayilanKategoriAdi) { alert(dilVerisi.uyari_son_kategori_silinemez); return; } if (confirm(dilVerisi.onay_kategori_sil.replace('{kategori}', seciliKategori))) { delete notlar[seciliKategori]; notlariKaydet(); kategorileriDoldur(); } }
    
    function guncelZamaniGoster() {
        const simdi = new Date();
        canliSaatDiv.innerText = simdi.toLocaleTimeString('tr-TR');
        canliTarihDiv.innerText = simdi.toLocaleDateString(dil, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    // --- 6. Olay Yönetimi ---
    function randevuEkle() {
        const yeniRandevu = { id: Date.now(), isim: musteriAdiInput.value.trim(), ucret: randevuUcretiInput.value, tarih: randevuTarihiInput.value, saat: randevuSaatiInput.value };
        if (!yeniRandevu.isim || !yeniRandevu.ucret || !yeniRandevu.tarih || !yeniRandevu.saat) { alert(dilVerisi.uyari_tum_alanlari_doldurun); return; }
        randevular.push(yeniRandevu); verileriKaydet(); filtreleriDoldur(); randevulariGoster();
        musteriAdiInput.value = ''; randevuUcretiInput.value = ''; randevuTarihiInput.value = ''; randevuSaatiInput.value = '';
    }
    function randevuSil(randevuId) { if (confirm(dilVerisi.onay_randevu_sil)) { randevular = randevular.filter(r => r.id !== randevuId); verileriKaydet(); filtreleriDoldur(); randevulariGoster(); } }

    // --- Olay Dinleyicileri ---
    ayarlarButonu.addEventListener('click', () => ayarlarPaneli.classList.add('acik'));
    kapatmaButonu.addEventListener('click', () => ayarlarPaneli.classList.remove('acik'));
    ayarSekmeleri.forEach(sekme => { sekme.addEventListener('click', () => { ayarSekmeleri.forEach(s => s.classList.remove('aktif')); ayarIcerikleri.forEach(i => i.classList.remove('aktif')); sekme.classList.add('aktif'); document.getElementById(sekme.dataset.sekme).classList.add('aktif'); }); });
    renkKutulari.forEach(kutu => { kutu.addEventListener('click', () => { temaRengi = kutu.dataset.renk; temaGuncelle(); ayarlariKaydet(); }); });
    modDegistirButonu.addEventListener('click', () => { gorunumModu = gorunumModu === 'light-mode' ? 'dark-mode' : 'light-mode'; temaGuncelle(); ayarlariKaydet(); });
    varsayilanTemaButonu.addEventListener('click', () => { temaRengi = '#007bff'; gorunumModu = 'light-mode'; temaGuncelle(); ayarlariKaydet(); });
    dilButonlari.forEach(buton => { buton.addEventListener('click', () => diliDegistir(buton.dataset.dil)); });
    ekleButonu.addEventListener('click', randevuEkle);
    randevuListesiDiv.addEventListener('click', (olay) => { const silButonu = olay.target.closest('.sil-butonu'); if (silButonu) { const randevuId = parseInt(silButonu.dataset.id, 10); randevuSil(randevuId); } });
    aySecimi.addEventListener('change', randevulariGoster);
    yilSecimi.addEventListener('change', randevulariGoster);
    notKategorisiSelect.addEventListener('change', notuYukle);
    yeniNotButonu.addEventListener('click', yeniNotKategorisi);
    notKaydetButonu.addEventListener('click', notuKaydet);
    kategoriSilButonu.addEventListener('click', kategoriSil);

    // --- 7. Başlangıç ---
    async function baslat() {
        await dilDosyasiniYukle(dil);
        temaGuncelle();
        filtreleriDoldur();
        randevulariGoster();
        kategorileriDoldur();
        setInterval(guncelZamaniGoster, 1000);
        guncelZamaniGoster();
    }
    baslat();
});