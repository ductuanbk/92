/**
 * WEB APP QUẢN LÝ GIỎ HÀNG — Á ĐÔNG LAND (phiên bản 2)
 * Google Sheets là nguồn dữ liệu gốc; app đọc và ghi trực tiếp vào sheet.
 *
 * Quyền truy cập (đặt bằng hàm setupAccess):
 *  - ADMIN_USERS: mỗi admin một mã PIN riêng → nhật ký ghi đúng tên người sửa.
 *  - VIEW_PIN (tùy chọn): mã xem chung cho sale/CTV. Để trống = ai có link đều xem được.
 */

// ═════════════════════════════ Web app ═════════════════════════════

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.api === 'public') return publicResponse_(p);
  // Dự án công khai (có file PublicOnly.gs) chỉ phục vụ dữ liệu công khai, không mở app nội bộ.
  if (isPublicOnly_()) return ContentService.createTextOutput('Bảng hàng Á Đông Land: dùng ?api=public');
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Giỏ hàng Á Đông Land')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Chạy MỘT LẦN trong trình soạn thảo để đặt quyền truy cập. Sửa giá trị trước khi chạy. */
function setupAccess() {
  var admins = {
    // 'Tên hiển thị': 'mã PIN (ít nhất 6 số, mỗi người một mã)'
    'Trần Đức Tuấn': '000000',
    'Nguyễn Mạnh Cường Quốc': '111111'
  };
  var viewPin = ''; // mã xem cho sale/CTV; để '' nếu không cần
  var props = PropertiesService.getScriptProperties();
  Object.keys(admins).forEach(function (n) {
    if (String(admins[n]).length < 6) throw new Error('PIN của ' + n + ' phải có ít nhất 6 ký tự.');
  });
  props.setProperty('ADMIN_USERS', JSON.stringify(admins));
  if (viewPin) props.setProperty('VIEW_PIN', viewPin); else props.deleteProperty('VIEW_PIN');
  props.deleteProperty('ADMIN_PIN');
  Logger.log('Đã đặt ' + Object.keys(admins).length + ' admin. Mã xem: ' + (viewPin ? 'có' : 'không'));
}

// ═════════════════════════════ Dữ liệu công khai cho website khách ═════════════════════════════

function isPublicOnly_() { return typeof PUBLIC_ONLY !== 'undefined' && PUBLIC_ONLY === true; }

