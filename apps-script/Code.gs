/**
 * WEB APP QUẢN LÝ GIỎ HÀNG — Á ĐÔNG LAND
 * Google Sheets là nguồn dữ liệu gốc; app đọc và ghi trực tiếp vào sheet.
 */

// ───────────────────────────── Web app ─────────────────────────────

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Giỏ hàng Á Đông Land')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Thông tin khởi động cho giao diện. */
function apiBootstrap() {
  return {
    companyName: CONFIG.companyName,
    hotline: CONFIG.hotline,
    pinConfigured: !!getAdminPin_(),
    statuses: Object.keys(STATUS).map(function (k) { return STATUS[k]; }),
    projects: CONFIG.projects.map(function (p) {
      return {
        id: p.id,
        name: p.name,
        sheetUrl: 'https://docs.google.com/spreadsheets/d/' + p.spreadsheetId + '/edit',
        sources: p.sources.filter(isEnabled_).map(function (s) {
          return { key: sourceKey_(p, s), label: s.label, kind: s.kind, editable: !!s.editable };
        }),
        references: (p.references || []).map(function (r) { return { sheet: r.sheet, label: r.label }; })
      };
    })
  };
}

/** Toàn bộ căn của một dự án (gộp các nguồn). */
function apiGetInventory(projectId, force) {
  var project = getProject_(projectId);
  var cacheKey = 'inv_' + projectId;
  if (!force) {
    var cached = cacheGet_(cacheKey);
    if (cached) return cached;
  }
  var units = [];
  var sourceInfo = [];
  project.sources.filter(isEnabled_).forEach(function (source) {
    var res = readSource_(project, source);
    sourceInfo.push({
      key: sourceKey_(project, source),
      label: source.label,
      editable: !!source.editable,
      count: res.units.length,
      error: res.error || '',
      statusMode: res.statusMode,
      legend: res.legend
    });
    units = units.concat(res.units);
  });
  var result = { projectId: projectId, units: units, sources: sourceInfo, updatedAt: new Date().toISOString() };
  cachePut_(cacheKey, result);
  return result;
}

/** Bảng tham khảo (STK cọc, quỹ VOS...) — trả về giá trị hiển thị. */
function apiGetReference(projectId, sheetName) {
  var project = getProject_(projectId);
  var ok = (project.references || []).some(function (r) { return r.sheet === sheetName; });
  if (!ok) throw new Error('Bảng tham khảo không có trong cấu hình.');
  var sh = SpreadsheetApp.openById(project.spreadsheetId).getSheetByName(sheetName);
  if (!sh) throw new Error('Không tìm thấy tab "' + sheetName + '".');
  var rows = sh.getDataRange().getDisplayValues().slice(0, 1000);
  rows = rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); });
  var width = 0;
  rows.forEach(function (r) {
    for (var i = r.length - 1; i >= 0; i--) { if (String(r[i]).trim() !== '') { width = Math.max(width, i + 1); break; } }
  });
  return { sheet: sheetName, rows: rows.map(function (r) { return r.slice(0, width); }) };
}

/** Kiểm tra mã PIN admin. */
function apiCheckPin(pin) {
  var real = getAdminPin_();
  if (!real) throw new Error('Chưa đặt mã PIN admin. Chạy hàm setAdminPin trong Apps Script.');
  return String(pin) === real;
}

/**
 * Cập nhật một căn.
 * payload = { projectId, sourceKey, row, code, expectedStatus, changes: {status, note, date}, pin, user }
 */
