// Bảng giá trên trang giới thiệu lấy từ cấu hình máy chủ (src/config.js), không phải sửa hai nơi.
(function () {
  var box = document.getElementById('plans');
  if (!box) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  fetch('/api/plans').then(function (r) { return r.json(); }).then(function (d) {
    document.getElementById('trialDays').textContent = d.trialDays;
    box.innerHTML = d.plans.map(function (p) {
      var price = p.price == null ? 'Liên hệ' : p.price.toLocaleString('vi-VN') + 'đ<small> / tháng</small>';
      var cta = p.price == null
        ? '<a class="btn ghost" href="' + esc(d.product.supportZalo) + '" target="_blank" rel="noopener">Liên hệ tư vấn</a>'
        : '<a class="btn ' + (p.popular ? '' : 'navy') + '" href="/app/#/dang-ky">Dùng thử miễn phí</a>';
      return '<div class="plan' + (p.popular ? ' pop' : '') + '">' + (p.popular ? '<span class="rb">Phổ biến</span>' : '') +
        '<h3>' + esc(p.name) + '</h3><div class="pr">' + price + '</div><ul>' + p.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' + cta + '</div>';
    }).join('');
  }).catch(function () { box.innerHTML = '<p class="note">Vui lòng gọi 0901 30 30 92 để nhận bảng giá.</p>'; });
})();