/** JSON (hoặc JSONP nếu có ?callback=) gồm các căn của mọi dự án, chỉ trường an toàn. */
function publicResponse_(p) {
  var body;
  try {
    body = publicData_();
  } catch (e) {
    body = { ok: false, error: 'Bảng hàng tạm thời chưa tải được.' };
  }
  var json = JSON.stringify(body);
  var cb = String(p.callback || '');
  if (cb && /^[A-Za-z_$][\w$.]{0,60}$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function publicData_() {
  var ps = CONFIG.publicSite || {};
  if (!ps.enabled) return { ok: false, error: 'Trang công khai đang tắt.' };
  var cached = cacheGet_('pub_v1');
  if (cached) return cached;
  var labels = ps.statusLabels || {};
  var out = {
    ok: true,
    updatedAt: new Date().toISOString(),
    company: { name: CONFIG.companyName, hotline: CONFIG.hotline, zalo: CONFIG.zalo || '' },
    projects: []
  };
  CONFIG.projects.forEach(function (project) {
    var seen = {}, units = [], failed = 0;
    project.sources.filter(isEnabled_).filter(function (s) { return s.public !== false; }).forEach(function (source) {
      var res = readSource_(project, source);
      if (res.error) { failed++; return; }
      res.units.forEach(function (u) {
        var k = normalize_(u.code).replace(/\s/g, '');
        if (seen[k]) return; // trùng mã giữa các giỏ: lấy giỏ khai báo trước
        seen[k] = true;
        if (u.status === STATUS.SOLD && !ps.showSold) return;
        units.push({
          code: u.code, zone: u.zone, street: u.street, type: u.type, direction: u.direction,
          handover: u.handover, land: u.land, build: u.build, price: u.priceTotal || null,
          status: labels[u.status] || 'Liên hệ'
        });
      });
    });
    out.projects.push({ id: project.id, name: project.name, units: units, incomplete: failed > 0 });
  });
  cachePut_('pub_v1', out, ps.cacheSeconds || 120);
  return out;
}

/** Chạy một lần trong trình soạn thảo của dự án công khai để cấp quyền đọc Google Sheet và xem thử số căn. */
function kiemTraBangHangCongKhai() {
  CacheService.getScriptCache().remove('pub_v1_n');
  var d = publicData_();
  d.projects.forEach(function (p) { Logger.log(p.name + ': ' + p.units.length + ' căn' + (p.incomplete ? ' (có tab đọc lỗi)' : '')); });
}

// ═════════════════════════════ Đăng nhập ═════════════════════════════

function apiBootstrap() {
  return {
    version: CONFIG.version,
    companyName: CONFIG.companyName,
    hotline: CONFIG.hotline,
    zalo: CONFIG.zalo || '',
    appUrl: appUrl_(),
    needView: !!getProp_('VIEW_PIN') || CONFIG.requireViewPin === true,
    adminConfigured: Object.keys(getAdmins_()).length > 0,
    lockHours: CONFIG.lockHours,
    recentHours: CONFIG.recentHours,
    projects: CONFIG.projects.map(function (p) {
      return {
        id: p.id,
        name: p.name,
        sources: p.sources.filter(isEnabled_).map(function (s) {
          return { key: sourceKey_(p, s), label: s.label, kind: s.kind, editable: !!s.editable };
        }),
        references: (p.references || []).map(function (r) { return { sheet: r.sheet, label: r.label }; })
      };
    })
  };
}

/** Đăng nhập admin bằng PIN riêng. Trả về token phiên. */
function apiLogin(pin) {
  guardBruteForce_();
  var admins = getAdmins_();
  var name = Object.keys(admins).filter(function (n) { return String(admins[n]) === String(pin); })[0];
  if (!name) { recordFail_(); throw new Error('Mã PIN không đúng.'); }
  return { token: newSession_({ role: 'admin', name: name }), name: name, role: 'admin' };
}

/** Đăng nhập xem bằng mã xem chung (chỉ khi có đặt VIEW_PIN). */
function apiViewLogin(pin) {
  guardBruteForce_();
  var viewPin = getProp_('VIEW_PIN');
  if (!viewPin) {
    if (CONFIG.requireViewPin === true) throw new Error('Admin chưa đặt mã xem. Admin chạy hàm setupAccess với viewPin, hoặc đăng nhập admin.');
    return { token: '', role: 'viewer' };
  }
  if (String(pin) !== viewPin) { recordFail_(); throw new Error('Mã xem không đúng.'); }
  return { token: newSession_({ role: 'viewer', name: '' }), role: 'viewer' };
}

function apiLogout(token) {
  if (token) CacheService.getScriptCache().remove('sess_' + token);
  return true;
}

/** Thông tin chỉ admin được thấy: link Google Sheet gốc của từng dự án. */
function apiAdminInfo(token) {
  requireAdmin_(token);
  var urls = {};
  CONFIG.projects.forEach(function (p) { urls[p.id] = 'https://docs.google.com/spreadsheets/d/' + p.spreadsheetId + '/edit'; });
  return { sheetUrls: urls };
}

/** Kiểm tra token còn hiệu lực (khi tải lại trang). */
function apiWhoAmI(token) {
  var s = getSession_(token);
  return s ? { role: s.role, name: s.name } : null;
}

// ═════════════════════════════ Đọc dữ liệu ═════════════════════════════

/** Toàn bộ căn của một dự án + biến động gần đây + các căn đang được giữ. */
function apiGetInventory(token, projectId, force) {
  requireView_(token);
  var project = getProject_(projectId);
  var cacheKey = 'inv_' + projectId;
  var result = force ? null : cacheGet_(cacheKey);
  if (!result) {
    result = buildInventory_(project);
    cachePut_(cacheKey, result);
  }
  return result;
}

function buildInventory_(project) {
  var units = [];
  var sourceInfo = [];
  project.sources.filter(isEnabled_).forEach(function (source) {
    var res = readSource_(project, source);
    sourceInfo.push({
      key: sourceKey_(project, source), label: source.label, editable: !!source.editable,
      count: res.units.length, error: res.error || '', statusMode: res.statusMode, legend: res.legend
    });
    units = units.concat(res.units);
  });

  var ss = SpreadsheetApp.openById(project.spreadsheetId);
  try { trackChanges_(ss, units, sourceInfo); } catch (e) { /* theo dõi biến động lỗi không chặn việc xem */ }

  return {
    projectId: project.id,
    units: units,
    sources: sourceInfo,
    feed: readFeed_(ss, CONFIG.feedDays, 400),
    locks: activeLocks_(ss, project.id),
    updatedAt: new Date().toISOString()
  };
}

/** Bảng tham khảo (STK cọc, quỹ VOS...) — trả về giá trị hiển thị. */
function apiGetReference(token, projectId, sheetName) {
  requireView_(token);
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

/** Nhật ký sửa trên app (chỉ admin). */
function apiGetLog(token, projectId, limit) {
  requireAdmin_(token);
  var project = getProject_(projectId);
  var sh = SpreadsheetApp.openById(project.spreadsheetId).getSheetByName(CONFIG.logSheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  var n = Math.min(limit || 100, sh.getLastRow() - 1);
  return sh.getRange(sh.getLastRow() - n + 1, 1, n, 7).getDisplayValues().reverse();
}

// ═════════════════════════════ Cập nhật căn ═════════════════════════════

/**
 * Cập nhật một hoặc nhiều căn.
 * items = [{ sourceKey, row, code, expectedStatus, changes: {status, note, date} }]
 * Trả về [{ code, ok, error }] — căn lỗi không chặn các căn khác.
 */
function apiUpdateUnits(token, projectId, items) {
  var user = requireAdmin_(token).name;
  var project = getProject_(projectId);
  if (!items || !items.length) throw new Error('Chưa chọn căn nào.');
  if (items.length > 200) throw new Error('Tối đa 200 căn mỗi lần.');
  return withLock_(function () {
    var results = updateCore_(project, items, user);
    invalidate_(project.id);
    return results;
  });
}

function updateCore_(project, items, user) {
  var results = [];
  var bySource = {};
  items.forEach(function (it) { (bySource[it.sourceKey] = bySource[it.sourceKey] || []).push(it); });

  Object.keys(bySource).forEach(function (key) {
    var source = project.sources.filter(function (s) { return sourceKey_(project, s) === key; })[0];
    var list = bySource[key];
    var fail = function (msg) { list.forEach(function (it) { results.push({ code: it.code, ok: false, error: msg }); }); };
    if (!source) return fail('Không tìm thấy nguồn dữ liệu.');
    if (!source.editable) return fail('Tab "' + source.sheet + '" chỉ được xem, không sửa trên app.');

    var ss = SpreadsheetApp.openById(source.spreadsheetId || project.spreadsheetId);
    var sh = ss.getSheetByName(source.sheet);
    var meta = readSource_(project, source, sh);
    if (meta.error) return fail(meta.error);
    var logs = [];

    list.forEach(function (it) {
      try {
        var unit = meta.units.filter(function (u) { return u.row === it.row && sameCode_(u.code, it.code); })[0]
          || meta.units.filter(function (u) { return sameCode_(u.code, it.code); })[0];
        if (!unit) throw new Error('Không tìm thấy căn trong tab "' + source.sheet + '".');
        if (it.expectedStatus !== undefined && it.expectedStatus !== unit.status) {
          throw new Error('Căn vừa được cập nhật thành "' + unit.status + '". Tải lại trước khi sửa.');
        }
        if (it.allowedFrom && it.allowedFrom.indexOf(unit.status) < 0) {
          throw new Error('Căn đang ở trạng thái "' + unit.status + '".');
        }
        var changes = it.changes || {};
        Object.keys(changes).forEach(function (field) {
          if (EDITABLE_FIELDS.indexOf(field) < 0) throw new Error('Không được sửa trường ' + field + '.');
          var newVal = String(changes[field] == null ? '' : changes[field]).slice(0, 500);
          var oldVal = field === 'status' ? unit.status : (unit[field] || '');
          if (newVal === String(oldVal)) return;
          if (field === 'status' && meta.colMap.status === undefined) {
            writeStatusColor_(sh, meta, unit.row, newVal);
          } else {
            var col = meta.colMap[field];
            if (col === undefined) throw new Error('Tab không có cột cho trường ' + field + '.');
            var cell = sh.getRange(unit.row, col + 1);
            if (cell.getFormula()) throw new Error('Ô ' + cell.getA1Notation() + ' là công thức, không ghi đè.');
            cell.setValue(field === 'date' ? toDate_(newVal) : newVal);
          }
          if (field === 'status') unit.status = newVal;
          logs.push([new Date(), user, source.sheet, unit.code, field, oldVal, newVal]);
        });
        results.push({ code: it.code, ok: true });
      } catch (e) {
        results.push({ code: it.code, ok: false, error: e.message });
      }
    });
    if (logs.length) appendRows_(ss, CONFIG.logSheetName, ['Thời gian', 'Người cập nhật', 'Tab', 'Mã căn', 'Trường', 'Giá trị cũ', 'Giá trị mới'], logs);
  });
  return results;
}

// ═════════════════════════════ Yêu cầu giữ căn ═════════════════════════════

var REQ_HEAD = ['Mã YC', 'Thời gian', 'Nguồn', 'Mã căn', 'Sale', 'SĐT sale', 'Khách hàng', 'Ghi chú',
  'Trạng thái', 'Người xử lý', 'Thời gian xử lý', 'Giữ đến'];
var REQ = { PENDING: 'Chờ duyệt', APPROVED: 'Đang giữ', REJECTED: 'Từ chối', RELEASED: 'Đã nhả', CONVERTED: 'Đã cọc' };

/** Sale gửi yêu cầu giữ căn. */
function apiRequestLock(token, projectId, req) {
  requireView_(token);
  var project = getProject_(projectId);
  var sale = String(req.sale || '').trim().slice(0, 80);
  var phone = String(req.phone || '').replace(/[^\d+]/g, '').slice(0, 15);
  if (!sale || phone.length < 9) throw new Error('Nhập tên và số điện thoại sale.');
  if (!req.code || !req.sourceKey) throw new Error('Thiếu mã căn.');

  return withLock_(function () {
    var ss = SpreadsheetApp.openById(project.spreadsheetId);
    var rows = readRequests_(ss);
    var dup = rows.filter(function (r) {
      return sameCode_(r.code, req.code) && r.sourceKey === req.sourceKey && (r.state === REQ.PENDING || r.state === REQ.APPROVED);
    })[0];
    if (dup) throw new Error(dup.state === REQ.APPROVED ? 'Căn đang được giữ cho ' + dup.sale + '.' : 'Căn đã có yêu cầu chờ duyệt của ' + dup.sale + '.');
    var id = 'YC' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyMMddHHmmss') + Math.floor(Math.random() * 90 + 10);
    appendRows_(ss, CONFIG.requestSheetName, REQ_HEAD, [[id, new Date(), req.sourceKey, req.code, sale, "'" + phone,
      String(req.customer || '').slice(0, 120), String(req.note || '').slice(0, 300), REQ.PENDING, '', '', '']]);
    invalidate_(project.id);
    return { id: id };
  });
}

/** Danh sách yêu cầu (admin). */
function apiGetRequests(token, projectId) {
  requireAdmin_(token);
  var ss = SpreadsheetApp.openById(getProject_(projectId).spreadsheetId);
  return readRequests_(ss).reverse().slice(0, 300).map(function (r) {
    r.time = r.time ? new Date(r.time).toISOString() : '';
    r.until = r.until ? new Date(r.until).toISOString() : '';
    r.handledAt = r.handledAt ? new Date(r.handledAt).toISOString() : '';
    delete r.rowIndex;
    return r;
  });
}

/**
 * Admin xử lý yêu cầu.
 * action: 'approve' (giữ căn, tình trạng → Đang lock) | 'reject' | 'release' (nhả, → Còn hàng) | 'convert' (→ Đã cọc)
 */
function apiHandleRequest(token, projectId, id, action, hours) {
  var user = requireAdmin_(token).name;
  var project = getProject_(projectId);
  return withLock_(function () {
    var ss = SpreadsheetApp.openById(project.spreadsheetId);
    var r = readRequests_(ss).filter(function (x) { return x.id === id; })[0];
    if (!r) throw new Error('Không tìm thấy yêu cầu ' + id + '.');
    var source = project.sources.filter(function (s) { return sourceKey_(project, s) === r.sourceKey; })[0];
    var canWrite = source && source.editable;
    var now = new Date();
    var next, until = r.until || '', target = null, expected, allowed;

    if (action === 'approve') {
      if (r.state !== REQ.PENDING) throw new Error('Yêu cầu không ở trạng thái chờ duyệt.');
      next = REQ.APPROVED;
      until = new Date(now.getTime() + (Number(hours) || CONFIG.lockHours) * 3600 * 1000);
      target = STATUS.LOCKED; allowed = [STATUS.AVAILABLE, STATUS.CHECK];
    } else if (action === 'reject') {
      if (r.state !== REQ.PENDING) throw new Error('Yêu cầu không ở trạng thái chờ duyệt.');
      next = REQ.REJECTED;
    } else if (action === 'release') {
      if (r.state !== REQ.APPROVED) throw new Error('Căn không ở trạng thái đang giữ.');
      next = REQ.RELEASED; target = STATUS.AVAILABLE; expected = STATUS.LOCKED;
    } else if (action === 'convert') {
      if (r.state !== REQ.APPROVED) throw new Error('Căn không ở trạng thái đang giữ.');
      next = REQ.CONVERTED; target = STATUS.DEPOSITED; expected = STATUS.LOCKED;
    } else {
      throw new Error('Thao tác không hợp lệ.');
    }

    var warning = '';
    if (target && canWrite) {
      var res = updateCore_(project, [{ sourceKey: r.sourceKey, row: -1, code: r.code, expectedStatus: expected, allowedFrom: allowed, changes: { status: target } }], user)[0];
      if (!res.ok) {
        if (action === 'approve') throw new Error('Không giữ được căn: ' + res.error);
        warning = 'Đã cập nhật yêu cầu nhưng chưa đổi tình trạng trên sheet: ' + res.error;
      }
    } else if (target && !canWrite) {
      warning = 'Căn thuộc giỏ chỉ xem; hãy báo đối tác cập nhật tình trạng trên sheet của họ.';
    }

    var sh = ss.getSheetByName(CONFIG.requestSheetName);
    sh.getRange(r.rowIndex, 9, 1, 4).setValues([[next, user, now, until]]);
    invalidate_(project.id);
    return { ok: true, state: next, warning: warning };
  });
}

function readRequests_(ss) {
  var sh = ss.getSheetByName(CONFIG.requestSheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, REQ_HEAD.length).getValues();
  return vals.map(function (v, i) {
    return { rowIndex: i + 2, id: String(v[0]), time: v[1], sourceKey: String(v[2]), code: String(v[3]), sale: String(v[4]),
      phone: String(v[5]), customer: String(v[6]), note: String(v[7]), state: String(v[8]), handledBy: String(v[9]),
      handledAt: v[10], until: v[11] };
  }).filter(function (r) { return r.id; });
}

/** Căn đang giữ hoặc chờ duyệt — gắn lên bảng giỏ hàng. */
function activeLocks_(ss, projectId) {
  var now = Date.now();
  return readRequests_(ss).filter(function (r) { return r.state === REQ.PENDING || r.state === REQ.APPROVED; })
    .map(function (r) {
      var until = r.until instanceof Date ? r.until.getTime() : (r.until ? new Date(r.until).getTime() : 0);
      return { id: r.id, sourceKey: r.sourceKey, code: r.code, sale: r.sale, state: r.state,
        until: until ? new Date(until).toISOString() : '', expired: r.state === REQ.APPROVED && until > 0 && until < now };
    });
}

// ═════════════════════════════ Theo dõi biến động ═════════════════════════════

var FEED_HEAD = ['Thời gian', 'Tab', 'Mã căn', 'Loại biến động', 'Trước', 'Sau'];

/**
 * So sánh giỏ hàng hiện tại với ảnh chụp lần trước; ghi khác biệt vào tab biến động.
 * Bắt được cả thay đổi sửa thẳng trên Google Sheet, không chỉ sửa qua app.
 */
function trackChanges_(ss, units, sourceInfo) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var prev = loadSnapshot_(ss);
    var cur = {};
    units.forEach(function (u) { cur[u.sourceKey + '|' + u.code] = [u.status, u.priceTotal || 0]; });
    if (!prev) { saveSnapshot_(ss, cur); return; }

    var okSources = {};
    sourceInfo.forEach(function (s) { if (!s.error) okSources[s.key] = true; });
    var label = function (k) { var s = k.split('|')[0]; return s.substring(s.indexOf(':') + 1); };
    var code = function (k) { return k.substring(k.indexOf('|') + 1); };
    var now = new Date();
    var rows = [];

    Object.keys(cur).forEach(function (k) {
      var p = prev[k], c = cur[k];
      if (!p) { rows.push([now, label(k), code(k), 'Căn mới', '', c[0]]); return; }
      if (p[0] !== c[0]) rows.push([now, label(k), code(k), 'Đổi trạng thái', p[0], c[0]]);
      if (p[1] && c[1] && p[1] !== c[1]) rows.push([now, label(k), code(k), 'Đổi giá', p[1], c[1]]);
    });
    Object.keys(prev).forEach(function (k) {
      // Chỉ báo "rút khỏi giỏ" khi đọc tab đó thành công, tránh báo nhầm khi tab tạm lỗi.
      if (!cur[k] && okSources[k.split('|')[0]]) rows.push([now, label(k), code(k), 'Rút khỏi giỏ', prev[k][0], '']);
    });
    // Giữ lại dữ liệu cũ của tab đang lỗi để lần sau so sánh tiếp.
    Object.keys(prev).forEach(function (k) { if (!cur[k] && !okSources[k.split('|')[0]]) cur[k] = prev[k]; });

    if (rows.length) {
      appendRows_(ss, CONFIG.feedSheetName, FEED_HEAD, rows.slice(0, 2000));
      saveSnapshot_(ss, cur);
    }
  } finally {
    lock.releaseLock();
  }
}

function readFeed_(ss, days, max) {
  var sh = ss.getSheetByName(CONFIG.feedSheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  var n = Math.min(max * 2, sh.getLastRow() - 1);
  var vals = sh.getRange(sh.getLastRow() - n + 1, 1, n, FEED_HEAD.length).getValues();
  var since = Date.now() - days * 86400000;
  return vals.filter(function (v) { return v[0] instanceof Date && v[0].getTime() >= since; })
    .reverse().slice(0, max)
    .map(function (v) { return { time: v[0].toISOString(), tab: String(v[1]), code: String(v[2]), kind: String(v[3]), before: v[4], after: v[5] }; });
}

function loadSnapshot_(ss) {
  var sh = ss.getSheetByName(CONFIG.snapshotSheetName);
  if (!sh || sh.getLastRow() < 1) return null;
  var s = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(function (r) { return String(r[0]); }).join('');
  try { return JSON.parse(s); } catch (e) { return null; }
}

function saveSnapshot_(ss, obj) {
  var sh = ss.getSheetByName(CONFIG.snapshotSheetName);
  if (!sh) { sh = ss.insertSheet(CONFIG.snapshotSheetName); sh.hideSheet(); }
  var s = JSON.stringify(obj);
  var size = 40000, chunks = [];
  for (var i = 0; i < s.length; i += size) chunks.push([s.substr(i, size)]);
  sh.clearContents();
  var rng = sh.getRange(1, 1, chunks.length, 1);
  rng.setNumberFormat('@');
  rng.setValues(chunks);
}

// ═════════════════════════════ Đọc sheet ═════════════════════════════

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

  // Chú thích màu: chỉ nhận ô CHỈ chứa tên trạng thái (ví dụ "ĐÃ BÁN"), không nhận câu mô tả dài.
  var legend = {};
  for (var r = 0; r < headerIdx; r++) {
    for (var c = 0; c < display[r].length; c++) {
      var st = legendStatus_(display[r][c]);
      var bg = String(bgs[r][c]).toLowerCase();
      if (st && bg && bg !== '#ffffff' && !legend[bg]) legend[bg] = st;
    }
  }
  out.legend = invert_(legend);
  if (colMap.status === undefined) out.statusMode = Object.keys(legend).length ? 'color' : 'none';

  var links = readLinks_(sh, colMap, values.length);
  var group = '';
  var seen = {};

  for (var i = headerIdx + 1; i < values.length; i++) {
    var row = display[i];
    var code = colMap.code !== undefined ? String(row[colMap.code]).trim() : '';
    if (!code) {
      var label = row.filter(function (x) { return String(x).trim() !== ''; });
      if (label.length === 1 && isNaN(Number(label[0]))) group = String(label[0]).trim();
      continue;
    }
    if (normalize_(code) === normalize_(headers[colMap.code])) continue; // tiêu đề lặp lại
    if (seen[normalize_(code)]) continue; // trùng mã trong cùng tab → lấy dòng đầu
    seen[normalize_(code)] = true;

    var get = function (f) { return colMap[f] !== undefined ? String(row[colMap[f]]).trim() : ''; };
    var raw = function (f) { return colMap[f] !== undefined ? values[i][colMap[f]] : ''; };

    var statusRaw = get('status');
    var status = canonStatus_(statusRaw);
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
      key: key + '|' + code,
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
      if (url && /^https?:\/\//i.test(url)) res[f][i] = url;
    }
  });
  return res;
}

function writeStatusColor_(sh, meta, row, status) {
  var rng = sh.getRange(row, 1, 1, sh.getLastColumn());
  if (status === STATUS.AVAILABLE) { rng.setBackground(null); return; }
  var color = meta.legend[status];
  if (!color) {
    throw new Error('Tab này đánh dấu trạng thái bằng màu và chưa có màu cho "' + status +
      '". Thêm cột "TÌNH TRẠNG" vào sheet để dùng đủ trạng thái.');
  }
  rng.setBackground(color);
}

function appendRows_(ss, name, head, rows) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, head.length).setValues(rows);
}

