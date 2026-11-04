/* =========================================================
   Shunfenger Sound Level Meter — app.js
   Vanilla JS · Web Audio API real · Geolocation API real
   ========================================================= */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Constantes ---------- */
  const KEY_REC   = 'shunfenger.records.v1';
  const KEY_THEME = 'shunfenger.theme.v1';
  const KEY_CAL   = 'shunfenger.cal.v1';
  const APP_NAME  = 'Shunfenger Sound Level Meter';
  const OFFICIAL_URL = 'https://magpe-stack.github.io/Shunfenger-Sound-Level-Meter/';
  const DEFAULT_CAL = 100;
  const MAX_DB = 120;
  const TICK_MS = 100;
  const DISCLAIMER = 'Medições aproximadas feitas com o microfone do smartphone; não substituem sonômetro calibrado (IEC 61672).';

  const MODES = {
    cont: { label: 'Contínuo', sec: 0 },
    '10': { label: '10 s', sec: 10 },
    '20': { label: '20 s', sec: 20 },
    '30': { label: '30 s', sec: 30 },
  };

  /* ---------- Storage seguro ---------- */
  const store = {
    get(k) {
      try { return localStorage.getItem(k); }
      catch { return null; }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
        return true;
      } catch {
        return false;
      }
    },
  };

  let cal = parseFloat(store.get(KEY_CAL));
  if (!isFinite(cal)) cal = DEFAULT_CAL;

  /* ---------- Estado ---------- */
  const S = {
    mode: 'cont',
    running: false,
    saving: false,
    ctx: null,
    stream: null,
    analyser: null,
    buf: null,
    timer: null,
    startTs: 0,
    t0: 0,
    smooth: 0,
    acc: null,
    locPromise: null,
    wake: null,
    installEvt: null,
  };

  /* ---------- Utilidades ---------- */
  const round1 = n => Math.round(n * 10) / 10;

  const fmtDate = ts => new Date(ts).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  });

  const pad2 = n => String(n).padStart(2, '0');

  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function classify(v) {
    const r = Math.round(v);

    if (r < 50) {
      return { key: 'safe', emoji: '🟢', label: 'Seguro / Ideal' };
    }

    if (r <= 70) {
      return { key: 'moderate', emoji: '🟡', label: 'Moderado' };
    }

    if (r <= 85) {
      return { key: 'high', emoji: '🟠', label: 'Alto / Risco' };
    }

    return {
      key: 'critical',
      emoji: '🔴',
      label: 'Crítico / Nocivo'
    };
  }

  const levelByKey = k => ({
    safe: { emoji: '🟢', label: 'Seguro / Ideal' },
    moderate: { emoji: '🟡', label: 'Moderado' },
    high: { emoji: '🟠', label: 'Alto / Risco' },
    critical: { emoji: '🔴', label: 'Crítico / Nocivo' },
  }[k] || { emoji: '⚪', label: '—' });

  let toastT;

  function toast(msg, ms = 2600) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;

    clearTimeout(toastT);

    toastT = setTimeout(() => {
      el.hidden = true;
    }, ms);
  }

  function banner(msg) {
    $('#banner-text').textContent = msg;
    $('#banner').hidden = false;
  }

  function hideBanner() {
    $('#banner').hidden = true;
  }

  /* ---------- Registros ---------- */
  function load() {
    try {
      const a = JSON.parse(store.get(KEY_REC) || '[]');
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  }

  function save(list) {
    if (!store.set(KEY_REC, JSON.stringify(list))) {
      toast('Não foi possível salvar no armazenamento local.');
    }
  }

  const sorted = () => load().sort((a, b) => b.ts - a.ts);

  const locText = r => (r.lat == null || r.lon == null)
    ? 'Localização indisponível'
    : `${r.lat.toFixed(5)}, ${r.lon.toFixed(5)}` +
      (r.acc != null ? ` (±${Math.round(r.acc)} m)` : '');

  const modeLabel = r => (MODES[r.mode] || MODES.cont).label;

  const NOTE_MAX = 50;

  /* Fotografias locais: uma por registro, armazenadas em IndexedDB. */
  const PHOTO_DB = 'shunfenger.photos.v1';
  const PHOTO_STORE = 'images';
  const photoUrls = new Map();
  let photoDBPromise;

  function openPhotoDB() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB indisponível'));
    if (!photoDBPromise) {
      photoDBPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(PHOTO_DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(PHOTO_STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('Banco de fotos bloqueado'));
      }).catch(e => { photoDBPromise = null; throw e; });
    }
    return photoDBPromise;
  }

  async function photoOperation(mode, operation) {
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, mode);
      const req = operation(tx.objectStore(PHOTO_STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onabort = () => reject(tx.error || new Error('Falha no armazenamento'));
    });
  }
  const getPhoto = id => photoOperation('readonly', s => s.get(id));
  const putPhoto = (id, blob) => photoOperation('readwrite', s => s.put(blob, id));
  const deletePhoto = id => photoOperation('readwrite', s => s.delete(id));

  function revokePhotoUrls() {
    for (const url of photoUrls.values()) URL.revokeObjectURL(url);
    photoUrls.clear();
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  function dataURLToBlob(value) {
    if (typeof value !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/i.test(value)) {
      throw new Error('Formato de fotografia inválido');
    }
    const [header, encoded] = value.split(',');
    const bytes = atob(encoded);
    if (bytes.length > 2_000_000) throw new Error('Fotografia muito grande');
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: header.slice(5).split(';')[0] });
  }

  async function compressPhoto(file) {
    if (!file.type.startsWith('image/')) throw new Error('Selecione uma imagem');
    if (file.size > 25 * 1024 * 1024) throw new Error('Imagem original maior que 25 MB');
    const url = URL.createObjectURL(file);
    let image;
    try {
      image = new Image();
      image.src = url;
      await image.decode();
      const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Processamento de imagem indisponível');
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.78));
      if (!blob) throw new Error('Não foi possível comprimir a fotografia');
      return blob;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function loadPhotoPreviews() {
    const cards = [...$$('[data-photo-preview]')];
    await Promise.all(cards.map(async card => {
      const id = card.dataset.photoPreview;
      try {
        const blob = await getPhoto(id);
        if (!blob || !card.isConnected) return;
        const url = URL.createObjectURL(blob);
        if (!card.isConnected) { URL.revokeObjectURL(url); return; }
        photoUrls.set(id, url);
        card.innerHTML = `<button class="rec-photo-open" data-photo-open="${esc(id)}" aria-label="Ampliar fotografia"><img src="${url}" alt="Fonte do ruído fotografada" loading="lazy"></button>
          <div class="rec-photo-actions"><button data-photo-add="${esc(id)}" type="button">📷 Trocar foto</button><button data-photo-remove="${esc(id)}" type="button">Remover foto</button></div>`;
      } catch { /* Sem prévia quando o armazenamento estiver indisponível. */ }
    }));
  }

  const noteText = r =>
    String(r.note || '').trim().slice(0, NOTE_MAX);

  /* ---------- Tema ---------- */
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;

    const m = $('meta[name="theme-color"]');

    if (m) {
      m.content = t === 'dark' ? '#000000' : '#ffffff';
    }
  }

  function toggleTheme() {
    const t = document.documentElement.dataset.theme === 'dark'
      ? 'light'
      : 'dark';

    applyTheme(t);
    store.set(KEY_THEME, t);
  }

  /* ---------- Navegação ---------- */
  function show(view) {
    $('#view-main').hidden = view !== 'main';
    $('#view-history').hidden = view !== 'history';

    $$('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.go === view);
    });

    $('#app').dataset.view = view;

    if (view === 'history') {
      renderHistory();
    }
  }

  function renderHistory() {
    revokePhotoUrls();
    const list = sorted();
    $('#hist-count').textContent = `${list.length} ${list.length === 1 ? 'registro' : 'registros'}`;
    const badge = $('#tab-badge');
    badge.textContent = list.length;
    badge.hidden = list.length === 0;
    const box = $('#history-list');
    if (!list.length) {
      box.innerHTML = '<div class="empty"><span>🎧</span>Nenhuma medição salva ainda.<br>Faça uma medição para vê-la aqui.</div>';
      return;
    }
    const fmtDb = v => Number.isFinite(v) ? `${Number(v).toFixed(1)} dB` : '—';
    box.innerHTML = list.map(r => {
      const lv = levelByKey(r.level);
      return `<article class="rec">
        <div class="rec-heading"><strong>Registro de medição</strong><span class="rec-level">${lv.emoji} ${esc(lv.label)}</span></div>
        <div class="rec-primary"><div><b>${esc(Number(r.value).toFixed(1))}</b><small>dB · Nível registrado</small></div>
          <button class="rec-del" data-del="${esc(r.id)}" aria-label="Excluir registro" title="Excluir registro">🗑</button></div>
        <div class="rec-stats">
          <div><small>MÍNIMO</small><b>${esc(fmtDb(r.min))}</b></div>
          <div><small>MÉDIO</small><b>${esc(fmtDb(r.avg ?? r.value))}</b></div>
          <div><small>MÁXIMO</small><b>${esc(fmtDb(r.max))}</b></div>
        </div>
        <div class="rec-details">
          <div>🗓 <strong>${esc(fmtDate(r.ts))}</strong><small>Duração: ${esc(r.duration ?? '—')} s · ${esc(modeLabel(r))}</small></div>
          <div>📍 <strong>Geolocalização</strong><small>${esc(locText(r))}</small></div>
        </div>
        <label class="rec-note"><span>📝 Observação</span><span class="rec-note-input">
          <input type="text" maxlength="${NOTE_MAX}" data-note="${esc(r.id)}" value="${esc(r.note || '')}" placeholder="Observação (até ${NOTE_MAX} caracteres)" aria-label="Observação do registro" enterkeyhint="done" autocomplete="off">
          <span class="note-count">${String(r.note || '').length}/${NOTE_MAX}</span></span></label>
        <button class="rec-share" type="button" data-share="${esc(r.id)}">↗ Compartilhar medição</button>
        <div class="rec-photo-section"><strong>📷 Fotografia da fonte do ruído</strong>
          <div class="rec-photo-preview" data-photo-preview="${esc(r.id)}">
            <button class="rec-photo-add" type="button" data-photo-add="${esc(r.id)}">📷 Adicionar fotografia</button>
          </div>
        </div>
      </article>`;
    }).join('');
    loadPhotoPreviews();
  }

  /* ---------- Visor ---------- */
  function setDisplay(db, stats) {
    const lv = classify(db);

    $('#value').textContent = db.toFixed(1);

    $('#bar-fill').style.width =
      Math.max(0, Math.min(100, db / MAX_DB * 100)) + '%';

    $('#level-emoji').textContent = lv.emoji;
    $('#level-text').textContent = lv.label;
    $('#meter').dataset.level = lv.key;

    if (stats) {
      $('#st-min').textContent =
        Number.isFinite(stats.min) ? stats.min.toFixed(1) : '--';

      $('#st-avg').textContent = stats.avg.toFixed(1);
      $('#st-max').textContent = stats.max.toFixed(1);
    }
  }

  function resetDisplay() {
    $('#value').textContent = '--.-';
    $('#bar-fill').style.width = '0%';
    $('#level-emoji').textContent = '🎧';
    $('#level-text').textContent = 'Pronto para medir';
    $('#meter').dataset.level = 'idle';

    ['#st-min', '#st-avg', '#st-max'].forEach(s => {
      $(s).textContent = '--';
    });

    $('#meter-timer').textContent = '00:00';
    $('#progress').hidden = true;
    $('#progress-fill').style.width = '0%';
  }

  function setMode(m) {
    if (S.running) return;

    S.mode = m;

    $$('.mode').forEach(b => {
      const on = b.dataset.mode === m;

      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', String(on));
    });

    $('#meter-mode-label').textContent = MODES[m].label;
  }

  function setRunningUI(running) {
    const b = $('#btn-main');

    b.classList.toggle('running', running);

    $('#btn-main-label').textContent =
      running ? 'Parar e salvar' : 'Iniciar medição';

    $$('.mode').forEach(x => {
      x.disabled = running;
    });
  }

  /* ---------- Geolocalização (real) ---------- */
  function getLocation() {
    return new Promise(resolve => {
      if (!('geolocation' in navigator)) {
        return resolve({ err: 'unsupported' });
      }

      navigator.geolocation.getCurrentPosition(
        p => resolve({
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          acc: p.coords.accuracy
        }),
        e => resolve({
          err: e.code === 1
            ? 'denied'
            : (e.code === 3 ? 'timeout' : 'unavailable')
        }),
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 30000
        }
      );
    });
  }

  function locWarning(err) {
    const msgs = {
      denied: 'Permissão de localização negada. A medição continua, mas o registro ficará sem Lat/Lon. Para ativar: ícone de cadeado na barra de endereço › Permissões › Localização.',
      unsupported: 'Este navegador não oferece geolocalização. Os registros ficarão sem Lat/Lon.',
      timeout: 'Não foi possível obter a localização a tempo. Verifique se o GPS está ligado.',
      unavailable: 'Localização indisponível no momento. Verifique se o GPS está ligado.',
    };

    banner(msgs[err] || msgs.unavailable);
  }

  /* ---------- Áudio / medição (real) ---------- */
  async function lockScreen() {
    try {
      if ('wakeLock' in navigator) {
        S.wake = await navigator.wakeLock.request('screen');
      }
    } catch {
      /* ignore */
    }
  }

  function unlockScreen() {
    try {
      S.wake && S.wake.release();
    } catch {
      /* ignore */
    }

    S.wake = null;
  }

  function micError(e) {
    const n = e && e.name;

    if (n === 'NotAllowedError' || n === 'SecurityError') {
      return 'Acesso ao microfone negado. Toque no cadeado ao lado do endereço › Permissões › Microfone › Permitir e tente novamente.';
    }

    if (n === 'NotFoundError' || n === 'OverconstrainedError') {
      return 'Nenhum microfone foi encontrado neste dispositivo.';
    }

    if (n === 'NotReadableError') {
      return 'O microfone está em uso por outro aplicativo. Feche-o e tente novamente.';
    }

    return 'Não foi possível acessar o microfone (' +
      (n || 'erro desconhecido') + ').';
  }

  async function start() {
    if (S.running || S.saving) return;

    hideBanner();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      banner('Este navegador não suporta captura de áudio, ou a página não está em HTTPS.');
      return;
    }

    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1
        },
      });
    } catch (e) {
      banner(micError(e));
      return;
    }

    try {
      const AC = window.AudioContext || window.webkitAudioContext;

      S.ctx = new AC();
      await S.ctx.resume();

      const src = S.ctx.createMediaStreamSource(stream);

      S.analyser = S.ctx.createAnalyser();
      S.analyser.fftSize = 2048;
      S.analyser.smoothingTimeConstant = 0;

      src.connect(S.analyser);

      S.buf = new Float32Array(S.analyser.fftSize);
      S.stream = stream;
    } catch (e) {
      stream.getTracks().forEach(t => t.stop());
      banner('Falha ao iniciar o processamento de áudio.');
      return;
    }

    S.locPromise = getLocation();

    S.locPromise.then(r => {
      if (r.err) locWarning(r.err);
    });

    S.acc = {
      sum: 0,
      n: 0,
      min: Infinity,
      max: -Infinity,
      last: 0
    };

    S.smooth = 0;
    S.startTs = Date.now();
    S.t0 = performance.now();
    S.running = true;

    setRunningUI(true);
    lockScreen();

    $('#progress').hidden = MODES[S.mode].sec === 0;

    S.timer = setInterval(tick, TICK_MS);
    tick();
  }

  function tick() {
    if (!S.running) return;

    S.analyser.getFloatTimeDomainData(S.buf);

    let sq = 0;

    for (let i = 0; i < S.buf.length; i++) {
      sq += S.buf[i] * S.buf[i];
    }

    const rms = Math.sqrt(sq / S.buf.length);
    const dbfs = 20 * Math.log10(Math.max(rms, 1e-9));

    const inst = Math.max(0, Math.min(140, dbfs + cal));

    // Suavização por energia (aprox. ponderação temporal "Fast")
    const e = Math.pow(10, inst / 10);

    S.smooth = S.smooth
      ? 0.4 * e + 0.6 * S.smooth
      : e;

    const db = 10 * Math.log10(S.smooth);

    const a = S.acc;

    a.sum += S.smooth;
    a.n++;
    a.last = db;

    // CORREÇÃO DO INDICADOR MÍNIMO:
    // Leituras zeradas não são consideradas valores mínimos válidos.
    if (db > 0 && db < a.min) {
      a.min = db;
    }

    if (db > a.max) {
      a.max = db;
    }

    const avg = 10 * Math.log10(a.sum / a.n);

    setDisplay(db, {
      min: a.min,
      avg,
      max: a.max
    });

    const elapsed = (performance.now() - S.t0) / 1000;
    const dur = MODES[S.mode].sec;

    if (dur) {
      const left = Math.max(0, Math.ceil(dur - elapsed));

      $('#meter-timer').textContent = `Restam ${left} s`;

      $('#progress-fill').style.width =
        Math.min(100, elapsed / dur * 100) + '%';

      if (elapsed >= dur) {
        stop();

      }
    } else {
      const seconds = Math.floor(elapsed);
      $('#meter-timer').textContent =
        `${pad2(Math.floor(seconds / 60))}:${pad2(seconds % 60)}`;
    }
  }

  async function releaseAudio() {
    clearInterval(S.timer);
    S.timer = null;

    if (S.stream) {
      S.stream.getTracks().forEach(track => track.stop());
      S.stream = null;
    }

    if (S.ctx) {
      try {
        await S.ctx.close();
      } catch {
        /* Contexto já encerrado. */
      }
      S.ctx = null;
    }

    S.analyser = null;
    S.buf = null;
    unlockScreen();
  }

  async function stop() {
    if (!S.running || S.saving) return;

    S.running = false;
    S.saving = true;

    clearInterval(S.timer);
    S.timer = null;

    $('#btn-main').disabled = true;
    $('#btn-main-label').textContent = 'Salvando medição...';

    const elapsed = Math.max(
      0,
      (performance.now() - S.t0) / 1000
    );

    const a = S.acc;

    await releaseAudio();

    if (!a || !a.n) {
      S.saving = false;
      $('#btn-main').disabled = false;
      setRunningUI(false);
      resetDisplay();
      toast('Nenhuma leitura válida foi registrada.');
      return;
    }

    const avg = 10 * Math.log10(a.sum / a.n);

    const min = Number.isFinite(a.min)
      ? a.min
      : 0;

    const max = Number.isFinite(a.max)
      ? a.max
      : 0;

    let location = {};

    try {
      if (S.locPromise) {
        const result = await S.locPromise;

        if (result && !result.err) {
          location = {
            lat: result.lat,
            lon: result.lon,
            acc: result.acc
          };
        }
      }
    } catch {
      /* Registro permanece sem localização. */
    }

    const record = {
      id: uid(),
      ts: S.startTs,
      mode: S.mode,
      duration: round1(elapsed),
      value: round1(a.last),
      min: round1(min),
      avg: round1(avg),
      max: round1(max),
      level: classify(a.last).key,
      note: '',
      ...location
    };

    const records = load();
    records.push(record);
    save(records);

    S.saving = false;
    S.acc = null;
    S.locPromise = null;

    $('#btn-main').disabled = false;
    setRunningUI(false);

    $('#meter-timer').textContent =
      `${pad2(Math.floor(elapsed / 60))}:${pad2(Math.floor(elapsed % 60))}`;

    $('#progress').hidden = true;

    toast('Medição salva no histórico.');
    show('history');
  }

  /* ---------- Downloads ---------- */

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function downloadText(text, filename, type = 'text/plain') {
    downloadBlob(
      new Blob([text], {
        type: `${type};charset=utf-8`
      }),
      filename
    );
  }

  const dateStamp = () =>
    new Date().toISOString().slice(0, 10);

  function recordLine(r) {
    const lv = levelByKey(r.level);

    return [
      fmtDate(r.ts),
      modeLabel(r),
      `${r.duration ?? '—'} s`,
      `${r.value ?? '—'} dB`,
      `${r.min ?? '—'} dB`,
      `${r.avg ?? '—'} dB`,
      `${r.max ?? '—'} dB`,
      lv.label,
      locText(r),
      noteText(r)
    ];
  }

  /* ---------- Exportação JSON com fotografias ---------- */

  async function exportJSON() {
    const records = sorted();
    const photos = {};

    for (const r of records) {
      try {
        const blob = await getPhoto(r.id);

        if (blob) {
          photos[r.id] = await blobToDataURL(blob);
        }
      } catch {
        /* Fotografias indisponíveis não impedem backup dos dados. */
      }
    }

    const payload = {
      app: APP_NAME,
      version: 2,
      exportedAt: new Date().toISOString(),
      calibration: cal,
      records,
      photos
    };

    downloadText(
      JSON.stringify(payload, null, 2),
      `shunfenger-backup-${dateStamp()}.json`,
      'application/json'
    );

    toast('Backup JSON gerado.');
  }

  /* ---------- Exportação Markdown ---------- */

  function exportMarkdown() {
    const records = sorted();

    const lines = [
      '# Shunfenger Sound Level Meter',
      '',
      `Exportado em: ${fmtDate(Date.now())}`,
      '',
      DISCLAIMER,
      '',
      '## Medições',
      ''
    ];

    if (!records.length) {
      lines.push('Nenhuma medição registrada.');
    }

    for (const [index, r] of records.entries()) {
      const lv = levelByKey(r.level);

      lines.push(
        `### ${index + 1}. ${fmtDate(r.ts)}`,
        '',
        `- **Nível registrado:** ${r.value} dB`,
        `- **Mínimo:** ${r.min} dB`,
        `- **Médio:** ${r.avg} dB`,
        `- **Máximo:** ${r.max} dB`,
        `- **Classificação:** ${lv.label}`,
        `- **Modo:** ${modeLabel(r)}`,
        `- **Duração:** ${r.duration ?? '—'} s`,
        `- **Localização:** ${locText(r)}`,
        `- **Observação:** ${noteText(r) || '—'}`,
        ''
      );
    }

    downloadText(
      lines.join('\n'),
      `shunfenger-medicoes-${dateStamp()}.md`,
      'text/markdown'
    );

    toast('Arquivo Markdown gerado.');
  }

  /* ---------- Exportação TXT ---------- */

  function exportTXT() {
    const records = sorted();

    const lines = [
      APP_NAME,
      '='.repeat(APP_NAME.length),
      '',
      `Exportado em: ${fmtDate(Date.now())}`,
      DISCLAIMER,
      ''
    ];

    if (!records.length) {
      lines.push('Nenhuma medição registrada.');
    }

    records.forEach((r, index) => {
      const lv = levelByKey(r.level);

      lines.push(
        `REGISTRO ${index + 1}`,
        '-'.repeat(42),
        `Data: ${fmtDate(r.ts)}`,
        `Nível registrado: ${r.value} dB`,
        `Mínimo: ${r.min} dB`,
        `Médio: ${r.avg} dB`,
        `Máximo: ${r.max} dB`,
        `Classificação: ${lv.label}`,
        `Modo: ${modeLabel(r)}`,
        `Duração: ${r.duration ?? '—'} s`,
        `Localização: ${locText(r)}`,
        `Observação: ${noteText(r) || '—'}`,
        ''
      );
    });

    downloadText(
      lines.join('\n'),
      `shunfenger-medicoes-${dateStamp()}.txt`
    );

    toast('Arquivo TXT gerado.');
  }

  /* ---------- Utilitários para DOCX ---------- */

  function xmlEscape(value) {
    return String(value ?? '').replace(/[<>&"']/g, c => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;'
    }[c]));
  }

  const encoder = new TextEncoder();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;

    for (let i = 0; i < bytes.length; i++) {
      crc ^= bytes[i];

      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^
          (crc & 1 ? 0xEDB88320 : 0);
      }
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /* ---------- Arquivos ZIP sem bibliotecas externas ---------- */

  function zipStore(files) {
    const parts = [];
    const directory = [];
    let offset = 0;

    function u16(v) {
      return Uint8Array.of(v & 255, (v >>> 8) & 255);
    }

    function u32(v) {
      return Uint8Array.of(
        v & 255,
        (v >>> 8) & 255,
        (v >>> 16) & 255,
        (v >>> 24) & 255
      );
    }

    function concat(chunks) {
      const length = chunks.reduce((n, b) => n + b.length, 0);
      const result = new Uint8Array(length);
      let pos = 0;

      for (const chunk of chunks) {
        result.set(chunk, pos);
        pos += chunk.length;
      }

      return result;
    }

    for (const [filename, content] of Object.entries(files)) {
      const name = encoder.encode(filename);
      const data = content instanceof Uint8Array
        ? content
        : encoder.encode(String(content));

      const crc = crc32(data);

      const local = concat([
        u32(0x04034b50),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        name,
        data
      ]);

      parts.push(local);

      directory.push(concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name
      ]));

      offset += local.length;
    }

    const central = concat(directory);

    const end = concat([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(directory.length),
      u16(directory.length),
      u32(central.length),
      u32(offset),
      u16(0)
    ]);

    return new Blob(
      [...parts, central, end],
      { type: 'application/zip' }
    );
  }

  /* ---------- Exportação DOCX ---------- */

  function exportDOCX() {
    const records = sorted();

    const paragraph = (text, bold = false) => {
      const value = xmlEscape(text);

      return `<w:p><w:r>${bold ? '<w:rPr><w:b/></w:rPr>' : ''}` +
        `<w:t xml:space="preserve">${value}</w:t>` +
        `</w:r></w:p>`;
    };

    const body = [
      paragraph(APP_NAME, true),
      paragraph(`Relatório gerado em ${fmtDate(Date.now())}`),
      paragraph(DISCLAIMER),
      paragraph('')
    ];

    if (!records.length) {
      body.push(paragraph('Nenhuma medição registrada.'));
    }

    records.forEach((r, index) => {
      const lv = levelByKey(r.level);

      body.push(
        paragraph(`Medição ${index + 1} — ${fmtDate(r.ts)}`, true),
        paragraph(`Nível registrado: ${r.value} dB`),
        paragraph(`Mínimo: ${r.min} dB`),
        paragraph(`Médio: ${r.avg} dB`),
        paragraph(`Máximo: ${r.max} dB`),
        paragraph(`Classificação: ${lv.label}`),
        paragraph(`Modo: ${modeLabel(r)}`),
        paragraph(`Duração: ${r.duration ?? '—'} s`),
        paragraph(`Localização: ${locText(r)}`),
        paragraph(`Observação: ${noteText(r) || '—'}`),
        paragraph('')
      );
    });

    const documentXML =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
      `<w:body>${body.join('')}` +
      `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>` +
      `<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>` +
      `</w:sectPr></w:body></w:document>`;

    const files = {
      '[Content_Types].xml':
        `<?xml version="1.0" encoding="UTF-8"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
        `</Types>`,

      '_rels/.rels':
        `<?xml version="1.0" encoding="UTF-8"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" ` +
        `Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" ` +
        `Target="word/document.xml"/>` +
        `</Relationships>`,

      'word/document.xml': documentXML
    };

    const blob = zipStore(files);

    downloadBlob(
      new Blob([blob], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }),
      `shunfenger-medicoes-${dateStamp()}.docx`
    );

    toast('Documento DOCX gerado.');
  }

  /* ---------- Impressão com fotografias ---------- */

  async function printReport() {
    const records = sorted();

    if (!records.length) {
      toast('Não há registros para imprimir.');
      return;
    }

    const report = $('#print-report');

    const parts = [
      `<h1>${esc(APP_NAME)}</h1>`,
      `<p class="meta">Relatório gerado em ${esc(fmtDate(Date.now()))}</p>`
    ];

    for (const [index, r] of records.entries()) {
      const lv = levelByKey(r.level);

      parts.push(
        `<article class="print-record">`,
        `<h2>Medição ${index + 1} — ${esc(fmtDate(r.ts))}</h2>`,
        `<p><strong>Nível registrado:</strong> ${esc(r.value)} dB</p>`,
        `<p><strong>Mínimo:</strong> ${esc(r.min)} dB</p>`,
        `<p><strong>Médio:</strong> ${esc(r.avg)} dB</p>`,
        `<p><strong>Máximo:</strong> ${esc(r.max)} dB</p>`,
        `<p><strong>Classificação:</strong> ${esc(lv.label)}</p>`,
        `<p><strong>Modo:</strong> ${esc(modeLabel(r))}</p>`,
        `<p><strong>Duração:</strong> ${esc(r.duration ?? '—')} s</p>`,
        `<p><strong>Localização:</strong> ${esc(locText(r))}</p>`,
        `<p><strong>Observação:</strong> ${esc(noteText(r) || '—')}</p>`
      );

      try {
        const blob = await getPhoto(r.id);

        if (blob) {
          const dataURL = await blobToDataURL(blob);

          parts.push(
            `<img class="print-photo" src="${dataURL}" ` +
            `alt="Fotografia da fonte do ruído">`
          );
        }
      } catch {
        /* Imprime o registro mesmo sem a fotografia. */
      }

      parts.push('</article>');
    }

    parts.push(
      `<p class="note">${esc(DISCLAIMER)}</p>`
    );

    report.innerHTML = parts.join('');
    report.hidden = false;

    // Aguarda a decodificação das fotografias.
    const images = [...report.querySelectorAll('img')];

    await Promise.all(
      images.map(img =>
        img.decode().catch(() => {})
      )
    );

    window.print();
  }

  /* ---------- Importação de backup JSON ---------- */

  async function importJSON(file) {
    if (!file) return;

    if (file.size > 60 * 1024 * 1024) {
      toast('O arquivo JSON excede o limite de 60 MB.');
      return;
    }

    let payload;

    try {
      payload = JSON.parse(await file.text());
    } catch {
      toast('O arquivo selecionado não contém JSON válido.');
      return;
    }

    const imported = Array.isArray(payload)
      ? payload
      : payload && payload.records;

    if (!Array.isArray(imported)) {
      toast('Backup inválido: lista de registros ausente.');
      return;
    }

    if (imported.length > 10000) {
      toast('O backup contém registros demais.');
      return;
    }

    const valid = imported.every(r =>
      r &&
      typeof r === 'object' &&
      typeof r.id === 'string' &&
      r.id.length > 0 &&
      r.id.length <= 100 &&
      Number.isFinite(Number(r.ts)) &&
      Number.isFinite(Number(r.value))
    );

    if (!valid) {
      toast('O backup contém registros inválidos.');
      return;
    }

    const photos = payload && !Array.isArray(payload)
      ? payload.photos || {}
      : {};

    if (!photos || typeof photos !== 'object' || Array.isArray(photos)) {
      toast('A estrutura de fotografias do backup é inválida.');
      return;
    }

    const existing = load();

    const shouldReplace = confirm(
      `O backup contém ${imported.length} registro(s).\n\n` +
      'OK: substituir o histórico atual.\n' +
      'Cancelar: manter os registros atuais e importar somente os novos.'
    );

    const finalRecords = shouldReplace
      ? [...imported]
      : [...existing];

    if (!shouldReplace) {
      const ids = new Set(existing.map(r => r.id));

      for (const record of imported) {
        if (!ids.has(record.id)) {
          finalRecords.push(record);
          ids.add(record.id);
        }
      }
    }

    const previousIds = new Set(existing.map(r => r.id));
    const importedIds = new Set(imported.map(r => r.id));
    const finalIds = new Set(finalRecords.map(r => r.id));

    // Prepara as fotografias antes de alterar o histórico.
    const photoEntries = [];

    try {
      for (const [id, value] of Object.entries(photos)) {
        if (!importedIds.has(id) || !finalIds.has(id)) continue;

        if (!shouldReplace && previousIds.has(id)) {
          continue;
        }

        photoEntries.push([id, dataURLToBlob(value)]);
      }
    } catch (error) {
      toast('Fotografia inválida no backup: ' + error.message);
      return;
    }

    // Verifica o armazenamento de imagens antes da importação.
    if (photoEntries.length) {
      try {
        await openPhotoDB();
      } catch {
        toast('Não foi possível abrir o banco de fotografias.');
        return;
      }
    }

    // Grava as fotografias incluídas no backup.
    try {
      for (const [id, blob] of photoEntries) {
        await putPhoto(id, blob);
      }
    } catch {
      toast('Falha ao restaurar fotografias. Importação interrompida.');
      return;
    }

    if (shouldReplace) {
      // Remove fotografias dos registros que deixarão de existir.
      for (const old of existing) {
        if (!finalIds.has(old.id)) {
          try {
            await deletePhoto(old.id);
          } catch {
            /* A limpeza poderá ser repetida posteriormente. */
          }
        }
      }
    }

    save(finalRecords);

    if (
      payload &&
      !Array.isArray(payload) &&
      Number.isFinite(Number(payload.calibration))
    ) {
      cal = Number(payload.calibration);
      store.set(KEY_CAL, String(cal));
    }

    renderHistory();

    toast(
      `Importação concluída: ${imported.length} registro(s) no backup.`
    );
  }

  /* ---------- Fotografias dos registros ---------- */

  let pendingPhotoId = null;

  function selectPhoto(id) {
    if (!load().some(r => r.id === id)) {
      toast('Registro não encontrado.');
      return;
    }

    pendingPhotoId = id;

    const input = $('#photo-input');
    input.value = '';
    input.click();
  }

  async function handlePhotoSelection(file) {
    const id = pendingPhotoId;
    pendingPhotoId = null;

    if (!file || !id) return;

    if (!load().some(r => r.id === id)) {
      toast('O registro não existe mais.');
      return;
    }

    try {
      toast('Processando fotografia...');

      const blob = await compressPhoto(file);

      await putPhoto(id, blob);

      renderHistory();

      toast('Fotografia salva no registro.');
    } catch (error) {
      toast(
        'Não foi possível salvar a fotografia: ' +
        (error.message || 'erro desconhecido')
      );
    }
  }

  async function removePhoto(id) {
    if (!confirm('Remover a fotografia deste registro?')) {
      return;
    }

    try {
      await deletePhoto(id);

      renderHistory();

      toast('Fotografia removida.');
    } catch {
      toast('Não foi possível remover a fotografia.');
    }
  }

  async function showPhoto(id) {
    try {
      const blob = await getPhoto(id);

      if (!blob) {
        toast('Fotografia não encontrada.');
        return;
      }

      const img = $('#photo-full');
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
      };

      img.src = url;

      openModal('photo');
    } catch {
      toast('Não foi possível abrir a fotografia.');
    }
  }

  /* ---------- Gerenciamento de registros ---------- */

  async function deleteRecord(id) {
    if (!confirm('Excluir esta medição e sua fotografia?')) {
      return;
    }

    const records = load();

    if (!records.some(r => r.id === id)) {
      toast('Registro não encontrado.');
      return;
    }

    save(records.filter(r => r.id !== id));

    try {
      await deletePhoto(id);
    } catch {
      /* O registro já foi excluído. */
    }

    renderHistory();

    toast('Registro excluído.');
  }

  async function clearHistory() {
    const records = load();

    if (!records.length) {
      toast('O histórico já está vazio.');
      return;
    }

    if (!confirm(
      `Excluir permanentemente ${records.length} medição(ões) e suas fotografias?`
    )) {
      return;
    }

    save([]);

    for (const r of records) {
      try {
        await deletePhoto(r.id);
      } catch {
        /* Continua removendo as demais fotografias. */
      }
    }

    renderHistory();

    toast('Histórico apagado.');
  }

  /* ---------- Modais ---------- */

  function openModal(name) {
    const modal = $(`#modal-${name}`);

    if (!modal) return;

    modal.hidden = false;

    if (name === 'about') {
      $('#cal-input').value = cal;
    }
  }

  function closeModals() {
    $$('.modal').forEach(modal => {
      modal.hidden = true;
    });
  }

  /* ---------- Texto para compartilhamento ---------- */

  function shareText(record, includeLocation = false) {
    const lv = levelByKey(record.level);

    const lines = [
      '🔊 Medição de ruído — Shunfenger',
      '',
      `Nível registrado: ${Number(record.value).toFixed(1)} dB`,
      `Mínimo: ${Number(record.min).toFixed(1)} dB`,
      `Médio: ${Number(record.avg ?? record.value).toFixed(1)} dB`,
      `Máximo: ${Number(record.max).toFixed(1)} dB`,
      `Classificação: ${lv.label}`,
      `Data: ${fmtDate(record.ts)}`,
      `Duração: ${record.duration ?? '—'} s`,
      `Modo: ${modeLabel(record)}`
    ];

    if (includeLocation && record.lat != null && record.lon != null) {
      lines.push(`Localização: ${locText(record)}`);
    }

    if (noteText(record)) {
      lines.push(`Observação: ${noteText(record)}`);
    }

    lines.push(
      '',
      '📲 Meça o ruído ao seu redor!',
      'Instale gratuitamente o Shunfenger:',
      OFFICIAL_URL,
      '',
      DISCLAIMER
    );

    return lines.join('\n');
  }

  /* ---------- Estado do compartilhamento ---------- */

  const SHARE_W = 1080;
  const SHARE_H = 1350;

  let sharingRecordId = null;
  let sharingBlob = null;
  let sharingPreviewUrl = null;
  let sharingGeneration = 0;

  function releaseSharePreview() {
    if (sharingPreviewUrl) {
      URL.revokeObjectURL(sharingPreviewUrl);
      sharingPreviewUrl = null;
    }

    const img = $('#share-preview');

    if (img) {
      img.removeAttribute('src');
    }
  }

  function getSharingRecord() {
    if (!sharingRecordId) return null;

    return load().find(r => r.id === sharingRecordId) || null;
  }

  /* ---------- Desenho do cartão compartilhável ---------- */

  function roundedRect(ctx, x, y, w, h, radius, fill) {
    const r = Math.min(radius, w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.closePath();

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    for (const word of words) {
      const candidate = current ? current + ' ' + word : word;

      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);

    const visible = lines.slice(0, maxLines);

    visible.forEach((line, i) => {
      let output = line;

      if (i === maxLines - 1 && lines.length > maxLines) {
        while (
          output.length &&
          ctx.measureText(output + '…').width > maxWidth
        ) {
          output = output.slice(0, -1);
        }

        output += '…';
      }

      ctx.fillText(output, x, y + i * lineHeight);
    });

    return y + visible.length * lineHeight;
  }

  async function blobToImage(blob) {
    const url = URL.createObjectURL(blob);

    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => blob
          ? resolve(blob)
          : reject(new Error('Não foi possível gerar a imagem')),
        'image/png'
      );
    });
  }

  async function generateShareCard(record, includeLocation) {
    const canvas = document.createElement('canvas');
    canvas.width = SHARE_W;
    canvas.height = SHARE_H;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas indisponível');
    }

    const W = SHARE_W;
    const H = SHARE_H;

    const purple = '#873ff3';
    const lilac = '#B487F7';
    const white = '#ffffff';
    const muted = '#cdbbe8';

    /* Fundo */
    ctx.fillStyle = '#101014';
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(
      W / 2, 100, 20,
      W / 2, 100, 750
    );

    glow.addColorStop(0, '#352044');
    glow.addColorStop(1, '#101014');

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 650);

    /* Cabeçalho */
    roundedRect(ctx, 56, 54, 98, 98, 24, purple);

    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.arc(90, 103, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = white;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    for (const radius of [22, 37, 52]) {
      ctx.beginPath();
      ctx.arc(89, 103, radius, -0.75, 0.75);
      ctx.stroke();
    }

    ctx.fillStyle = white;
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillText('SHUNFENGER', 174, 103);

    ctx.fillStyle = muted;
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('SOUND LEVEL METER', 177, 140);

    ctx.textAlign = 'right';
    ctx.fillStyle = muted;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('RELATÓRIO DE MEDIÇÃO', W - 55, 92);
    ctx.textAlign = 'left';

    /* Painel principal */
    roundedRect(ctx, 52, 190, 976, 345, 35, '#24172f');

    ctx.textAlign = 'center';
    ctx.fillStyle = muted;
    ctx.font = 'bold 25px system-ui, sans-serif';
    ctx.fillText('NÍVEL SONORO REGISTRADO', W / 2, 245);

    ctx.fillStyle = lilac;
    ctx.font = 'bold 134px system-ui, sans-serif';
    ctx.fillText(
      Number(record.value).toFixed(1),
      W / 2 - 48,
      385
    );

    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.fillText('dB', W / 2 + 205, 383);

    const level = levelByKey(record.level);

    ctx.fillStyle = white;
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText(level.label, W / 2, 438);

    ctx.strokeStyle = '#493159';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(95, 460);
    ctx.lineTo(985, 460);
    ctx.stroke();

    const stats = [
      ['MÍNIMO', record.min],
      ['MÉDIO', record.avg ?? record.value],
      ['MÁXIMO', record.max]
    ];

    stats.forEach(([label, value], i) => {
      const x = 225 + i * 315;

      ctx.fillStyle = muted;
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(label, x, 488);

      ctx.fillStyle = white;
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillText(
        Number.isFinite(Number(value))
          ? Number(value).toFixed(1)
          : '—',
        x,
        525
      );
    });

    ctx.textAlign = 'left';

    /* Fotografia opcional */
    let y = 565;
    let hasPhoto = false;

    try {
      const photo = await getPhoto(record.id);

      if (photo) {
        const img = await blobToImage(photo);

        const boxX = 52;
        const boxY = y;
        const boxW = 976;
        const boxH = 400;

        ctx.save();
        roundedRect(ctx, boxX, boxY, boxW, boxH, 28);
        ctx.clip();

        ctx.fillStyle = '#201827';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        const scale = Math.min(
          boxW / img.naturalWidth,
          boxH / img.naturalHeight
        );

        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;

        ctx.drawImage(
          img,
          boxX + (boxW - dw) / 2,
          boxY + (boxH - dh) / 2,
          dw,
          dh
        );

        ctx.restore();

        hasPhoto = true;
        y += 425;
      }
    } catch {
      /* O cartão permanece válido sem fotografia. */
    }

    /* Informações complementares */
    roundedRect(
      ctx,
      52,
      y,
      976,
      hasPhoto ? 177 : 285,
      25,
      '#201827'
    );

    ctx.fillStyle = white;
    ctx.font = 'bold 25px system-ui, sans-serif';
    ctx.fillText(
      `Data: ${fmtDate(record.ts)}`,
      85,
      y + 42
    );

    ctx.font = '23px system-ui, sans-serif';
    ctx.fillStyle = muted;
    ctx.fillText(
      `Modo: ${modeLabel(record)}  |  Duração: ${record.duration ?? '—'} s`,
      85,
      y + 81
    );

    let infoY = y + 120;

    if (
      includeLocation &&
      record.lat != null &&
      record.lon != null
    ) {
      ctx.fillStyle = white;
      ctx.font = '21px system-ui, sans-serif';
      ctx.fillText(
        `GPS: ${locText(record)}`,
        85,
        infoY
      );
      infoY += 35;
    }

    const note = noteText(record);

    if (note) {
      ctx.fillStyle = white;
      ctx.font = '22px system-ui, sans-serif';

      drawWrappedText(
        ctx,
        `Observação: ${note}`,
        85,
        infoY,
        900,
        32,
        hasPhoto ? 2 : 3
      );
    }

    /* Rodapé e chamada para instalação */
    const footerY = 1190;

    roundedRect(
      ctx,
      52,
      footerY,
      976,
      95,
      23,
      purple
    );

    ctx.textAlign = 'center';
    ctx.fillStyle = white;
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText(
      'MEÇA O RUÍDO AO SEU REDOR!',
      W / 2,
      footerY + 39
    );

    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(
      'Instale o Shunfenger gratuitamente',
      W / 2,
      footerY + 74
    );

    ctx.fillStyle = muted;
    ctx.font = '21px system-ui, sans-serif';
    ctx.fillText(
      'magpe-stack.github.io/Shunfenger-Sound-Level-Meter/',
      W / 2,
      1313
    );

    ctx.textAlign = 'left';

    return canvasToBlob(canvas);
  }

  /* ---------- Prévia e compartilhamento ---------- */

  async function updateSharePreview() {
    const record = getSharingRecord();

    if (!record) {
      toast('Registro não encontrado.');
      return;
    }

    const generation = ++sharingGeneration;
    const includeLocation = $('#share-location').checked;

    sharingBlob = null;

    try {
      const blob = await generateShareCard(
        record,
        includeLocation
      );

      if (generation !== sharingGeneration) {
        return;
      }

      releaseSharePreview();

      sharingBlob = blob;
      sharingPreviewUrl = URL.createObjectURL(blob);

      $('#share-preview').src = sharingPreviewUrl;
    } catch (error) {
      toast(
        'Falha ao gerar o cartão: ' +
        (error.message || 'erro desconhecido')
      );
    }
  }

  async function openShare(id) {
    const record = load().find(r => r.id === id);

    if (!record) {
      toast('Registro não encontrado.');
      return;
    }

    sharingRecordId = id;
    sharingBlob = null;

    $('#share-location').checked = false;

    openModal('share');

    await updateSharePreview();
  }

  function shareFilename(record) {
    const date = new Date(record.ts)
      .toISOString()
      .slice(0, 10);

    return `shunfenger-medicao-${date}-${record.id}.png`;
  }

  async function shareNative() {
    const record = getSharingRecord();

    if (!record) {
      toast('Registro não encontrado.');
      return;
    }

    if (!sharingBlob) {
      toast('Aguarde a geração da imagem.');
      return;
    }

    const file = new File(
      [sharingBlob],
      shareFilename(record),
      { type: 'image/png' }
    );

    const text = shareText(
      record,
      $('#share-location').checked
    );

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: APP_NAME,
          text
        });

        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: APP_NAME,
          text,
          url: OFFICIAL_URL
        });

        toast('O navegador compartilhou o texto e o link.');
        return;
      }

      downloadBlob(sharingBlob, shareFilename(record));

      toast('Imagem salva. Compartilhe pelo aplicativo desejado.');
    } catch (error) {
      if (error && error.name === 'AbortError') {
        return;
      }

      toast('Não foi possível compartilhar. Use Salvar imagem.');
    }
  }

  function saveShareImage() {
    const record = getSharingRecord();

    if (!record || !sharingBlob) {
      toast('Aguarde a geração da imagem.');
      return;
    }

    downloadBlob(
      sharingBlob,
      shareFilename(record)
    );

    toast('Imagem gerada para salvar.');
  }

  async function copyShareText() {
    const record = getSharingRecord();

    if (!record) {
      toast('Registro não encontrado.');
      return;
    }

    const text = shareText(
      record,
      $('#share-location').checked
    );

    try {
      await navigator.clipboard.writeText(text);
      toast('Texto e link copiados.');
    } catch {
      toast('Não foi possível copiar automaticamente.');
    }
  }

  /* ---------- Instalação do PWA ---------- */

  function isInstalled() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  function isIOS() {
    return /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
      (
        navigator.platform === 'MacIntel' &&
        navigator.maxTouchPoints > 1
      );
  }

  function isSafari() {
    return /Safari/i.test(navigator.userAgent) &&
      !/Chrome|CriOS|FxiOS|Edg|OPR/i.test(navigator.userAgent);
  }

  function updateInstallUI() {
    const installed = isInstalled();

    const fab = $('#install-fab');
    const menu = $('#li-install');

    if (installed) {
      fab.hidden = true;
      menu.hidden = true;
      return;
    }

    // O botão oferece a instalação nativa quando disponível
    // e instruções nos demais navegadores.
    fab.hidden = false;
    menu.hidden = false;
  }

  function installInstructions() {
    if (isIOS()) {
      return (
        'Para instalar o Shunfenger no iPhone ou iPad:\n\n' +
        '1. Abra o aplicativo no Safari.\n' +
        '2. Toque no botão Compartilhar.\n' +
        '3. Escolha "Adicionar à Tela de Início".\n' +
        '4. Confirme em "Adicionar".\n\n' +
        'O aplicativo aparecerá na Tela de Início.'
      );
    }

    if (isSafari()) {
      return (
        'Abra o menu do Safari e procure a opção de adicionar ' +
        'o aplicativo ao Dock ou à Tela de Início, conforme ' +
        'a versão do sistema operacional.'
      );
    }

    return (
      'Para instalar o Shunfenger:\n\n' +
      '1. Abra o menu do navegador.\n' +
      '2. Procure "Instalar aplicativo" ou ' +
      '"Adicionar à tela inicial".\n' +
      '3. Confirme a instalação.\n\n' +
      'Se a opção não aparecer, o navegador pode não oferecer ' +
      'instalação para esta página ou o aplicativo pode já ' +
      'estar instalado.'
    );
  }

  async function requestInstall() {
    if (isInstalled()) {
      toast('O Shunfenger já está instalado.');
      updateInstallUI();
      return;
    }

    if (S.installEvt) {
      const event = S.installEvt;
      S.installEvt = null;

      try {
        await event.prompt();
        await event.userChoice;
      } catch {
        /* A instalação poderá ser solicitada novamente
           quando o navegador disponibilizar o evento. */
      }

      updateInstallUI();
      return;
    }

    $('#install-instructions').textContent =
      installInstructions();

    $('#install-instructions').style.whiteSpace = 'pre-line';

    openModal('install');
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    S.installEvt = event;
    updateInstallUI();
  });

  window.addEventListener('appinstalled', () => {
    S.installEvt = null;
    updateInstallUI();
    closeModals();
    toast('Shunfenger instalado com sucesso.');
  });

  /* ---------- Eventos gerais ---------- */

  $('#btn-theme').addEventListener('click', toggleTheme);

  $('#banner-close').addEventListener('click', hideBanner);

  $('#btn-file').addEventListener('click', () => {
    openModal('file');
  });

  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      show(tab.dataset.go);
    });
  });

  $$('.mode').forEach(button => {
    button.addEventListener('click', () => {
      setMode(button.dataset.mode);
    });
  });

  $('#btn-main').addEventListener('click', async () => {
    if (S.saving) return;

    if (S.running) {
      await stop();
    } else {
      await start();
    }
  });

  /* ---------- Histórico: ações delegadas ---------- */

  $('#history-list').addEventListener('click', async event => {
    const target = event.target.closest('button');

    if (!target) return;

    if (target.dataset.del) {
      await deleteRecord(target.dataset.del);
      return;
    }

    if (target.dataset.photoAdd) {
      selectPhoto(target.dataset.photoAdd);
      return;
    }

    if (target.dataset.photoRemove) {
      await removePhoto(target.dataset.photoRemove);
      return;
    }

    if (target.dataset.photoOpen) {
      await showPhoto(target.dataset.photoOpen);
      return;
    }

    if (target.dataset.share) {
      await openShare(target.dataset.share);
    }
  });

  $('#history-list').addEventListener('input', event => {
    const input = event.target.closest('[data-note]');

    if (!input) return;

    const counter = input.parentElement.querySelector('.note-count');

    if (counter) {
      counter.textContent = `${input.value.length}/${NOTE_MAX}`;
    }
  });

  $('#history-list').addEventListener('change', event => {
    const input = event.target.closest('[data-note]');

    if (!input) return;

    const records = load();
    const record = records.find(r => r.id === input.dataset.note);

    if (!record) return;

    record.note = input.value.slice(0, NOTE_MAX);
    save(records);

    toast('Observação salva.');
  });

  $('#photo-input').addEventListener('change', async event => {
    const file = event.target.files && event.target.files[0];

    await handlePhotoSelection(file);

    event.target.value = '';
  });

  $('#btn-clear').addEventListener('click', clearHistory);

  /* ---------- Menu Arquivo ---------- */

  $('#modal-file').addEventListener('click', async event => {
    const button = event.target.closest('[data-action]');

    if (!button) return;

    const action = button.dataset.action;

    closeModals();

    switch (action) {
      case 'new':
        if (S.running) {
          await stop();
        }
        resetDisplay();
        show('main');
        break;

      case 'import':
        $('#file-input').value = '';
        $('#file-input').click();
        break;

      case 'json':
        await exportJSON();
        break;

      case 'md':
        exportMarkdown();
        break;

      case 'txt':
        exportTXT();
        break;

      case 'docx':
        exportDOCX();
        break;

      case 'print':
        await printReport();
        break;

      case 'install':
        await requestInstall();
        break;

      case 'about':
        openModal('about');
        break;
    }
  });

  $('#file-input').addEventListener('change', async event => {
    const file = event.target.files && event.target.files[0];

    if (file) {
      await importJSON(file);
    }

    event.target.value = '';
  });

  /* ---------- Compartilhamento ---------- */

  $('#share-location').addEventListener('change', () => {
    updateSharePreview();
  });

  $('#share-native').addEventListener('click', shareNative);

  $('#share-save').addEventListener('click', saveShareImage);

  $('#share-copy').addEventListener('click', copyShareText);

  /* ---------- Instalação ---------- */

  $('#install-fab').addEventListener('click', requestInstall);

  /* ---------- Calibração ---------- */

  $('#cal-save').addEventListener('click', () => {
    const value = Number($('#cal-input').value);

    if (!Number.isFinite(value) || value < -100 || value > 200) {
      toast('Informe um offset entre -100 e 200 dB.');
      return;
    }

    cal = value;
    store.set(KEY_CAL, String(cal));

    toast('Calibração salva.');
  });

  $('#cal-reset').addEventListener('click', () => {
    cal = DEFAULT_CAL;
    store.set(KEY_CAL, String(cal));

    $('#cal-input').value = cal;

    toast('Calibração restaurada.');
  });

  /* ---------- Fechamento dos modais ---------- */

  $$('[data-close]').forEach(button => {
    button.addEventListener('click', () => {
      closeModals();
    });
  });

  $$('.modal').forEach(modal => {
    modal.addEventListener('click', event => {
      if (event.target === modal) {
        closeModals();
      }
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModals();
    }
  });

  /* ---------- Eventos de ciclo de vida ---------- */

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && S.running && !S.wake) {
      lockScreen();
    }

    updateInstallUI();
  });

  window.addEventListener('beforeunload', () => {
    if (S.stream) {
      S.stream.getTracks().forEach(track => track.stop());
    }

    revokePhotoUrls();
    releaseSharePreview();
  });

  /* ---------- Service Worker ---------- */

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      await navigator.serviceWorker.register('./sw.js', {
        scope: './'
      });
    } catch (error) {
      console.warn(
        'Service Worker não registrado:',
        error
      );
    }
  }

  /* ---------- Inicialização ---------- */

  function boot() {
    const savedTheme = store.get(KEY_THEME);

    if (savedTheme === 'dark' || savedTheme === 'light') {
      applyTheme(savedTheme);
    } else {
      applyTheme(
        window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
      );
    }

    resetDisplay();
    setMode('cont');
    setRunningUI(false);
    show('main');

    updateInstallUI();
    registerServiceWorker();

    const splash = $('#splash');

    if (splash) {
      setTimeout(() => {
        splash.classList.add('hide');

        setTimeout(() => {
          splash.remove();
        }, 500);
      }, 800);
    }
  }

  boot();

})();
