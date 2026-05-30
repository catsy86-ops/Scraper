// Simulate loading all browser scripts in one shared global scope (like a browser does)
// to detect redeclaration errors and top-level runtime crashes.
import fs from 'fs';
import vm from 'vm';

const scripts = [
  'data.js','error-handler.js','offline-store.js','zditm-live.js','sync-manager.js',
  'performance.js','places-enhanced.js','community-data.js','community-ui.js',
  'map-enhancements.js','map-improvements.js','map-pro.js','map-layers.js',
  'map-vehicles.js','map-extras.js','map-extras2.js','buildings-3d.js',
  'navigation.js','search.js','place-images.js','user-profile.js',
  'routes-meetup.js','ux-enhancements.js','pwa.js','pull-refresh.js',
  'pogon-mascot.js','app.js','live.js','google-maps.js'
];

// Minimal browser-like globals
const listeners = {};
const doc = {
  addEventListener: (t, fn) => { (listeners[t] ||= []).push(fn); },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ style:{}, classList:{ add(){}, remove(){}, toggle(){} }, addEventListener(){}, appendChild(){}, setAttribute(){} }),
  documentElement: { setAttribute(){}, style:{} },
  body: { appendChild(){}, classList:{ add(){}, remove(){} }, prepend(){} },
  head: { appendChild(){} },
};
const sandbox = {
  console, setTimeout, clearTimeout, setInterval, clearInterval,
  fetch: () => Promise.resolve({ ok:true, json:()=>Promise.resolve({}), text:()=>Promise.resolve('') }),
  Promise, Date, Math, JSON, Array, Object, String, Number, Boolean, parseInt, parseFloat, isNaN,
  Set, Map, RegExp, encodeURIComponent, decodeURIComponent, btoa:(s)=>s, atob:(s)=>s,
  navigator: { onLine:true, geolocation:{ getCurrentPosition(){}, watchPosition(){} }, serviceWorker:{ register:()=>Promise.resolve({}) }, share:undefined },
  location: { hostname:'localhost', search:'', pathname:'/', hash:'', href:'http://localhost:3000/', origin:'http://localhost:3000' },
  localStorage: { _d:{}, getItem(k){return this._d[k]??null;}, setItem(k,v){this._d[k]=String(v);}, removeItem(k){delete this._d[k];}, key(){return null;}, get length(){return 0;} },
  document: doc,
  performance: { now:()=>0, timing:{}, getEntriesByType:()=>[] },
  requestAnimationFrame: (fn)=>setTimeout(fn,0),
  indexedDB: { open:()=>({}) },
  L: { map:()=>({}), tileLayer:()=>({ on(){}, addTo(){} }), DomUtil:{ create:()=>doc.createElement(), setPosition(){} }, DomEvent:{ disableClickPropagation(){}, disableScrollPropagation(){} }, marker:()=>({}), control:{ zoom:()=>({addTo(){}}) } },
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
sandbox.PerformanceObserver = function(){ this.observe=()=>{}; };
sandbox.PerformanceObserver.supportedEntryTypes = [];

const ctx = vm.createContext(sandbox);

let failed = false;
for (const s of scripts) {
  try {
    const code = fs.readFileSync(s, 'utf8');
    vm.runInContext(code, ctx, { filename: s });
    console.log('OK  ', s);
  } catch (e) {
    failed = true;
    console.error('FAIL', s, '->', e.constructor.name + ':', e.message);
  }
}
console.log(failed ? '\n❌ ERRORS FOUND' : '\n✅ ALL SCRIPTS LOADED CLEANLY');
