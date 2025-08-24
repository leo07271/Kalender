document.addEventListener('DOMContentLoaded', async () => {
  // --- Elemanlar
  const formBasligi = document.getElementById('formBasligi');
  const ekleButonuIkon = document.getElementById('ekleButonuIkon');
  const ekleButonuMetin = document.getElementById('ekleButonuMetin');

  const ayarlarButonu = document.getElementById('ayarlarButonu');
  const ayarlarPaneli = document.getElementById('ayarlarPaneli');
  const ayarlarKatmani = document.getElementById('ayarlarKatmani');
  const kapatmaButonu = document.getElementById('kapatmaButonu');

  const ayarSekmeleri = document.querySelectorAll('.ayar-sekme');
  const ayarIcerikleri = document.querySelectorAll('.ayar-icerik');

  const renkKapsulleri = document.querySelectorAll('.renk-kapsul');
  const modToggle = document.getElementById('modToggle');
  const varsayilanTemaButonu = document.getElementById('varsayilanTemaButonu');
  const dilButonlari = document.querySelectorAll('.dil-butonu');

  const notKategorisiSelect = document.getElementById('notKategorisi');
  const yeniNotButonu = document.getElementById('yeniNotButonu');
  const kategoriSilButonu = document.getElementById('kategoriSilButonu');
  const notKaydetButonu = document.getElementById('notKaydetButonu');

  const hizliArama = document.getElementById('hizliArama');
  const musteriAdiInput = document.getElementById('musteriAdi');
  const randevuBaslikInput = document.getElementById('randevuBaslik');
  const randevuUcretiInput = document.getElementById('randevuUcreti');
  const randevuIndirimInput = document.getElementById('randevuIndirim');
  const randevuTarihiInput = document.getElementById('randevuTarihi');
  const randevuSaatiSaatSelect = document.getElementById('randevuSaatiSaat');
  const randevuSaatiDakikaSelect = document.getElementById('randevuSaatiDakika');

  const bugunButonu = document.getElementById('bugunButonu');
  const yazdirButonu = document.getElementById('yazdirButonu');

  const ekleButonu = document.getElementById('ekleButonu');
  const randevuListesiDiv = document.getElementById('randevuListesi');
  const aylikToplamMiktarSpan = document.getElementById('aylikToplamMiktar');
  const toplamCiroBaslik = document.getElementById('toplamCiroBaslik');
  const aySecimi = document.getElementById('aySecimi');
  const yilSecimi = document.getElementById('yilSecimi');
  const ciroTuru = document.getElementById('ciroTuru');
  const paraBirimiSelect = document.getElementById('paraBirimi');

  const secHepsini = document.getElementById('secHepsini');
  const secKaldir = document.getElementById('secKaldir');
  const topluOdendi = document.getElementById('topluOdendi');
  const topluSil = document.getElementById('topluSil');

  const canliSaatDiv = document.getElementById('canliSaat');
  const canliTarihDiv = document.getElementById('canliTarih');

  // Alt bar
  const altYeni = document.getElementById('altYeni');
  theAltBugun = document.getElementById('altBugun');
  const altAyarlar = document.getElementById('altAyarlar');

  const toastKutusu = document.getElementById('toastKutusu');

  // --- Veriler
  let randevular = JSON.parse(localStorage.getItem('randevular')) || [];
  let notlar = JSON.parse(localStorage.getItem('notlar')) || {};
  let temaRengi = localStorage.getItem('temaRengi') || '#3b82f6';
  let gorunumModu = localStorage.getItem('gorunumModu') || autoMode();
  let dil = localStorage.getItem('dil') || 'tr';
  let dilVerisi = {};
  let paraBirimi = localStorage.getItem('paraBirimi') || 'EUR';

  let duzenlemeModu = false;
  let duzenlenecekRandevuId = null;

  // --- Yardımcılar
  const NF_LOCALE = { tr:'tr-TR', en:'en-GB', de:'de-DE' };
  function fmtCurrency(value){
    const loc = NF_LOCALE[dil] || 'tr-TR';
    return new Intl.NumberFormat(loc,{style:'currency',currency:paraBirimi}).format(Number(value||0));
  }
  function parseLocalYMD(ymd){ const [Y,M,D]=(ymd||'').split('-').map(Number); return new Date(Y||1970,(M||1)-1,D||1); }
  function isSameDate(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function toLocalDateTime(ymd,hm){ const [Y,M,D]=(ymd||'').split('-').map(Number); const [h,m]=(hm||'00:00').split(':').map(Number); return new Date(Y||1970,(M||1)-1,D||1,h||0,m||0,0,0); }
  function debounce(fn,ms){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args),ms); }; }
  function initials(name){ const parts=(name||'').trim().split(/\s+/).slice(0,2); return parts.map(p=>p[0]?.toUpperCase()||'').join(''); }
  function autoMode(){ return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-mode' : 'light-mode'; }
  const vibrate = ms => (navigator.vibrate ? navigator.vibrate(ms) : null);

  // --- Kütüphaneler
  const quill = new Quill('#editor', {
    modules:{ toolbar:[[{header:[1,2,false]}],['bold','italic','underline'],[{list:'ordered'},{list:'bullet'}],['link','blockquote'],[{color:[]},{background:[]}],['clean']]},
    theme:'snow'
  });
  const datepicker = new Datepicker(randevuTarihiInput, { format:'yyyy-mm-dd', autohide:true, language:'tr', todayHighlight:true });

  // --- Dil
  async function dilDosyasiniYukle(kod){
    try{
      const r = await fetch(`./langs/${kod}.json`);
      if(!r.ok) throw 0;
      dilVerisi = await r.json();
    }catch{
      try{ const r2 = await fetch('./langs/tr.json'); dilVerisi = await r2.json(); }
      catch{ dilVerisi = {}; }
    }
  }
  function arayuzuCevir(){
    document.querySelectorAll('[data-lang]').forEach(el=>{
      const key = el.dataset.lang;
      if(dilVerisi[key]) el.textContent = dilVerisi[key];
    });
    document.querySelectorAll('[data-lang-placeholder]').forEach(el=>{
      const key = el.dataset.langPlaceholder;
      if(dilVerisi[key]) el.placeholder = dilVerisi[key];
    });
    document.documentElement.lang = dil;
  }
  async function diliDegistir(yeni){
    const eskiDef = dilVerisi.genel_notlar_kategori;
    dil = yeni; await dilDosyasiniYukle(dil);
    const yeniDef = dilVerisi.genel_notlar_kategori;
    if(eskiDef && yeniDef && notlar[eskiDef] && eskiDef!==yeniDef){ notlar[yeniDef]=notlar[eskiDef]; delete notlar[eskiDef]; notlariKaydet(); }
    const kodlar = { tr:'tr', en:'en-GB', de:'de' }; datepicker.setOptions({ language: kodlar[dil] || 'tr' });
    arayuzuCevir(); filtreleriDoldur(); randevulariGoster(); kategorileriDoldur(); ayarlariKaydet();
  }

  // --- UI doldur
  function saatiDoldur(){
    randevuSaatiSaatSelect.innerHTML=''; randevuSaatiDakikaSelect.innerHTML='';
    for(let i=0;i<24;i++){ const s=String(i).padStart(2,'0'); randevuSaatiSaatSelect.insertAdjacentHTML('beforeend',`<option value="${s}">${s}</option>`); }
    for(let i=0;i<60;i+=5){ const m=String(i).padStart(2,'0'); randevuSaatiDakikaSelect.insertAdjacentHTML('beforeend',`<option value="${m}">${m}</option>`); }
  }
  function filtreleriDoldur(){
    const aylarLocale={ tr:["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"],
                        en:["January","February","March","April","May","June","July","August","September","October","November","December"],
                        de:["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"] };
    const aylar = aylarLocale[dil] || aylarLocale.tr;
    const years = [...new Set(randevular.map(r=>parseLocalYMD(r.tarih).getFullYear()))].sort((a,b)=>b-a);

    aySecimi.innerHTML = `<option value="tumu">${dilVerisi.tum_randevular || 'Tüm Randevular'}</option>`;
    aylar.forEach((ay,i)=> aySecimi.insertAdjacentHTML('beforeend',`<option value="${i}">${ay}</option>`));

    yilSecimi.innerHTML='';
    if(years.length===0){ const y=new Date().getFullYear(); yilSecimi.insertAdjacentHTML('beforeend',`<option value="${y}">${y}</option>`); }
    else years.forEach(y=> yilSecimi.insertAdjacentHTML('beforeend',`<option value="${y}">${y}</option>`));

    paraBirimiSelect.value = paraBirimi;
  }

  // --- Toast
  function toast(msg, tip){
    const d=document.createElement('div');
    d.className='toast'+(tip==='hata'?' hata':'');
    d.textContent=msg;
    toastKutusu.appendChild(d);
    setTimeout(()=>{ d.style.opacity='0'; d.style.transform='translate(-50%, 8px)'; }, 2200);
    setTimeout(()=>{ d.remove(); }, 2700);
  }

  // --- Kart HTML
  function randevuKartHTML(r){
    const tarihStr = parseLocalYMD(r.tarih).toLocaleDateString(dil,{day:'numeric',month:'short',year:'numeric',weekday:'short'});
    const badge = r.odendi ? `<span class="badge paid">${dilVerisi.odendi || 'ÖDENDİ'}</span>` : `<span class="badge unpaid">${dilVerisi.beklemede || 'BEKLEMEDE'}</span>`;
    return `
      <input class="kart-checkbox" type="checkbox" data-id="${r.id}"/>
      <div class="avatar">${initials(r.isim)}</div>
      <div class="randevu-ucreti">${fmtCurrency((parseFloat(r.ucret)||0)-(parseFloat(r.indirim)||0))}</div>
      <div class="randevu-bilgisi">
        <p class="isim">${r.isim} ${badge}</p>
        <p class="zaman">${tarihStr} • ${r.saat}</p>
        <p class="baslik">${r.baslik||''}</p>
      </div>
      <div class="aksiyonlar">
        <button class="kucuk-btn ics-btn" title="ICS"><span class="material-symbols-outlined">event</span></button>
        <button class="kucuk-btn duzenle-butonu" title="Edit"><span class="material-symbols-outlined">edit</span></button>
        <button class="kucuk-btn odeme-toggle" title="Paid"><span class="material-symbols-outlined">done</span></button>
        <button class="kucuk-btn sil-butonu" title="Delete"><span class="material-symbols-outlined">delete</span></button>
      </div>
    `;
  }

  // --- Listeleme
  function randevulariGoster(){
    const secilenAy = aySecimi.value;
    const secilenYil = parseInt(yilSecimi.value || String(new Date().getFullYear()),10);
    const q = (hizliArama.value||'').toLowerCase().trim();

    randevuListesiDiv.innerHTML='';
    const filtrelenmis = randevular.filter(r=>{
      const d=parseLocalYMD(r.tarih);
      const ayOK = (d.getFullYear()===secilenYil) && (secilenAy==='tumu' || d.getMonth()==secilenAy);
      const text = `${r.isim||''} ${r.baslik||''}`.toLowerCase();
      const aramaOK = q ? text.includes(q) : true;
      return ayOK && aramaOK;
    });
    const sirali = filtrelenmis.sort((a,b)=> toLocalDateTime(a.tarih,a.saat) - toLocalDateTime(b.tarih,b.saat) );

    const simdi=new Date();
    const bugun=new Date(simdi.getFullYear(),simdi.getMonth(),simdi.getDate());

    if(sirali.length===0){
      randevuListesiDiv.innerHTML=`<p>${dilVerisi.randevu_yok || 'Randevu bulunmuyor.'}</p>`;
    }else{
      sirali.forEach(r=>{
        const kart=document.createElement('div');
        kart.className='randevu-karti';
        kart.setAttribute('data-id', r.id);
        const d=parseLocalYMD(r.tarih), dt=toLocalDateTime(r.tarih,r.saat);
        if(isSameDate(d,bugun) && dt>simdi) kart.classList.add('bugun');

        kart.innerHTML=randevuKartHTML(r);
        kart.querySelector('.duzenle-butonu').addEventListener('click',()=> formuDuzenlemeModunaAl(r.id));
        kart.querySelector('.sil-butonu').addEventListener('click',()=> { randevuSil(r.id); });
        kart.querySelector('.odeme-toggle').addEventListener('click',()=>{ r.odendi=!r.odendi; verileriKaydet(); randevulariGoster(); toast(r.odendi?(dilVerisi.toast_odendi||'Ödendi işaretlendi'):(dilVerisi.toast_beklemede||'Beklemeye alındı')); vibrate(10); });
        kart.querySelector('.ics-btn').addEventListener('click', ()=> indirICS(r));
        ekleSwipeDavranis(kart, r.id);
        randevuListesiDiv.appendChild(kart);
      });
    }
    ciroyuHesapla();
  }

  // --- Ciro
  function ciroyuHesapla(){
    const secilenAy=aySecimi.value;
    const secilenYil=parseInt(yilSecimi.value || String(new Date().getFullYear()),10);
    const kayitlar=randevular.filter(r=>{
      const d=parseLocalYMD(r.tarih);
      return d.getFullYear()===secilenYil && (secilenAy==='tumu'||d.getMonth()==secilenAy);
    });
    const filtre=ciroTuru?.value || 'all';
    const list = kayitlar.filter(r=> filtre==='all' ? true : !!r.odendi);
    const toplam = list.reduce((s,r)=> s + ((parseFloat(r.ucret)||0) - (parseFloat(r.indirim)||0)), 0);

    if(secilenAy==='tumu') toplamCiroBaslik.innerText=`${secilenYil} ${dilVerisi.toplam_ciro_yil || 'Toplam Ciro'}`;
    else toplamCiroBaslik.innerText=`${aySecimi.options[aySecimi.selectedIndex]?.text || ''} ${dilVerisi.toplam_ciro_ay || 'Toplam Ciro'}`;

    aylikToplamMiktarSpan.innerText = fmtCurrency(toplam.toFixed(2));
  }

  // --- Notlar
  function kategorileriDoldur(){
    const secili = notKategorisiSelect.value;
    notKategorisiSelect.innerHTML='';
    let kategoriler=Object.keys(notlar);
    const varsayilan = dilVerisi.genel_notlar_kategori || 'Genel';
    if(kategoriler.length===0){ notlar[varsayilan]={content:''}; notlariKaydet(); kategoriler=[varsayilan]; }
    kategoriler.forEach(k=> notKategorisiSelect.insertAdjacentHTML('beforeend',`<option value="${k}">${k}</option>`));
    notKategorisiSelect.value = (secili && notlar[secili]) ? secili : varsayilan;
    notuYukle();
  }
  function notuYukle(){ const k=notKategorisiSelect.value; if(k && notlar[k] && notlar[k].content) quill.setContents(notlar[k].content); else quill.setText(''); }
  function notuKaydet(){ const k=notKategorisiSelect.value; if(!k){ alert(dilVerisi.kategori_secili_degil || 'Lütfen bir kategori seçin.'); return; } notlar[k]={content:quill.getContents()}; notlariKaydet(); toast(dilVerisi.bilgi_not_kaydedildi || 'Not kaydedildi.'); vibrate(10); }
  function yeniNotKategorisi(){ const ad=prompt(dilVerisi.yeni_kategori_adi_sor || 'Yeni kategori adı?'); if(ad && ad.trim()!==''){ if(notlar[ad]){ alert(dilVerisi.uyari_kategori_zaten_var || 'Bu kategori zaten var.'); return; } notlar[ad]={content:''}; notlariKaydet(); kategorileriDoldur(); notKategorisiSelect.value=ad; notuYukle(); } }
  function kategoriSil(){ const k=notKategorisiSelect.value; const varsayilan = dilVerisi.genel_notlar_kategori || 'Genel'; if(k===varsayilan){ alert(dilVerisi.uyari_son_kategori_silinemez || 'Varsayılan kategori silinemez.'); return; } if(confirm((dilVerisi.onay_kategori_sil || "'{kategori}' kategorisi silinsin mi?").replace('{kategori}', k))){ delete notlar[k]; notlariKaydet(); kategorileriDoldur(); } }

  // --- CRUD Randevu
  function formuDuzenlemeModunaAl(id){
    const r=randevular.find(x=>x.id===id); if(!r) return;
    duzenlemeModu=true; duzenlenecekRandevuId=id;
    musteriAdiInput.value=r.isim||'';
    randevuBaslikInput.value=r.baslik||'';
    randevuUcretiInput.value=r.ucret||'';
    randevuIndirimInput.value=r.indirim||'';
    datepicker.setDate(r.tarih);
    const [s,d]=(r.saat||'00:00').split(':'); randevuSaatiSaatSelect.value=s||'00'; randevuSaatiDakikaSelect.value=d||'00';
    formBasligi.dataset.lang="randevu_duzenle"; ekleButonuIkon.innerText='save'; ekleButonuMetin.dataset.lang="degisiklikleri_kaydet";
    arayuzuCevir();
    window.scrollTo({top:0, behavior:'smooth'});
  }
  function formuTemizleVeSifirla(){
    duzenlemeModu=false; duzenlenecekRandevuId=null;
    musteriAdiInput.value=''; randevuBaslikInput.value=''; randevuUcretiInput.value=''; randevuIndirimInput.value='';
    datepicker.setDate({clear:true});
    randevuSaatiSaatSelect.selectedIndex=0; randevuSaatiDakikaSelect.selectedIndex=0;
    formBasligi.dataset.lang="yeni_randevu"; ekleButonuIkon.innerText='add'; ekleButonuMetin.dataset.lang="randevu_ekle_buton";
    arayuzuCevir();
  }
  function randevuKayitObj(){ 
    return {
      isim:musteriAdiInput.value.trim(),
      baslik:randevuBaslikInput.value.trim(),
      ucret:randevuUcretiInput.value,
      indirim:randevuIndirimInput.value,
      tarih:datepicker.getDate('yyyy-mm-dd'),
      saat:`${randevuSaatiSaatSelect.value}:${randevuSaatiDakikaSelect.value}`
    };
  }
  function alanKontrol(g){
    if(!g.isim || !g.ucret || !g.tarih || !g.saat){ toast(dilVerisi.uyari_tum_alanlari_doldurun || 'Lütfen tüm zorunlu alanları doldurun.', 'hata'); vibrate(25); return false; }
    return true;
  }
  function randevuEkle(){
    const g=randevuKayitObj(); if(!alanKontrol(g)) return;
    const yeni={ id:Date.now(), ...g, odendi:false };
    const cakisma=randevular.some(r=> r.isim.trim().toLowerCase()===yeni.isim.trim().toLowerCase() && r.tarih===yeni.tarih && r.saat===yeni.saat );
    if(cakisma){ toast(dilVerisi.uyari_cakisma || 'Aynı kişi için bu tarih ve saatte randevu var.', 'hata'); vibrate(25); return; }
    randevular.push(yeni); verileriKaydet(); filtreleriDoldur(); randevulariGoster(); formuTemizleVeSifirla(); toast(dilVerisi.toast_kaydedildi || 'Kaydedildi'); vibrate(10);
  }
  function randevuGuncelle(){
    const i=randevular.findIndex(r=>r.id===duzenlenecekRandevuId); if(i===-1) return;
    const g=randevuKayitObj(); if(!alanKontrol(g)) return;
    const cakisma=randevular.some((r,idx)=> idx!==i && r.isim.trim().toLowerCase()===g.isim.trim().toLowerCase() && r.tarih===g.tarih && r.saat===g.saat );
    if(cakisma){ toast(dilVerisi.uyari_cakisma || 'Aynı kişi için bu tarih ve saatte randevu var.', 'hata'); vibrate(25); return; }
    randevular[i]={...randevular[i], ...g}; verileriKaydet(); randevulariGoster(); formuTemizleVeSifirla(); toast(dilVerisi.toast_guncellendi || 'Güncellendi'); vibrate(10);
  }
  function randevuSil(id){
    if(confirm(dilVerisi.onay_randevu_sil || 'Randevu silinsin mi?')){
      randevular=randevular.filter(r=>r.id!==id); verileriKaydet(); filtreleriDoldur(); randevulariGoster(); toast(dilVerisi.toast_silindi || 'Silindi'); vibrate(15);
    }
  }

  // --- Toplu işlemler
  function seciliIdler(){ return [...document.querySelectorAll('.kart-checkbox:checked')].map(ch=> parseInt(ch.dataset.id,10)); }
  function hepsiniSec(state){ document.querySelectorAll('.kart-checkbox').forEach(ch=> ch.checked=state); }
  secHepsini.addEventListener('click', ()=> hepsiniSec(true));
  secKaldir.addEventListener('click', ()=> hepsiniSec(false));
  topluOdendi.addEventListener('click', ()=>{
    const ids=seciliIdler(); randevular.forEach(r=>{ if(ids.includes(r.id)) r.odendi=true; });
    verileriKaydet(); randevulariGoster(); toast(dilVerisi.toast_toplu_odendi || 'Seçili randevular ödendi'); vibrate(10);
  });
  topluSil.addEventListener('click', ()=>{
    const ids=seciliIdler(); if(ids.length && confirm(dilVerisi.onay_randevu_sil || 'Seçili randevular silinsin mi?')){
      randevular = randevular.filter(r=> !ids.includes(r.id));
      verileriKaydet(); randevulariGoster(); toast(dilVerisi.toast_toplu_silindi || 'Seçili randevular silindi'); vibrate(15);
    }
  });

  // --- Depo helpers
  function verileriKaydet(){ localStorage.setItem('randevular', JSON.stringify(randevular)); }
  function notlariKaydet(){ localStorage.setItem('notlar', JSON.stringify(notlar)); }
  function ayarlariKaydet(){ localStorage.setItem('temaRengi',temaRengi); localStorage.setItem('gorunumModu',gorunumModu); localStorage.setItem('dil',dil); localStorage.setItem('paraBirimi', paraBirimi); }

  // --- Tema & Para Birimi
  function temaGuncelle(){ document.documentElement.style.setProperty('--ana-renk',temaRengi); document.body.className=gorunumModu; if(modToggle) modToggle.checked=(gorunumModu==='dark-mode'); }
  function paraBirimiGuncelle(){ randevulariGoster(); ayarlariKaydet(); }

  // --- Saat
  function guncelZamaniGoster(){ const s=new Date(); canliSaatDiv.textContent=s.toLocaleTimeString('tr-TR'); canliTarihDiv.textContent=s.toLocaleDateString(dil,{weekday:'long',year:'numeric',month:'long',day:'numeric'}); }

  // --- ICS indirme
  function pad(n){ return String(n).padStart(2,'0'); }
  function toICS(r){
    const dt = toLocalDateTime(r.tarih, r.saat);
    function ymdHis(d){ return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`; }
    const uid = `${r.id}@local`;
    const title = r.baslik ? `${r.isim} - ${r.baslik}` : r.isim;
    return [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Local Appointment//TR','BEGIN:VEVENT',
      `UID:${uid}`,`DTSTAMP:${ymdHis(new Date())}Z`,
      `DTSTART:${ymdHis(dt)}`,
      `SUMMARY:${title.replace(/,/g,'\\,').replace(/;/g,'\\;')}`,
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
  }
  function indirICS(r){
    const blob = new Blob([toICS(r)], {type:'text/calendar'});
    const a = Object.assign(document.createElement('a'), { href:URL.createObjectURL(blob), download:`randevu_${r.id}.ics` });
    document.body.appendChild(a); a.click(); a.remove();
  }

  // --- Swipe jestleri
  function ekleSwipeDavranis(el, id){
    let startX=0, dx=0; const threshold=60;
    el.addEventListener('touchstart', e=>{ startX=e.touches[0].clientX; el.classList.add('swiping'); }, {passive:true});
    el.addEventListener('touchmove', e=>{ dx=e.touches[0].clientX - startX; el.style.transform=`translateX(${dx}px)`; }, {passive:true});
    el.addEventListener('touchend', ()=>{ el.classList.remove('swiping'); el.style.transform=''; if(dx>threshold){ const r = randevular.find(x=>x.id===id); if(r){ r.odendi=!r.odendi; verileriKaydet(); randevulariGoster(); toast(r.odendi?(dilVerisi.toast_odendi||'Ödendi işaretlendi'):(dilVerisi.toast_beklemede||'Beklemeye alındı')); vibrate(10); } } else if(dx<-threshold){ randevuSil(id); } dx=0; });
  }

  // --- Eventler
  ayarlarButonu.addEventListener('click', ()=>{ ayarlarPaneli.classList.add('acik'); ayarlarKatmani.classList.add('goster'); if(modToggle) modToggle.checked=(gorunumModu==='dark-mode'); });
  kapatmaButonu.addEventListener('click', ()=>{ ayarlarPaneli.classList.remove('acik'); ayarlarKatmani.classList.remove('goster'); });
  ayarlarKatmani.addEventListener('click', ()=>{ ayarlarPaneli.classList.remove('acik'); ayarlarKatmani.classList.remove('goster'); });
  ayarSekmeleri.forEach(sekme=> sekme.addEventListener('click', ()=>{
    ayarSekmeleri.forEach(s=>s.classList.remove('aktif'));
    ayarIcerikleri.forEach(i=>i.classList.remove('aktif'));
    sekme.classList.add('aktif'); document.getElementById(sekme.dataset.sekme).classList.add('aktif');
  }));
  renkKapsulleri.forEach(b=> b.addEventListener('click', ()=>{ temaRengi=b.dataset.renk; temaGuncelle(); ayarlariKaydet(); }));
  if(modToggle) modToggle.addEventListener('change', ()=>{ gorunumModu = modToggle.checked ? 'dark-mode' : 'light-mode'; temaGuncelle(); ayarlariKaydet(); });
  varsayilanTemaButonu.addEventListener('click', ()=>{ temaRengi='#3b82f6'; gorunumModu=autoMode(); temaGuncelle(); ayarlariKaydet(); });
  dilButonlari.forEach(b=> b.addEventListener('click', ()=> diliDegistir(b.dataset.dil)));

  ekleButonu.addEventListener('click', ()=>{ if(duzenlemeModu) randevuGuncelle(); else randevuEkle(); });
  aySecimi.addEventListener('change', randevulariGoster);
  yilSecimi.addEventListener('change', randevulariGoster);
  if(ciroTuru) ciroTuru.addEventListener('change', ciroyuHesapla);
  paraBirimiSelect.addEventListener('change', ()=>{ paraBirimi = paraBirimiSelect.value; randevulariGoster(); ayarlariKaydet(); });

  notKategorisiSelect.addEventListener('change', notuYukle);
  yeniNotButonu.addEventListener('click', yeniNotKategorisi);
  notKaydetButonu.addEventListener('click', notuKaydet);
  kategoriSilButonu.addEventListener('click', kategoriSil);

  bugunButonu.addEventListener('click', ()=>{
    const now = new Date();
    yilSecimi.value = String(now.getFullYear());
    aySecimi.value = String(now.getMonth());
    randevulariGoster();
  });
  yazdirButonu.addEventListener('click', ()=> window.print());

  hizliArama.addEventListener('input', debounce(()=> randevulariGoster(), 180));

  document.addEventListener('keydown', (e)=>{
    if(e.key==='/' && document.activeElement.tagName!=='INPUT' && document.activeElement.tagName!=='TEXTAREA'){ e.preventDefault(); hizliArama.focus(); }
    if(e.key.toLowerCase()==='n'){ musteriAdiInput.focus(); }
    if(e.key==='Delete'){ topluSil.click(); }
    if(e.key.toLowerCase()==='p'){ e.preventDefault(); window.print(); }
  });

  // Alt bar
  altYeni.addEventListener('click', ()=>{ formuTemizleVeSifirla(); musteriAdiInput.focus({preventScroll:false}); window.scrollTo({top:0, behavior:'smooth'}); });
  theAltBugun.addEventListener('click', ()=> bugunButonu.click());
  altAyarlar.addEventListener('click', ()=> ayarlarButonu.click());

  // --- Başlangıç
  async function baslat(){
    await dilDosyasiniYukle(dil);
    const kodlar={ tr:'tr', en:'en-GB', de:'de' };
    datepicker.setOptions({ language:kodlar[dil] || 'tr' });

    temaGuncelle();
    saatiDoldur();
    filtreleriDoldur();
    arayuzuCevir();
    randevulariGoster();
    kategorileriDoldur();

    setInterval(guncelZamaniGoster, 1000);
    setInterval(randevulariGoster, 60000);
    guncelZamaniGoster();
  }
  baslat();

  // Depo helpers
  function verileriKaydet(){ localStorage.setItem('randevular', JSON.stringify(randevular)); }
  function notlariKaydet(){ localStorage.setItem('notlar', JSON.stringify(notlar)); }
  function ayarlariKaydet(){ localStorage.setItem('temaRengi',temaRengi); localStorage.setItem('gorunumModu',gorunumModu); localStorage.setItem('dil',dil); localStorage.setItem('paraBirimi', paraBirimi); }
});
