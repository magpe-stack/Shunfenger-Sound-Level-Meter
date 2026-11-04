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
  const DEFAULT_CAL = 100;       // offset dBFS -> dB SPL aproximado (ajustável)
  const MAX_DB = 120;            // fundo de escala da barra
  const TICK_MS = 100;
  const DISCLAIMER = 'Medições aproximadas feitas com o microfone do smartphone; não substituem sonômetro calibrado (IEC 61672).';

  const MODES = {
    cont: { label: 'Contínuo', sec: 0 },
    '10': { label: '10 s',     sec: 10 },
    '20': { label: '20 s',     sec: 20 },
    '30': { label: '30 s',     sec: 30 },
  };

  /* ---------- Storage seguro ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  };

  let cal = parseFloat(store.get(KEY_CAL));
  if (!isFinite(cal)) cal = DEFAULT_CAL;

  /* ---------- Estado ---------- */
  const S = {
    mode: 'cont', running: false, saving: false,
    ctx: null, stream: null, analyser: null, buf: null,
    timer: null, startTs: 0, t0: 0,
    smooth: 0, acc: null, locPromise: null, wake: null,
    installEvt: null,
  };

  /* ---------- Utilidades ---------- */
  const round1 = n => Math.round(n * 10) / 10;
  const fmtDate = ts => new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
  const pad2 = n => String(n).padStart(2, '0');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function classify(v) {
    const r = Math.round(v);
    if (r < 50)  return { key: 'safe',     emoji: '🟢', label: 'Seguro / Ideal' };
    if (r <= 70) return { key: 'moderate', emoji: '🟡', label: 'Moderado' };
    if (r <= 85) return { key: 'high',     emoji: '🟠', label: 'Alto / Risco' };
    return            { key: 'critical', emoji: '🔴', label: 'Crítico / Nocivo' };
  }
  const levelByKey = k => ({
    safe: { emoji: '🟢', label: 'Seguro / Ideal' }, moderate: { emoji: '🟡', label: 'Moderado' },
    high: { emoji: '🟠', label: 'Alto / Risco' },   critical: { emoji: '🔴', label: 'Crítico / Nocivo' },
  }[k] || { emoji: '⚪', label: '—' });

  let toastT;
  function toast(msg, ms = 2600) {
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, ms);
  }
  function banner(msg) { $('#banner-text').textContent = msg; $('#banner').hidden = false; }
  function hideBanner() { $('#banner').hidden = true; }

  /* ---------- Registros ---------- */
  function load() {
    try {
      const a = JSON.parse(store.get(KEY_REC) || '[]');
      return Array.isArray(a) ? a : [];
    } catch { return []; }
  }
  function save(list) {
    if (!store.set(KEY_REC, JSON.stringify(list))) toast('Não foi possível salvar no armazenamento local.');
  }
  const sorted = () => load().sort((a, b) => b.ts - a.ts);

  const locText = r => (r.lat == null || r.lon == null)
    ? 'Localização indisponível'
    : `${r.lat.toFixed(5)}, ${r.lon.toFixed(5)}` + (r.acc != null ? ` (±${Math.round(r.acc)} m)` : '');
  const modeLabel = r => (MODES[r.mode] || MODES.cont).label;
  const NOTE_MAX = 50;
  const noteText = r => String(r.note || '').trim().slice(0, NOTE_MAX);

  /* ---------- Tema ---------- */
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    const m = $('meta[name="theme-color"]');
    if (m) m.content = t === 'dark' ? '#000000' : '#ffffff';
  }
  function toggleTheme() {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(t); store.set(KEY_THEME, t);
  }

  /* ---------- Navegação ---------- */
  function show(view) {
    $('#view-main').hidden = view !== 'main';
    $('#view-history').hidden = view !== 'history';
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.go === view));
    $('#app').dataset.view = view;
    if (view === 'history') renderHistory();
  }

  function renderHistory() {
    const list = sorted();
    $('#hist-count').textContent = `${list.length} ${list.length === 1 ? 'registro' : 'registros'}`;
    const badge = $('#tab-badge');
    badge.textContent = list.length; badge.hidden = list.length === 0;
    const box = $('#history-list');
    if (!list.length) {
      box.innerHTML = '<div class="empty"><span>🎧</span>Nenhuma medição salva ainda.<br>Faça uma medição para vê-la aqui.</div>';
      return;
    }
    box.innerHTML = list.map(r => {
      const lv = levelByKey(r.level);
      const mm = (r.min != null && r.max != null) ? ` · mín ${r.min} / máx ${r.max}` : '';
      return `<article class="rec">
        <div class="rec-db"><b>${esc(r.value)}</b><small>dB</small></div>
        <div class="rec-info">
          <strong>${lv.emoji} ${esc(lv.label)}</strong>
          <span class="muted">${esc(fmtDate(r.ts))}</span>
          <span class="muted">${esc(modeLabel(r))}${esc(mm)}</span>
          <span class="muted">📍 ${esc(locText(r))}</span>
        </div>
        <button class="rec-del" data-del="${esc(r.id)}" aria-label="Excluir registro">🗑</button>
        <div class="rec-note">
          <input type="text" maxlength="${NOTE_MAX}" data-note="${esc(r.id)}" value="${esc(r.note || '')}" placeholder="Observação (até ${NOTE_MAX} caracteres)" aria-label="Observação do registro" enterkeyhint="done" autocomplete="off">
          <span class="note-count">${String(r.note || '').length}/${NOTE_MAX}</span>
        </div>
      </article>`;
    }).join('');
  }

  /* ---------- Visor ---------- */
  function setDisplay(db, stats) {
    const lv = classify(db);
    $('#value').textContent = db.toFixed(1);
    $('#bar-fill').style.width = Math.max(0, Math.min(100, db / MAX_DB * 100)) + '%';
    $('#level-emoji').textContent = lv.emoji;
    $('#level-text').textContent = lv.label;
    $('#meter').dataset.level = lv.key;
    if (stats) {
      $('#st-min').textContent = stats.min.toFixed(1);
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
    ['#st-min', '#st-avg', '#st-max'].forEach(s => { $(s).textContent = '--'; });
    $('#meter-timer').textContent = '00:00';
    $('#progress').hidden = true; $('#progress-fill').style.width = '0%';
  }
  function setMode(m) {
    if (S.running) return;
    S.mode = m;
    $$('.mode').forEach(b => {
      const on = b.dataset.mode === m;
      b.classList.toggle('active', on); b.setAttribute('aria-checked', String(on));
    });
    $('#meter-mode-label').textContent = MODES[m].label;
  }
  function setRunningUI(running) {
    const b = $('#btn-main');
    b.classList.toggle('running', running);
    $('#btn-main-label').textContent = running ? 'Parar e salvar' : 'Iniciar medição';
    $$('.mode').forEach(x => { x.disabled = running; });
  }

  /* ---------- Geolocalização (real) ---------- */
  function getLocation() {
    return new Promise(resolve => {
      if (!('geolocation' in navigator)) return resolve({ err: 'unsupported' });
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }),
        e => resolve({ err: e.code === 1 ? 'denied' : (e.code === 3 ? 'timeout' : 'unavailable') }),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
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
    try { if ('wakeLock' in navigator) S.wake = await navigator.wakeLock.request('screen'); } catch { /* ignore */ }
  }
  function unlockScreen() { try { S.wake && S.wake.release(); } catch { /* ignore */ } S.wake = null; }

  function micError(e) {
    const n = e && e.name;
    if (n === 'NotAllowedError' || n === 'SecurityError')
      return 'Acesso ao microfone negado. Toque no cadeado ao lado do endereço › Permissões › Microfone › Permitir e tente novamente.';
    if (n === 'NotFoundError' || n === 'OverconstrainedError')
      return 'Nenhum microfone foi encontrado neste dispositivo.';
    if (n === 'NotReadableError')
      return 'O microfone está em uso por outro aplicativo. Feche-o e tente novamente.';
    return 'Não foi possível acessar o microfone (' + (n || 'erro desconhecido') + ').';
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
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
      });
    } catch (e) { banner(micError(e)); return; }

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
    S.locPromise.then(r => { if (r.err) locWarning(r.err); });

    S.acc = { sum: 0, n: 0, min: Infinity, max: -Infinity, last: 0 };
    S.smooth = 0;
    S.startTs = Date.now(); S.t0 = performance.now();
    S.running = true;
    setRunningUI(true); lockScreen();
    $('#progress').hidden = MODES[S.mode].sec === 0;
    S.timer = setInterval(tick, TICK_MS);
    tick();
  }

  function tick() {
    if (!S.running) return;
    S.analyser.getFloatTimeDomainData(S.buf);
    let sq = 0;
    for (let i = 0; i < S.buf.length; i++) sq += S.buf[i] * S.buf[i];
    const rms = Math.sqrt(sq / S.buf.length);
    const dbfs = 20 * Math.log10(Math.max(rms, 1e-9));
    const inst = Math.max(0, Math.min(140, dbfs + cal));

    // suavização por energia (aprox. ponderação temporal "Fast")
    const e = Math.pow(10, inst / 10);
    S.smooth = S.smooth ? 0.4 * e + 0.6 * S.smooth : e;
    const db = 10 * Math.log10(S.smooth);

    const a = S.acc;
    a.sum += S.smooth; a.n++; a.last = db;
    if (db < a.min) a.min = db;
    if (db > a.max) a.max = db;
    const avg = 10 * Math.log10(a.sum / a.n);
    setDisplay(db, { min: a.min, avg, max: a.max });

    const elapsed = (performance.now() - S.t0) / 1000;
    const dur = MODES[S.mode].sec;
    if (dur) {
      const left = Math.max(0, Math.ceil(dur - elapsed));
      $('#meter-timer').textContent = `Restam ${left} s`;
      $('#progress-fill').style.width = Math.min(100, elapsed / dur * 100) + '%';
      if (elapsed >= dur) stop();
    } else {
      const s = Math.floor(elapsed);
      $('#meter-timer').textContent = `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
    }
  }

  function releaseAudio() {
    clearInterval(S.timer); S.timer = null;
    if (S.stream) S.stream.getTracks().forEach(t => t.stop());
    if (S.ctx) { try { S.ctx.close(); } catch { /* ignore */ } }
    S.stream = S.ctx = S.analyser = S.buf = null;
    unlockScreen();
  }

  async function stop() {
    if (!S.running) return;
    S.running = false; S.saving = true;
    const a = S.acc, mode = S.mode, startTs = S.startTs;
    const duration = Math.round((performance.now() - S.t0) / 100) / 10;
    releaseAudio();
    setRunningUI(false);
    $('#btn-main').disabled = true;

    if (a.n < 3) {
      toast('Medição muito curta — nada foi salvo.');
      resetDisplay(); S.saving = false; $('#btn-main').disabled = false; return;
    }

    toast('Obtendo localização…', 1800);
    const loc = await S.locPromise;
    const avg = 10 * Math.log10(a.sum / a.n);
    const value = round1(mode === 'cont' ? a.last : avg);

    const rec = {
      id: uid(), ts: startTs, mode, duration,
      value, avg: round1(avg), min: round1(a.min), max: round1(a.max),
      level: classify(value).key,
      lat: loc.lat ?? null, lon: loc.lon ?? null, acc: loc.acc != null ? round1(loc.acc) : null,
      note: '',
    };
    const list = load(); list.push(rec); save(list);

    setDisplay(value, { min: a.min, avg, max: a.max });
    $('#meter-timer').textContent = 'Salvo ✔';
    $('#progress').hidden = true;
    renderHistory();
    toast(`Registro salvo: ${value.toFixed(1)} dB`);
    S.saving = false; $('#btn-main').disabled = false;
  }

  function onMainBtn() { S.running ? stop() : start(); }

  /* ---------- Download helper ---------- */
  function download(name, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  const stamp = () => { const d = new Date(); return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`; };
  const needData = () => { const l = sorted(); if (!l.length) { toast('Não há registros para exportar.'); return null; } return l; };

  /* ---------- Exportações ---------- */
  function exportJSON() {
    const l = needData(); if (!l) return;
    const data = { app: APP_NAME, version: 1, exportedAt: new Date().toISOString(), records: l };
    download(`shunfenger-${stamp()}.json`, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    toast('JSON exportado.');
  }

  function exportMD() {
    const l = needData(); if (!l) return;
    const rows = l.map(r => `| ${fmtDate(r.ts)} | **${r.value}** | ${levelByKey(r.level).emoji} ${levelByKey(r.level).label} | ${modeLabel(r)} | ${r.min ?? '-'} / ${r.max ?? '-'} | ${locText(r)} | ${noteText(r).replace(/\|/g, '\\|') || '-'} |`);
    const md = [
      `# ${APP_NAME}`, '',
      `Relatório de medições — gerado em ${fmtDate(Date.now())}`, '',
      `Total de registros: **${l.length}**`, '',
      '| Data/Hora | dB | Classificação | Modo | Mín / Máx | Localização | Observação |',
      '|---|---|---|---|---|---|---|', ...rows, '',
      `> ${DISCLAIMER}`, '',
    ].join('\n');
    download(`shunfenger-${stamp()}.md`, new Blob([md], { type: 'text/markdown;charset=utf-8' }));
    toast('Markdown exportado.');
  }

  function exportTXT() {
    const l = needData(); if (!l) return;
    const body = l.map((r, i) => [
      `#${i + 1}`,
      `  Data/Hora.....: ${fmtDate(r.ts)}`,
      `  Valor.........: ${r.value} dB`,
      `  Classificação.: ${levelByKey(r.level).label}`,
      `  Modo..........: ${modeLabel(r)} (${r.duration ?? '-'} s)`,
      `  Mín / Máx.....: ${r.min ?? '-'} / ${r.max ?? '-'} dB`,
      `  Localização...: ${locText(r)}`,
      `  Observação....: ${noteText(r) || '-'}`,
    ].join('\n')).join('\n\n');
    const txt = `${APP_NAME.toUpperCase()}\nRelatório de medições — gerado em ${fmtDate(Date.now())}\nTotal: ${l.length}\n${'='.repeat(48)}\n\n${body}\n\n${'='.repeat(48)}\n${DISCLAIMER}\n`;
    download(`shunfenger-${stamp()}.txt`, new Blob([txt], { type: 'text/plain;charset=utf-8' }));
    toast('TXT exportado.');
  }

  /* --- DOCX (gerado do zero, sem bibliotecas: ZIP "store" + OOXML) --- */
  const CRC_T = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  function makeZip(files) {
    const enc = new TextEncoder(), chunks = [], central = [];
    let offset = 0;
    for (const f of files) {
      const name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data), size = data.length;
      const lh = new Uint8Array(30 + name.length), v = new DataView(lh.buffer);
      v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(6, 0x0800, true);
      v.setUint16(8, 0, true); v.setUint16(10, 0, true); v.setUint16(12, 0x21, true);
      v.setUint32(14, crc, true); v.setUint32(18, size, true); v.setUint32(22, size, true);
      v.setUint16(26, name.length, true); v.setUint16(28, 0, true); lh.set(name, 30);
      chunks.push(lh, data);

      const ch = new Uint8Array(46 + name.length), c = new DataView(ch.buffer);
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(10, 0, true); c.setUint16(12, 0, true); c.setUint16(14, 0x21, true);
      c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true);
      c.setUint16(28, name.length, true); c.setUint32(42, offset, true); ch.set(name, 46);
      central.push(ch);
      offset += lh.length + size;
    }
    const cSize = central.reduce((s, x) => s + x.length, 0);
    const end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cSize, true); e.setUint32(16, offset, true);
    return new Blob([...chunks, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  function exportDOCX() {
    const l = needData(); if (!l) return;
    const x = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const run = (t, o = {}) => `<w:r><w:rPr>${o.b ? '<w:b/>' : ''}${o.color ? `<w:color w:val="${o.color}"/>` : ''}<w:sz w:val="${o.sz || 20}"/></w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
    const para = (t, o = {}) => `<w:p><w:pPr><w:spacing w:after="${o.after ?? 120}"/></w:pPr>${run(t, o)}</w:p>`;
    const widths = [2200, 800, 1900, 1100, 1400, 3600, 3300];
    const cell = (t, w, o = {}) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${o.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>` : ''}</w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr>${run(t, { sz: 18, b: o.b })}</w:p></w:tc>`;
    const head = ['Data/Hora', 'dB', 'Classificação', 'Modo', 'Mín / Máx', 'Localização', 'Observação'];
    const trHead = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${head.map((h, i) => cell(h, widths[i], { fill: 'E1CFFC', b: true })).join('')}</w:tr>`;
    const trs = l.map(r => `<w:tr>${[
      fmtDate(r.ts), String(r.value), levelByKey(r.level).label, modeLabel(r), `${r.min ?? '-'} / ${r.max ?? '-'}`, locText(r), noteText(r) || '-',
    ].map((t, i) => cell(t, widths[i], { b: i === 1 })).join('')}</w:tr>`).join('');
    const bd = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="873FF3"/>`).join('');
    const table = `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, b) => a + b)}" w:type="dxa"/><w:tblBorders>${bd}</w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>${trHead}${trs}</w:tbl>`;

    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