function apiUpdateUnit(payload) {
  if (!apiCheckPin(payload.pin)) throw new Error('Mã PIN không đúng.');
  var user = String(payload.user || '').trim();
  if (!user) throw new Error('Vui lòng nhập tên người cập nhật.');

  var project = getProject_(payload.projectId);
  var source = project.sources.filter(function (s) { return sourceKey_(project, s) === payload.sourceKey; })[0];
  if (!source) throw new Error('Không tìm thấy nguồn dữ liệu.');
  if (!source.editable) throw new Error('Tab "' + source.sheet + '" chỉ được xem, không sửa trên app.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.openById(source.spreadsheetId || project.spreadsheetId);
    var sh = ss.getSheetByName(source.sheet);
    var meta = readSource_(project, source, sh);
    if (meta.error) throw new Error(meta.error);

    // Xác định đúng dòng: ưu tiên số dòng gửi lên, nếu lệch (sheet bị chèn dòng) thì tìm theo mã căn.
    var unit = meta.units.filter(function (u) { return u.row === payload.row && sameCode_(u.code, payload.code); })[0]
      || meta.units.filter(function (u) { return sameCode_(u.code, payload.code); })[0];
    if (!unit) throw new Error('Không tìm thấy căn ' + payload.code + ' trong tab "' + source.sheet + '". Có thể căn đã bị xóa.');

    if (payload.expectedStatus !== undefined && payload.expectedStatus !== unit.status) {
      throw new Error('Căn ' + unit.code + ' vừa được cập nhật thành "' + unit.status + '". Vui lòng tải lại trước khi sửa.');
    }

    var changes = payload.changes || {};
    var logs = [];
    Object.keys(changes).forEach(function (field) {
      if (EDITABLE_FIELDS.indexOf(field) < 0) throw new Error('Không được sửa trường ' + field + '.');
      var newVal = changes[field];
      var oldVal = field === 'status' ? unit.status : (unit[field] || '');
      if (String(newVal) === String(oldVal)) return;

      if (field === 'status' && meta.colMap.status === undefined) {
        // Sheet đánh dấu trạng thái bằng màu nền → tô màu theo chú thích của sheet.
        writeStatusColor_(sh, meta, unit.row, newVal);
      } else {
        var col = meta.colMap[field];
        if (col === undefined) throw new Error('Tab "' + source.sheet + '" không có cột cho trường ' + field + '.');
        var cell = sh.getRange(unit.row, col + 1);
        if (cell.getFormula()) throw new Error('Ô ' + cell.getA1Notation() + ' là công thức, không ghi đè.');
        cell.setValue(field === 'date' ? toDate_(newVal) : newVal);
      }
      logs.push([new Date(), user, source.sheet, unit.code, field, oldVal, newVal]);
    });

    if (logs.length) appendLog_(ss, logs);
    CacheService.getScriptCache().remove('inv_' + project.id + '_n');
    return { ok: true, changed: logs.length };
  } finally {
    lock.releaseLock();
  }
}

