const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./cloud-CF-ejomB.js","./index-DFfxJV5E.js","./index-B0jy0yQm.css","./zip-D_jIKcq_.js","./bytes-Bld9ulzd.js"])))=>i.map(i=>d[i]);
import{P as L,_ as w,c as C,h as A,cc as I,g3 as M,g6 as P,g8 as T,g9 as j,g7 as D}from"./index-DFfxJV5E.js";import{S as q}from"./host-tu8NrjTN.js";/* empty css                  */const N=`// Script runtime: the \`studio\` API as a script sees it. This file runs inside\r
// the script sandbox (a dedicated worker started by an iframe with an opaque\r
// origin and a content security policy without network access), followed by\r
// the user's script wrapped in an async function. Every call becomes a\r
// structured-clone message to Photo Studio, which checks it and answers.\r
// Plain JavaScript: it is inserted as text, not bundled.\r
const __studioRegister = (() => {\r
  'use strict';\r
  let port = null;\r
  let main = null;\r
  let info = { lineOffset: 0, script: { id: '', name: '' }, event: null };\r
  let next = 0;\r
  let cancelled = false;\r
  const pending = new Map();\r
  // Calls a script may have waiting at once: a loop that calls the API without\r
  // awaiting stops here instead of flooding Photo Studio with requests.\r
  const MAX_PENDING = 10000;\r
\r
  class ScriptCancelled extends Error {\r
    constructor() {\r
      super('The script was stopped.');\r
      this.name = 'ScriptCancelled';\r
    }\r
  }\r
  const send = (message) => port.postMessage(message);\r
  function call(method, ...args) {\r
    if (cancelled) return Promise.reject(new ScriptCancelled());\r
    if (pending.size >= MAX_PENDING) throw new Error(\`More than \${MAX_PENDING} API calls are waiting: use await in loops that call the studio API.\`);\r
    flushLogs();\r
    const id = ++next;\r
    // The call site, so an error reports the script's line rather than the runtime's.\r
    const site = new Error();\r
    return new Promise((resolve, reject) => {\r
      pending.set(id, { resolve, reject, site });\r
      send({ type: 'call', id, method, args });\r
    });\r
  }\r
  function receive(ev) {\r
    const m = ev.data;\r
    if (!m || typeof m !== 'object') return;\r
    if (m.type === 'ping') return send({ type: 'pong', n: m.n });\r
    if (m.type === 'cancel') {\r
      cancelled = true;\r
      for (const p of pending.values()) p.reject(new ScriptCancelled());\r
      pending.clear();\r
      return;\r
    }\r
    const p = pending.get(m.id);\r
    if (!p) return;\r
    pending.delete(m.id);\r
    if (m.type === 'result') p.resolve(m.value);\r
    else if (m.name === 'ScriptCancelled') p.reject(new ScriptCancelled());\r
    else {\r
      const error = new Error(m.message);\r
      error.name = m.name || 'Error';\r
      error.stack = \`\${error.name}: \${error.message}\\n\${String(p.site.stack || '').split('\\n').slice(1).join('\\n')}\`;\r
      p.reject(error);\r
    }\r
  }\r
\r
  // console.* goes to the Scripts panel output.\r
  const show = (v) => {\r
    if (typeof v === 'string') return v;\r
    if (v instanceof Error) return \`\${v.name}: \${v.message}\`;\r
    try {\r
      return JSON.stringify(v, (_k, x) => (ArrayBuffer.isView(x) ? \`[\${x.constructor.name} \${x.length}]\` : x));\r
    } catch {\r
      return String(v);\r
    }\r
  };\r
  // Output goes out at once up to LOG_RATE lines a second; more is held (the\r
  // latest LOG_HOLD lines) until the script next waits, so a loop that keeps\r
  // logging cannot flood Photo Studio or keep the watchdog from stopping it.\r
  const LOG_RATE = 100;\r
  const LOG_HOLD = 500;\r
  let held = [];\r
  let dropped = 0;\r
  let flushTimer = 0;\r
  let windowStart = 0;\r
  let windowCount = 0;\r
  function flushLogs() {\r
    clearTimeout(flushTimer);\r
    flushTimer = 0;\r
    if (dropped) send({ type: 'log', level: 'warn', text: \`(\${dropped} more lines were not shown)\` });\r
    for (const line of held) send(line);\r
    held = [];\r
    dropped = 0;\r
    windowStart = Date.now();\r
    windowCount = 0;\r
  }\r
  function emit(line) {\r
    const now = Date.now();\r
    if (now - windowStart >= 1000) {\r
      windowStart = now;\r
      windowCount = 0;\r
    }\r
    if (!held.length && windowCount < LOG_RATE) {\r
      windowCount++;\r
      return send(line);\r
    }\r
    held.push(line);\r
    if (held.length >= LOG_HOLD * 2) {\r
      dropped += held.length - LOG_HOLD;\r
      held = held.slice(-LOG_HOLD);\r
    }\r
    flushTimer ||= setTimeout(flushLogs, 50);\r
  }\r
  const log = (level) => (...args) => emit({ type: 'log', level, text: args.map(show).join(' ').slice(0, 4000) });\r
  const scriptConsole = Object.freeze({ log: log('log'), info: log('info'), debug: log('log'), warn: log('warn'), error: log('error') });\r
\r
  const idOf = (layer) => (layer && typeof layer === 'object' ? layer.id : layer);\r
  const layer = (info) => (info ? new Layer(info) : null);\r
\r
  class Layer {\r
    constructor(data) {\r
      Object.assign(this, data);\r
    }\r
    refresh() { return call('layers.get', this.documentId, this.id).then(layer); }\r
    set(props) { return call('layers.set', this.documentId, this.id, props).then(layer); }\r
    rename(name) { return this.set({ name }); }\r
    show() { return this.set({ visible: true }); }\r
    hide() { return this.set({ visible: false }); }\r
    move(dx, dy) { return call('layers.translate', this.documentId, this.id, dx, dy).then(layer); }\r
    moveTo(x, y) {\r
      const b = this.bounds || { x: 0, y: 0 };\r
      return this.move(x - b.x, y - b.y);\r
    }\r
    arrange(where) {\r
      const w = where && typeof where === 'object' ? Object.fromEntries(Object.entries(where).map(([k, v]) => [k, idOf(v)])) : where;\r
      return call('layers.arrange', this.documentId, this.id, w).then(layer);\r
    }\r
    duplicate() { return call('layers.duplicate', this.documentId, this.id).then(layer); }\r
    remove() { return call('layers.remove', this.documentId, this.id); }\r
    select() { return call('layers.select', this.documentId, [this.id]); }\r
    pixels(rect) { return call('layers.getPixels', this.documentId, this.id, rect); }\r
    setPixels(image, x, y) {\r
      const img = x === undefined ? image : { ...image, x, y };\r
      return call('layers.setPixels', this.documentId, this.id, img).then(layer);\r
    }\r
    getText() { return call('layers.getText', this.documentId, this.id); }\r
    setText(textOrOptions) { return call('layers.setText', this.documentId, this.id, textOrOptions).then(layer); }\r
    setStyle(style) { return call('layers.setStyle', this.documentId, this.id, style).then(layer); }\r
    async children() {\r
      const all = await call('layers.list', this.documentId);\r
      return all.filter((l) => l.parentId === this.id).map(layer);\r
    }\r
    export(options = {}) { return call('documents.export', this.documentId, { ...options, layer: this.id }); }\r
  }\r
\r
  const doc = (info) => (info ? new Document(info) : null);\r
  class Document {\r
    constructor(data) {\r
      Object.assign(this, data);\r
    }\r
    refresh() { return call('documents.get', this.id).then(doc); }\r
    activate() { return call('documents.activate', this.id).then(doc); }\r
    async layers() { return (await call('layers.list', this.id)).map(layer); }\r
    async layer(idOrName) {\r
      const all = await call('layers.list', this.id);\r
      return layer(all.find((l) => l.id === idOrName) || all.find((l) => l.name === idOrName));\r
    }\r
    async selectedLayers() { return (await call('layers.selected', this.id)).map(layer); }\r
    selectLayers(layers) { return call('layers.select', this.id, [].concat(layers).map(idOf)); }\r
    addLayer(options = {}) {\r
      const o = { ...options };\r
      for (const k of ['above', 'inside']) if (o[k] !== undefined) o[k] = idOf(o[k]);\r
      return call('layers.create', this.id, o).then(layer);\r
    }\r
    composite(rect) { return call('documents.composite', this.id, rect); }\r
    selection() { return call('selection.get', this.id); }\r
    select(shape, operation) { return call('selection.set', this.id, shape, operation); }\r
    selectAll() { return call('selection.all', this.id); }\r
    deselect() { return call('selection.clear', this.id); }\r
    invertSelection() { return call('selection.invert', this.id); }\r
    selectionMask() { return call('selection.getMask', this.id); }\r
    setSelectionMask(mask, operation) { return call('selection.setMask', this.id, mask, operation); }\r
    run(command, arg) { return call('commands.run', command, arg, this.id); }\r
    export(options = {}) { return call('documents.export', this.id, options); }\r
    save() { return call('documents.save', this.id); }\r
    close(options = {}) { return call('documents.close', this.id, options); }\r
    undo() { return call('documents.undo', this.id); }\r
    redo() { return call('documents.redo', this.id); }\r
  }\r
\r
  const studio = Object.freeze({\r
    apiVersion: 1,\r
    get script() { return { ...info.script }; },\r
    // Set when the script runs for a Script Events Manager event.\r
    get event() { return info.event ? { ...info.event } : null; },\r
    get cancelled() { return cancelled; },\r
    checkCancelled() {\r
      if (cancelled) throw new ScriptCancelled();\r
    },\r
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, Math.min(60000, Number(ms) || 0)))),\r
    app: Object.freeze({\r
      info: () => call('app.info'),\r
      message: (text) => call('app.message', String(text)),\r
    }),\r
    documents: Object.freeze({\r
      list: async () => (await call('documents.list')).map(doc),\r
      active: () => call('documents.active').then(doc),\r
      get: (id) => call('documents.get', id).then(doc),\r
      create: (options = {}) => call('documents.create', options).then(doc),\r
      open: async (options = {}) => (await call('documents.open', options)).map(doc),\r
    }),\r
    commands: Object.freeze({\r
      run: (id, arg) => call('commands.run', id, arg),\r
      list: () => call('commands.list'),\r
    }),\r
    history: Object.freeze({\r
      checkpoint: (label) => call('history.checkpoint', label),\r
      setGrouping: (on) => call('history.grouping', !!on),\r
    }),\r
    ui: Object.freeze({\r
      alert: (message, title) => call('ui.alert', String(message), title),\r
      confirm: (message, title) => call('ui.confirm', String(message), title),\r
      prompt: (message, value, title) => call('ui.prompt', String(message), value === undefined ? '' : String(value), title),\r
      form: (title, fields, options) => call('ui.form', String(title), fields, options),\r
      progress: (fraction, message) => call('ui.progress', fraction === undefined ? null : fraction, message),\r
    }),\r
    files: Object.freeze({\r
      open: (options = {}) => call('files.open', options),\r
      save: (name, data, type) => call('files.save', name, data, type),\r
      saveAll: (files, zipName) => call('files.saveAll', files, zipName),\r
    }),\r
    image: Object.freeze({\r
      create(width, height, fill) {\r
        const data = new Uint8ClampedArray(width * height * 4);\r
        if (fill) {\r
          const [r, g, b, a = 255] = typeof fill === 'string' ? [1, 3, 5].map((i) => parseInt(fill.slice(i, i + 2), 16)) : fill;\r
          for (let i = 0; i < data.length; i += 4) {\r
            data[i] = r;\r
            data[i + 1] = g;\r
            data[i + 2] = b;\r
            data[i + 3] = a;\r
          }\r
        }\r
        return { width, height, data };\r
      },\r
      encode: (image, options) => call('image.encode', image, options),\r
    }),\r
  });\r
\r
  // The script's own line number of an error, from the worker's stack.\r
  function lineOf(error) {\r
    const stack = String((error && error.stack) || '');\r
    for (const m of stack.matchAll(/blob:[^\\s)]*?:(\\d+):\\d+/g)) {\r
      const line = Number(m[1]) - info.lineOffset;\r
      if (line > 0) return line;\r
    }\r
    return 0;\r
  }\r
  async function run() {\r
    try {\r
      if (!main) throw new Error('The script did not load.');\r
      await main(studio, scriptConsole);\r
      flushLogs();\r
      send({ type: 'done' });\r
    } catch (error) {\r
      flushLogs();\r
      if (cancelled || (error && error.name === 'ScriptCancelled')) return send({ type: 'done', cancelled: true });\r
      send({ type: 'failed', name: (error && error.name) || 'Error', message: String((error && error.message) || error), line: lineOf(error) });\r
    }\r
  }\r
  self.addEventListener('unhandledrejection', (ev) => {\r
    ev.preventDefault();\r
    if (port && !(ev.reason && ev.reason.name === 'ScriptCancelled')) scriptConsole.error('Unhandled rejection:', ev.reason);\r
  });\r
  self.onmessage = (ev) => {\r
    if (port || !ev.data || ev.data.type !== 'start' || !ev.ports[0]) return;\r
    port = ev.ports[0];\r
    info = ev.data.info;\r
    port.onmessage = receive;\r
    void run();\r
  };\r
  return (fn) => {\r
    main = fn;\r
  };\r
})();\r
`,R="default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:",z=`let started = false;
addEventListener('message', (ev) => {
  if (started || ev.source !== parent || !ev.data || ev.data.type !== 'start' || !ev.ports[0]) return;
  started = true;
  const url = URL.createObjectURL(new Blob([ev.data.code], { type: 'text/javascript' }));
  const worker = new Worker(url, { name: 'script' });
  worker.onerror = (e) => {
    e.preventDefault();
    parent.postMessage({ type: 'worker-error', message: String(e.message || 'The script could not run.'), line: e.lineno || 0 }, '*');
  };
  worker.postMessage({ type: 'start', info: ev.data.info }, [ev.ports[0]]);
});`;function G(){return`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${R}"><script>${z}<\/script></head><body></body></html>`}function F(n){const e=`${N}
__studioRegister(async function (studio, console) {
`;return{code:`${e}${n}
});
`,lineOffset:e.split(`
`).length-1}}const B=1e3,k=1e3,v=4e3,O=1e4,H=new Set(["log","info","warn","error"]);class U{constructor(e,r,t,i=30){this.source=e,this.info=r,this.handlers=t,this.timeoutSeconds=i}source;info;handlers;timeoutSeconds;frame;port;finish;watchdog=0;heard=0;queue=Promise.resolve();stopping=0;inCall=0;queued=0;pings=[];logWindow=0;logCount=0;logDropped=0;onWindowMessage=e=>{if(!this.frame||e.source!==this.frame.contentWindow)return;const r=e.data;r?.type==="worker-error"&&this.end({status:"failed",message:String(r.message??"The script could not run.").replace(/^Uncaught /,"").slice(0,v),line:Math.max(0,Number(r.line)-this.lineOffset)})};lineOffset=0;run(){return new Promise(e=>{this.finish=e;const{code:r,lineOffset:t}=F(this.source);this.lineOffset=t;const i=document.createElement("iframe");i.setAttribute("sandbox","allow-scripts"),i.setAttribute("aria-hidden","true"),i.tabIndex=-1,i.className="script-sandbox",i.title="Script sandbox",i.srcdoc=G(),this.frame=i,window.addEventListener("message",this.onWindowMessage),i.addEventListener("load",()=>{const s=new MessageChannel;this.port=s.port1,this.port.onmessage=o=>this.receive(o.data),this.heard=performance.now(),i.contentWindow.postMessage({type:"start",code:r,info:{...this.info,lineOffset:t}},"*",[s.port2]),this.watchdog=window.setInterval(()=>this.tick(),B)},{once:!0}),document.body.append(i)})}cancel(){!this.finish||this.stopping||(this.port?.postMessage({type:"cancel"}),this.stopping=window.setTimeout(()=>this.end({status:"cancelled"}),2e3))}tick(){const e=Math.floor(Math.random()*4503599627370496);this.pings=[e,...this.pings].slice(0,4),this.port?.postMessage({type:"ping",n:e}),this.inCall&&(this.heard=performance.now()),(performance.now()-this.heard)/1e3>this.timeoutSeconds?this.end({status:"timeout",seconds:this.timeoutSeconds}):this.flushDropped()}receive(e){if(!(!e||typeof e!="object"||!this.finish))if(e.type==="pong")typeof e.n=="number"&&this.pings.includes(e.n)&&(this.heard=performance.now());else if(e.type==="call"&&typeof e.id=="number"&&typeof e.method=="string"){const{id:r,method:t}=e,i=Array.isArray(e.args)?e.args:[];if(++this.queued>O)return this.end({status:"failed",message:`More than ${O} API calls are waiting: use await in loops that call the studio API.`,line:0});this.queue=this.queue.then(async()=>{if(this.finish){this.inCall++;try{const s=await this.handlers.call(t,i);this.port?.postMessage({type:"result",id:r,value:s},V(s))}catch(s){const o=s instanceof Error?s:new Error(String(s));this.port?.postMessage({type:"error",id:r,name:o.name==="ScriptError"?"Error":o.name,message:o.message})}finally{this.inCall--,this.heard=performance.now()}}}).finally(()=>this.queued--)}else e.type==="log"?this.log(e.level,e.text):e.type==="done"?this.end({status:e.cancelled?"cancelled":"done"}):e.type==="failed"&&this.end({status:"failed",message:String(e.message??"The script failed.").slice(0,v),line:Math.max(0,Math.floor(Number(e.line)))||0})}log(e,r){const t=performance.now();if(t-this.logWindow>=1e3&&(this.flushDropped(),this.logWindow=t,this.logCount=0),typeof r=="string"&&r.length>v||this.logCount>k*20)return this.end({status:"failed",message:"It sent more output than Photo Studio accepts.",line:0});if(++this.logCount>k){this.logDropped++;return}this.handlers.log(typeof e=="string"&&H.has(e)?e:"log",String(r??"").slice(0,v))}flushDropped(){if(!this.logDropped)return;const e=this.logDropped;this.logDropped=0,this.handlers.log("warn",`(${e} more lines were not shown)`)}end(e){const r=this.finish;r&&(this.flushDropped(),this.finish=void 0,this.queue.then(()=>{this.dispose(),r(this.stopping&&e.status==="done"?{status:"cancelled"}:e)}))}dispose(){clearInterval(this.watchdog),clearTimeout(this.stopping),window.removeEventListener("message",this.onWindowMessage),this.port?.close(),this.port=void 0,this.frame?.remove(),this.frame=void 0}}function V(n){const e=new Set,r=t=>{ArrayBuffer.isView(t)&&t.buffer instanceof ArrayBuffer&&t.byteLength===t.buffer.byteLength&&e.add(t.buffer)};if(n&&typeof n=="object"){r(n);for(const t of Object.values(n))r(t)}return[...e]}const p=n=>C(String(n));function g(n,e,r,t,i){const s=document.createElement("dialog");s.className="files-dialog script-dialog",s.setAttribute("aria-label",e);const o=t.at(-1);s.innerHTML=`<form method="dialog"><p class="script-origin" title="This window comes from a script you installed">${L("square-code",13)}<span>Script: ${p(n)}</span></p><h2>${p(e)}</h2>${r}<div class="dialog-actions">${t.slice(0,-1).map(([u,l])=>`<button type="button" data-act="${u}">${p(l)}</button>`).join("")}<button type="submit" class="primary" data-act="${o[0]}">${p(o[1])}</button></div></form>`,document.body.append(s);const d=s.querySelector("form");return new Promise(u=>{const l=c=>{s.close(),s.remove(),u(c===null?null:{action:c,form:d})};s.addEventListener("cancel",c=>{c.preventDefault(),l(null)}),d.addEventListener("submit",c=>{c.preventDefault(),d.reportValidity()&&l(o[0])});for(const[c,,h]of t.slice(0,-1))h||s.querySelector(`button[data-act="${c}"]`).addEventListener("click",()=>l(c==="cancel"?null:c));i?.(s),s.showModal()})}const b=n=>n.split(/\n{2,}/).map(e=>`<p class="script-message">${p(e).replace(/\n/g,"<br>")}</p>`).join("");function W(n,e){const r=`script-field-${e}`,t=o=>n[o]!==void 0?`${o}="${n[o]}"`:"",i=`name="${p(n.name)}" id="${r}"`;let s;return n.type==="checkbox"?`<label class="dialog-field checkbox-field" for="${r}">${p(n.label)}<input type="checkbox" ${i} ${n.value===!0||n.value==="yes"?"checked":""}></label>`:(n.type==="select"?s=`<select ${i}>${(n.options??[]).map(([o,d])=>`<option value="${p(o)}" ${String(n.value)===o?"selected":""}>${p(d)}</option>`).join("")}</select>`:n.type==="textarea"?s=`<textarea ${i} rows="4">${p(n.value)}</textarea>`:n.type==="range"?s=`<span class="script-range"><input type="range" ${i} ${t("min")} ${t("max")} ${t("step")} value="${p(n.value)}"><output for="${r}">${p(n.value)}</output></span>`:n.type==="number"?s=`<input type="number" ${i} ${t("min")} ${t("max")} ${n.step!==void 0?t("step"):'step="any"'} value="${p(n.value)}" required>`:n.type==="color"?s=`<input type="color" ${i} value="${/^#[0-9a-f]{6}$/i.test(String(n.value))?p(n.value):"#000000"}">`:s=`<input type="text" ${i} value="${p(n.value)}" autocomplete="off">`,`<label class="dialog-field" for="${r}">${p(n.label)}${s}</label>`)}function X(n,e,r){return{async alert(t,i){await g(e,i,b(t),[["ok","OK"]])},async confirm(t,i){return(await g(e,i,b(t),[["cancel","Cancel"],["ok","OK"]]))?.action==="ok"},async prompt(t,i,s){const o=await g(e,s,`${b(t)}<label class="dialog-field"><input type="text" name="answer" value="${p(i)}" autocomplete="off" aria-label="Answer"></label>`,[["cancel","Cancel"],["ok","OK"]]);return o?o.form.elements.namedItem("answer").value:null},async form(t,i,s,o){const d=await g(e,t,`${o?b(o):""}<div class="script-form">${i.map(W).join("")}</div>`,[["cancel","Cancel"],["ok",s]],l=>{for(const c of l.querySelectorAll('input[type="range"]'))c.addEventListener("input",()=>c.nextElementSibling.textContent=c.value)});if(!d)return null;const u={};return i.forEach((l,c)=>{const h=d.form.querySelector(`#script-field-${c}`);u[l.name]=l.type==="checkbox"?h.checked:l.type==="number"||l.type==="range"?Number(h.value):h.value}),u},progress:r,async openFiles(t){const i=t.accept==="image"||!t.accept?document.querySelector("#file-input")?.accept??"image/*":t.accept;let s=null;return await g(e,t.multiple?"Choose Files":"Choose a File",`<p class="script-message">The script asks to read ${t.multiple?"files":"a file"}. It receives only what you choose.</p><p class="script-picked muted" aria-live="polite">Nothing chosen yet.</p>`,[["cancel","Cancel"],["device","From this device…","stay"],["puter","From Puter…","stay"],["ok","Use"]],d=>{const u=d.querySelector('button[type="submit"]');u.disabled=!0;const l=d.querySelector(".script-picked"),c=a=>{s=a,u.disabled=!a.length,l.textContent=a.length?a.map(m=>m.name).join(", "):"Nothing chosen yet."},h=async a=>c(await Promise.all(a.map(async m=>{const f=await m.read();return{name:m.name,type:f.type||m.type||"",data:new Uint8Array(await f.arrayBuffer())}})));d.querySelector('[data-act="device"]').addEventListener("click",()=>{const a=document.createElement("input");a.type="file",a.accept=i,a.multiple=t.multiple,a.onchange=()=>{h(Array.from(a.files??[]).map(m=>({name:m.name,type:m.type,read:async()=>m})))},a.click()}),d.querySelector('[data-act="puter"]').addEventListener("click",()=>{w(async()=>{const{pickCloudFiles:a}=await import("./cloud-CF-ejomB.js");return{pickCloudFiles:a}},__vite__mapDeps([0,1,2]),import.meta.url).then(({pickCloudFiles:a})=>a(t.multiple,i)).then(a=>h(a.map(m=>({name:m.name,read:()=>m.read()})))).catch(a=>l.textContent=String(a instanceof Error?a.message:a))})})?s??[]:[]},async saveFiles(t,i){const s=t.reduce((h,a)=>h+a.data.length,0),o=s<1024*1024?`${Math.max(1,Math.round(s/1024))} KB`:`${(s/1048576).toFixed(1)} MB`,d=t.length===1?`“${t[0].name}”`:`${t.length} files as “${i}”`,u=await g(e,"Save Files",`<p class="script-message">The script wants to save ${p(d)} (${o}).</p>`,[["cancel","Cancel"],["puter","Save to Puter…"],["download","Download"]]);if(!u)return!1;let l,c;if(t.length===1)l=new Blob([t[0].data],{type:t[0].type}),c=t[0].name;else{const{uniqueName:h,zipStore:a}=await w(async()=>{const{uniqueName:f,zipStore:_}=await import("./zip-D_jIKcq_.js");return{uniqueName:f,zipStore:_}},__vite__mapDeps([3,4]),import.meta.url),m=new Set;l=new Blob([a(t.map(f=>({name:h(f.name,m),data:f.data})))],{type:"application/zip"}),c=i??"files.zip"}if(u.action==="puter"){const{cloudSaveAs:h}=await w(async()=>{const{cloudSaveAs:a}=await import("./cloud-CF-ejomB.js");return{cloudSaveAs:a}},__vite__mapDeps([0,1,2]),import.meta.url);h(l,c).then(a=>n.message(`Saved ${a.name} to Puter`)).catch(a=>n.message(String(a instanceof Error?a.message:a)))}else{const{download:h}=await w(async()=>{const{download:a}=await import("./index-DFfxJV5E.js").then(m=>m.oO);return{download:a}},__vite__mapDeps([1,2]),import.meta.url);h(l,c)}return!0}}}function K(n,e,r){const t=document.createElement("div");t.className="script-run",t.setAttribute("role","status"),t.hidden=!0,t.innerHTML=`${L("square-code",14)}<span class="script-run-name">${p(e)}</span><span class="script-run-message"></span><progress max="1" aria-label="Script progress"></progress><button type="button" class="script-run-stop" title="Stop the script (its changes so far stay as one undo step)">Stop</button>`,t.querySelector("button").addEventListener("click",r),n.root.append(t);const i=window.setTimeout(()=>t.hidden=!1,400),s=t.querySelector("progress");return s.removeAttribute("value"),{progress(o,d){o===null?s.removeAttribute("value"):s.value=o,t.querySelector(".script-run-message").textContent=d,(d||o!==null)&&(t.hidden=!1)},stopping(){t.querySelector("button").disabled=!0,t.querySelector(".script-run-message").textContent="Stopping…"},remove(){clearTimeout(i),t.remove()}}}const E=500,y=[],$=new Set;function te(n){return $.add(n),()=>$.delete(n)}function x(n,e,r){y.push({time:Date.now(),script:n,level:e,text:r}),y.length>E&&y.splice(0,y.length-E),$.forEach(t=>t())}function ne(){y.length=0,$.forEach(n=>n())}let S;const re=()=>!!S;async function J(n,e){const r=await A({title:"Run Script?",className:"script-confirm",body:`<p>“${C(n)}” is a script: a small program that can change your open documents, create and close documents, and ask you to open or save files.</p><p class="muted">It runs separately from Photo Studio, without network access and without access to your Puter account or this site's storage. Run it only if you trust where it came from.</p>${e.offerInstall?'<label class="dialog-field checkbox-field">Add it to File → Scripts<input type="checkbox" name="install"></label>':""}`,submit:"Run Script"});if(!r)return null;const t=e.offerInstall&&I(r.form,"install");return r.close(),{install:t}}async function se(n,e){if(S)return n.message("Another script is running. Stop it first."),!1;let r=e.trusted??(e.id?!!M(e.id)?.trusted:!1);if(!r){if(e.event)return n.message(`“${e.name}” was not run for ${e.event.name}: run it once from File → Scripts first.`),!1;const u=await J(e.name,{offerInstall:!e.id});if(!u)return!1;if(r=!0,e.id)await P(e.id,{trusted:!0});else if(u.install){const l=T(e.source,e.name,{trusted:!0});await j(l),e={...e,id:l.id}}}const t=`${e.name} (script)`;let i;const s=new U(e.source,{script:{id:e.id??"",name:e.name},event:e.event??null},{call:(u,l)=>o.call(u,l),log:(u,l)=>x(e.name,u,l)},D(e.source).timeout??30);i=K(n,e.name,()=>{i?.stopping(),s.cancel()});const o=new q(n,X(n,e.name,(u,l)=>i?.progress(u,l)),t);S=s;let d;try{d=await s.run()}finally{S=void 0,i.remove(),o.finish()}return Q(n,e.name,d),!0}function Q(n,e,r){if(r.status==="done"){x(e,"info","Finished.");return}const t=r.status==="cancelled"?`Stopped “${e}”. Changes it made so far can be undone in one step.`:r.status==="timeout"?`Stopped “${e}”: it did not respond for ${r.seconds} seconds.`:`“${e}” failed${r.line?` at line ${r.line}`:""}: ${r.message}`;x(e,r.status==="cancelled"?"info":"error",t),n.message(t)}export{ne as clearScriptLog,J as confirmScript,te as onScriptLog,se as runScript,y as scriptLog,re as scriptRunning};
