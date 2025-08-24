const CACHE = "randevu-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./stil.css",
  "./uygulama.js",
  "./manifest.json",
  "./icon-512x512.png",
  "./langs/tr.json",
  "./langs/en.json",
  "./langs/de.json",
  "https://cdn.quilljs.com/1.3.6/quill.js",
  "https://cdn.quilljs.com/1.3.6/quill.snow.css",
  "https://cdn.jsdelivr.net/npm/vanillajs-datepicker@1.3.4/dist/js/datepicker-full.min.js",
  "https://cdn.jsdelivr.net/npm/vanillajs-datepicker@1.3.4/dist/css/datepicker-bs5.min.css"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(()=> caches.match("./index.html")))
  );
});