/** Nhật ký cập nhật gần nhất của dự án. */
function apiGetLog(projectId, limit) {
  var project = getProject_(projectId);
  var sh = SpreadsheetApp.openById(project.spreadsheetId).getSheetByName(CONFIG.logSheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  var n = Math.min(limit || 50, sh.getLastRow() - 1);
  var rows = sh.getRange(sh.getLastRow() - n + 1, 1, n, 7).getDisplayValues();
  return rows.reverse();
}

/** Chạy một lần trong trình soạn thảo Apps Script để đặt PIN admin. */
function setAdminPin() {
  var pin = '123456'; // ← đổi thành mã PIN của anh/chị trước khi chạy
  PropertiesService.getScriptProperties().setProperty('ADMIN_PIN', pin);
  Logger.log('Đã đặt ADMIN_PIN.');
}

// ───────────────────────────── Đọc sheet ─────────────────────────────

function readSource_(project, source, sheetOpt) {
  var key = sourceKey_(project, source);
  var out = { units: [], colMap: {}, legend: {}, statusMode: 'column', error: '' };
  var sh = sheetOpt;
  try {
    sh = sh || SpreadsheetApp.openById(source.spreadsheetId || project.spreadsheetId).getSheetByName(source.sheet);
  } catch (e) {
    out.error = 'Không mở được file: ' + e.message;
    return out;
  }
  if (!sh) { out.error = 'Không tìm thấy tab "' + source.sheet + '".'; return out; }

  var range = sh.getDataRange();
  var values = range.getValues();
  var display = range.getDisplayValues();
  var bgs = range.getBackgrounds();

  var headerIdx = findHeaderRow_(display);
  if (headerIdx < 0) { out.error = 'Không tìm thấy dòng tiêu đề có cột "Mã căn".'; return out; }
  var headers = display[headerIdx].map(function (h) { return String(h).replace(/\s+/g, ' ').trim(); });
  var colMap = mapColumns_(headers);
  out.colMap = colMap;

  // Chú thích màu (ví dụ ô "ĐÃ BÁN", "ĐANG LOCK" ở phía trên bảng).
  var legend = {};
  for (var r = 0; r < headerIdx; r++) {
    for (var c = 0; c < display[r].length; c++) {
      var st = canonStatus_(display[r][c], true);
      var bg = String(bgs[r][c]).toLowerCase();
      if (st && bg && bg !== '#ffffff') legend[bg] = st;
    }
  }
  out.legend = invert_(legend);
  if (colMap.status === undefined) out.statusMode = Object.keys(legend).length ? 'color' : 'none';

  var links = readLinks_(sh, colMap, values.length);
  var group = '';

  for (var i = headerIdx + 1; i < values.length; i++) {
    var row = display[i];
    var code = colMap.code !== undefined ? String(row[colMap.code]).trim() : '';
    if (!code) {
      // Dòng nhóm (ví dụ "PHÂN KHU VỊNH NGỌC") → dùng làm khu mặc định cho các dòng sau.
      var label = row.filter(function (x) { return String(x).trim() !== ''; });
      if (label.length === 1 && isNaN(Number(label[0]))) group = String(label[0]).trim();
      continue;
    }
    if (normalize_(code) === normalize_(headers[colMap.code])) continue; // tiêu đề lặp lại

    var get = function (f) { return colMap[f] !== undefined ? String(row[colMap[f]]).trim() : ''; };
    var raw = function (f) { return colMap[f] !== undefined ? values[i][colMap[f]] : ''; };

    var statusRaw = get('status');
    var status = canonStatus_(statusRaw, false);
    var statusSource = 'column';
    if (!statusRaw) {
      var cBg = String(bgs[i][colMap.code]).toLowerCase();
      var fBg = String(bgs[i][0]).toLowerCase();
      if (legend[cBg]) { status = legend[cBg]; statusSource = 'color'; }
      else if (legend[fBg]) { status = legend[fBg]; statusSource = 'color'; }
      else { status = STATUS.AVAILABLE; statusSource = 'default'; }
    }

    var extra = [];
    headers.forEach(function (h, ci) {
      var v = String(row[ci]).trim();
      if (h && v && v !== '-') extra.push([h, v]);
    });

    var dateVal = raw('date');
    out.units.push({
      key: key + '|' + (i + 1),
      sourceKey: key,
      sourceLabel: source.label,
      kind: source.kind,
      editable: !!source.editable,
      row: i + 1,
      code: code,
      zone: get('zone') || group,
      street: get('street') || codePrefix_(code),
      type: get('type'),
      handover: get('handover'),
      partner: get('partner'),
      direction: get('direction'),
      land: toNumber_(raw('land'), 'area'),
      build: toNumber_(raw('build'), 'area'),
      stk: get('stk'),
      priceExVat: toNumber_(raw('priceExVat'), 'money'),
      priceTotal: toNumber_(raw('priceTotal'), 'money'),
      priceLoan: toNumber_(raw('priceLoan'), 'money'),
      status: status,
      statusRaw: statusRaw,
      statusSource: statusSource,
      note: get('note'),
      date: dateVal instanceof Date ? Utilities.formatDate(dateVal, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd') : get('date'),
      ptg: links.ptg[i] || '',
      unitLink: links.unitLink[i] || '',
      extra: extra
    });
  }
  return out;
}

function findHeaderRow_(display) {
  var limit = Math.min(display.length, 25);
  for (var r = 0; r < limit; r++) {
    for (var c = 0; c < display[r].length; c++) {
      if (FIELD_ALIASES.code.indexOf(normalize_(display[r][c])) >= 0) return r;
    }
  }
  return -1;
}

function mapColumns_(headers) {
  var map = {};
  var norm = headers.map(normalize_);
  Object.keys(FIELD_ALIASES).forEach(function (field) {
    var aliases = FIELD_ALIASES[field];
    for (var a = 0; a < aliases.length && map[field] === undefined; a++) {
      var idx = norm.indexOf(aliases[a]);
      if (idx >= 0) map[field] = idx;
    }
  });
  return map;
}

/** Lấy URL thật từ ô có chữ "Link PTG" (hyperlink hoặc công thức HYPERLINK). */
function readLinks_(sh, colMap, n) {
  var res = { ptg: {}, unitLink: {} };
  ['ptg', 'unitLink'].forEach(function (f) {
    if (colMap[f] === undefined || n === 0) return;
    var rng = sh.getRange(1, colMap[f] + 1, n, 1);
    var rich = rng.getRichTextValues();
    var formulas = rng.getFormulas();
    var vals = rng.getDisplayValues();
    for (var i = 0; i < n; i++) {
      var url = '';
      var rt = rich[i][0];
      if (rt) {
        url = rt.getLinkUrl() || '';
        if (!url) {
          var runs = rt.getRuns();
          for (var k = 0; k < runs.length && !url; k++) url = runs[k].getLinkUrl() || '';
        }
      }
      if (!url) {
        var m = String(formulas[i][0]).match(/HYPERLINK\(\s*"([^"]+)"/i);
        if (m) url = m[1];
      }
      if (!url && /^https?:\/\//i.test(vals[i][0])) url = vals[i][0];
      if (url) res[f][i] = url;
    }
  });
  return res;
}

function writeStatusColor_(sh, meta, row, status) {
  var width = sh.getLastColumn();
  var rng = sh.getRange(row, 1, 1, width);
  if (status === STATUS.AVAILABLE) { rng.setBackground(null); return; }
  var color = meta.legend[status];
  if (!color) {
    throw new Error('Tab này đánh dấu trạng thái bằng màu và chưa có màu cho "' + status +
      '". Hãy thêm cột "TÌNH TRẠNG" vào sheet để dùng đủ trạng thái.');
  }
  rng.setBackground(color);
}

function appendLog_(ss, rows) {
  var sh = ss.getSheetByName(CONFIG.logSheetName);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.logSheetName);
    sh.appendRow(['Thời gian', 'Người cập nhật', 'Tab', 'Mã căn', 'Trường', 'Giá trị cũ', 'Giá trị mới']);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
}

// ───────────────────────────── Tiện ích ─────────────────────────────

function getProject_(id) {
  var p = CONFIG.projects.filter(function (x) { return x.id === id; })[0];
  if (!p) throw new Error('Không có dự án ' + id + '.');
  return p;
}

function isEnabled_(s) { return s.enabled !== false; }

function sourceKey_(project, source) { return project.id + ':' + source.sheet; }

function getAdminPin_() { return PropertiesService.getScriptProperties().getProperty('ADMIN_PIN'); }

function normalize_(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function sameCode_(a, b) { return normalize_(a).replace(/\s/g, '') === normalize_(b).replace(/\s/g, ''); }

function codePrefix_(code) { var m = String(code).match(/^([^-]+)-/); return m ? m[1] : ''; }

/** Đưa các cách ghi trạng thái về tên chuẩn. strict = chỉ nhận chữ trạng thái rõ ràng (dùng cho chú thích). */
function canonStatus_(raw, strict) {
  var n = normalize_(raw);
  if (!n) return '';
  if (/da ban|sold/.test(n)) return STATUS.SOLD;
  if (/da coc|dat coc|coc/.test(n)) return STATUS.DEPOSITED;
  if (/lock|giu cho|dang giu/.test(n)) return STATUS.LOCKED;
  if (/check/.test(n)) return STATUS.CHECK;
  if (/con hang|^ton$|available|^trong$/.test(n)) return STATUS.AVAILABLE;
  return strict ? '' : String(raw).trim();
}

/** Đọc số: tiền ("41.278.010.218", "20,873,934,525") hoặc diện tích ("266,9", "131.5"). */
function toNumber_(v, kind) {
  if (typeof v === 'number') return v;
  var s = String(v == null ? '' : v).trim();
  if (!s || s === '-') return null;
  if (kind === 'money') {
    var digits = s.replace(/[^\d]/g, '');
    return digits ? Number(digits) : null;
  }
  s = s.replace(/\s/g, '');
  var dots = (s.match(/\./g) || []).length;
  var commas = (s.match(/,/g) || []).length;
  if (commas === 1 && dots === 0) s = s.replace(',', '.');
  else if (dots > 1 || (dots === 1 && commas === 1 && s.indexOf('.') < s.indexOf(','))) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  var n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function toDate_(v) {
  var m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : v;
}

function invert_(obj) {
  var out = {};
  Object.keys(obj).forEach(function (k) { if (!out[obj[k]]) out[obj[k]] = k; });
  return out;
}

// Cache chia nhỏ vì CacheService giới hạn 100KB mỗi khóa.
function cachePut_(key, obj) {
  try {
    var cache = CacheService.getScriptCache();
    var s = JSON.stringify(obj);
    var size = 90000;
    var n = Math.ceil(s.length / size);
    var map = {};
    for (var i = 0; i < n; i++) map[key + '_' + i] = s.substr(i * size, size);
    map[key + '_n'] = String(n);
    cache.putAll(map, CONFIG.cacheSeconds);
  } catch (e) { /* cache lỗi thì bỏ qua, vẫn trả dữ liệu */ }
}

function cacheGet_(key) {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get(key + '_n'));
  if (!n) return null;
  var keys = [];
  for (var i = 0; i < n; i++) keys.push(key + '_' + i);
  var parts = cache.getAll(keys);
  var s = '';
  for (var j = 0; j < n; j++) {
    if (parts[keys[j]] == null) return null;
    s += parts[keys[j]];
  }
  try { return JSON.parse(s); } catch (e) { return null; }
}