${para(APP_NAME, { b: true, sz: 36, color: '873FF3', after: 60 })}
${para(`Relatório de medições — gerado em ${fmtDate(Date.now())} · ${l.length} registro(s)`, { sz: 20, after: 200 })}
${table}
${para(DISCLAIMER, { sz: 16, color: '555555', after: 0 }).replace('<w:spacing w:after="0"/>', '<w:spacing w:before="240" w:after="0"/>')}
<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr>
</w:body></w:document>`;

    const blob = makeZip([
      { name: '[Content_Types].xml', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
      { name: '_rels/.rels', text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
      { name: 'word/document.xml', text: doc },
    ]);
    download(`shunfenger-${stamp()}.docx`, blob);
    toast('DOCX exportado.');
  }

  function printReport() {
    const l = needData(); if (!l) return;
    const rows = l.map(r => `<tr><td>${esc(fmtDate(r.ts))}</td><td><b>${esc(r.value)}</b></td><td>${levelByKey(r.level).emoji} ${esc(levelByKey(r.level).label)}</td><td>${esc(modeLabel(r))}</td><td>${esc(r.min ?? '-')} / ${esc(r.max ?? '-')}</td><td>${esc(locText(r))}</td><td>${esc(noteText(r) || '-')}</td></tr>`).join('');
    $('#print-report').innerHTML = `<h1>${esc(APP_NAME)}</h1>
      <p class="meta">Relatório de medições — gerado em ${esc(fmtDate(Date.now()))} · ${l.length} registro(s)</p>
      <table><thead><tr><th>Data/Hora</th><th>dB</th><th>Classificação</th><th>Modo</th><th>Mín / Máx</th><th>Localização</th><th>Observação</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="note">${esc(DISCLAIMER)}</p>`;
    setTimeout(() => window.print(), 150);
  }

  /* ---------- Importação ---------- */
  function importFile(file) {
    const rd = new FileReader();
    rd.onerror = () => toast('Não foi possível ler o arquivo.');
    rd.onload = () => {
      try {
        const data = JSON.parse(rd.result);
        const arr = Array.isArray(data) ? data : data.records;
        if (!Array.isArray(arr)) throw new Error('formato');
        const valid = arr.filter(r => r && typeof r.ts === 'number' && typeof r.value === 'number').map(r => ({
          id: String(r.id || uid()), ts: r.ts, mode: MODES[r.mode] ? r.mode : 'cont', duration: r.duration ?? null,
          value: r.value, avg: r.avg ?? r.value, min: r.min ?? null, max: r.max ?? null,
          level: r.level || classify(r.value).key,
          lat: typeof r.lat === 'number' ? r.lat : null, lon: typeof r.lon === 'number' ? r.lon : null,
          acc: typeof r.acc === 'number' ? r.acc : null,
          note: typeof r.note === 'string' ? r.note.trim().slice(0, NOTE_MAX) : '',
        }));
        if (!valid.length) throw new Error('vazio');
        const cur = load(); const ids = new Set(cur.map(r => r.id));
        let added = 0;
        valid.forEach(r => { if (!ids.has(r.id)) { cur.push(r); ids.add(r.id); added++; } });
        save(cur); renderHistory();
        toast(`${added} registro(s) importado(s)` + (valid.length - added ? `, ${valid.length - added} já existiam.` : '.'));
      } catch { toast('Arquivo inválido. Use um JSON exportado por este app.'); }
    };
    rd.readAsText(file);
  }

  /* ---------- Modais ---------- */
  const openModal  = id => { $(id).hidden = false; };
  const closeModals = () => $$('.modal').forEach(m => { m.hidden = true; });

  function menuAction(a) {
    if (a === 'about') { closeModals(); $('#cal-input').value = cal; openModal('#modal-about'); return; }
    if (a === 'import') { $('#file-input').click(); return; }
    closeModals();
    if (a === 'new')     { show('main'); if (!S.running) start(); }
    else if (a === 'json')  exportJSON();
    else if (a === 'md')    exportMD();
    else if (a === 'txt')   exportTXT();
    else if (a === 'docx')  exportDOCX();
    else if (a === 'print') printReport();
    else if (a === 'install' && S.installEvt) { S.installEvt.prompt(); S.installEvt = null; $('#li-install').hidden = true; }
  }

  /* ---------- Eventos ---------- */
  function bind() {
    $('#btn-theme').addEventListener('click', toggleTheme);
    $('#brand-link').addEventListener('click', e => { e.preventDefault(); closeModals(); show('main'); });
    $('#btn-file').addEventListener('click', () => openModal('#modal-file'));
    $('#btn-main').addEventListener('click', onMainBtn);
    $('#banner-close').addEventListener('click', hideBanner);
    $$('.mode').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    $$('.tab').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));

    $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) closeModals(); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });
    $$('#modal-file [data-action]').forEach(b => b.addEventListener('click', () => menuAction(b.dataset.action)));

    $('#file-input').addEventListener('change', e => {
      const f = e.target.files[0]; e.target.value = '';
      if (f) { closeModals(); importFile(f); }
    });

    $('#history-list').addEventListener('click', e => {
      const b = e.target.closest('[data-del]'); if (!b) return;
      save(load().filter(r => r.id !== b.dataset.del)); renderHistory(); toast('Registro excluído.');
    });
    $('#history-list').addEventListener('input', e => {
      const inp = e.target.closest('[data-note]'); if (!inp) return;
      const v = inp.value.slice(0, NOTE_MAX);
      if (v !== inp.value) inp.value = v;
      const cnt = inp.parentElement.querySelector('.note-count');
      if (cnt) cnt.textContent = `${v.length}/${NOTE_MAX}`;
      const list = load(); const rec = list.find(r => r.id === inp.dataset.note);
      if (rec) { rec.note = v; save(list); }
    });
    $('#history-list').addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.matches('[data-note]')) e.target.blur();
    });
    $('#btn-clear').addEventListener('click', () => {
      if (!load().length) return toast('Nada para apagar.');
      if (confirm('Apagar TODOS os registros? Essa ação não pode ser desfeita.')) { save([]); renderHistory(); toast('Histórico apagado.'); }
    });

    $('#cal-save').addEventListener('click', () => {
      const v = parseFloat($('#cal-input').value);
      if (!isFinite(v) || v < 40 || v > 160) return toast('Informe um offset entre 40 e 160.');
      cal = v; store.set(KEY_CAL, String(v)); toast('Calibração salva.');
    });
    $('#cal-reset').addEventListener('click', () => {
      cal = DEFAULT_CAL; store.set(KEY_CAL, String(cal)); $('#cal-input').value = cal; toast('Calibração restaurada.');
    });

    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.running) lockScreen(); });

    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; $('#li-install').hidden = false; });
    window.addEventListener('appinstalled', () => { $('#li-install').hidden = true; toast('Aplicativo instalado!'); });
  }

  /* ---------- Splash (exatamente 1 s) + Service Worker ---------- */
  function boot() {
    bind(); renderHistory(); resetDisplay();
    const sp = $('#splash');
    setTimeout(() => { sp.classList.add('hide'); setTimeout(() => sp.remove(), 600); }, 1000);
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