// ═════════════════════════════ Phiên & bảo mật ═════════════════════════════

function appUrl_() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function getProp_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }

function getAdmins_() {
  var raw = getProp_('ADMIN_USERS');
  var admins = {};
  if (raw) { try { admins = JSON.parse(raw); } catch (e) { admins = {}; } }
  var legacy = getProp_('ADMIN_PIN'); // tương thích bản 1
  if (legacy && !Object.keys(admins).length) admins['Admin'] = legacy;
  return admins;
}

function newSession_(data) {
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('sess_' + token, JSON.stringify(data), Math.min(CONFIG.sessionHours, 6) * 3600);
  return token;
}

function getSession_(token) {
  if (!token) return null;
  var s = CacheService.getScriptCache().get('sess_' + token);
  try { return s ? JSON.parse(s) : null; } catch (e) { return null; }
}

function requireView_(token) {
  var s = getSession_(token);
  if (s) return s;
  if (!getProp_('VIEW_PIN') && CONFIG.requireViewPin !== true) return { role: 'public', name: '' };
  throw new Error('AUTH: Phiên xem đã hết hạn, vui lòng nhập lại mã xem.');
}

function requireAdmin_(token) {
  var s = getSession_(token);
  if (!s || s.role !== 'admin') throw new Error('AUTH: Phiên admin đã hết hạn, vui lòng đăng nhập lại.');
  return s;
}

/** Chặn dò PIN: sai 8 lần trong 15 phút → khóa đăng nhập 15 phút. */
function guardBruteForce_() {
  var n = Number(CacheService.getScriptCache().get('login_fail') || 0);
  if (n >= 8) throw new Error('Nhập sai quá nhiều lần. Thử lại sau 15 phút.');
}

function recordFail_() {
  var cache = CacheService.getScriptCache();
  cache.put('login_fail', String(Number(cache.get('login_fail') || 0) + 1), 900);
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('Hệ thống đang bận, thử lại sau vài giây.');
  try { return fn(); } finally { lock.releaseLock(); }
}

function invalidate_(projectId) { CacheService.getScriptCache().remove('inv_' + projectId + '_n'); }

// ═════════════════════════════ Tiện ích ═════════════════════════════

function getProject_(id) {
  var p = CONFIG.projects.filter(function (x) { return x.id === id; })[0];
  if (!p) throw new Error('Không có dự án ' + id + '.');
  return p;
}

function isEnabled_(s) { return s.enabled !== false; }

function sourceKey_(project, source) { return project.id + ':' + source.sheet; }

function normalize_(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function sameCode_(a, b) { return normalize_(a).replace(/\s/g, '') === normalize_(b).replace(/\s/g, ''); }

function codePrefix_(code) { var m = String(code).match(/^([^-]+)-/); return m ? m[1] : ''; }

/** Đưa các cách ghi trạng thái về tên chuẩn; không nhận ra thì giữ nguyên chữ gốc. */
function canonStatus_(raw) {
  var n = normalize_(raw);
  if (!n) return '';
  if (/\b(da ban|sold)\b/.test(n)) return STATUS.SOLD;
  if (/\b(da coc|dat coc|coc)\b/.test(n)) return STATUS.DEPOSITED;
  if (/\b(lock|locked|giu cho|dang giu)\b/.test(n)) return STATUS.LOCKED;
  if (/\bcheck\b/.test(n)) return STATUS.CHECK;
  if (/^(con hang|con|ton|trong|available|mo ban)$/.test(n)) return STATUS.AVAILABLE;
  return String(raw).trim();
}

/** Ô chú thích màu: chỉ là tên trạng thái ngắn, ví dụ "ĐÃ BÁN", "ĐANG LOCK". */
function legendStatus_(raw) {
  var n = normalize_(raw);
  if (!n || n.length > 20 || /[→>,:;]/.test(n)) return '';
  var s = canonStatus_(raw);
  return Object.keys(STATUS).some(function (k) { return STATUS[k] === s; }) ? s : '';
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
function cachePut_(key, obj, ttl) {
  try {
    var s = JSON.stringify(obj);
    var size = 90000;
    var n = Math.ceil(s.length / size);
    var map = {};
    for (var i = 0; i < n; i++) map[key + '_' + i] = s.substr(i * size, size);
    map[key + '_n'] = String(n);
    CacheService.getScriptCache().putAll(map, ttl || CONFIG.cacheSeconds);
  } catch (e) { /* cache lỗi thì bỏ qua */ }
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
