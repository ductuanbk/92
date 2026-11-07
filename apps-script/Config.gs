/**
 * CẤU HÌNH GIỎ HÀNG — Á ĐÔNG LAND (phiên bản 2)
 *
 * Mỗi dự án gồm nhiều "nguồn" (mỗi nguồn là một tab trong Google Sheet).
 * Muốn thêm hoặc bớt tab, chỉ cần sửa danh sách `sources` bên dưới.
 *
 *  - editable: true  → admin được cập nhật Tình trạng, Ghi chú, Ngày trên app.
 *  - editable: false → chỉ xem (ví dụ tab tổng hợp tự động từ đại lý).
 *  - enabled:  false → tạm ẩn khỏi app.
 *
 * App tự dò dòng tiêu đề (dòng có chữ "Mã căn") nên không cần khai báo cột.
 * Mã PIN admin và mã xem đặt bằng hàm setupAccess() trong Code.gs, không ghi ở đây.
 */
var CONFIG = {
  version: '4.2',
  companyName: 'CÔNG TY CỔ PHẦN ĐẦU TƯ Á ĐÔNG LAND',
  hotline: '0933 772 422',
  zalo: 'https://zalo.me/386470265573132310',

  // Trang bảng hàng công khai cho khách (website riêng, đọc qua ?api=public).
  // Chỉ trả các trường an toàn: không STK, ghi chú, đối tác, người giữ căn, tên giỏ.
  publicSite: {
    enabled: true,
    showSold: false,          // ẩn căn đã bán
    cacheSeconds: 120,
    showLinks: true,          // gửi link phiếu tính giá (Link PTG) và link chỉ căn của từng căn
    showExtraPrices: true,    // gửi thêm giá chưa VAT và giá vay (nếu sheet có cột)
    // Tab riêng cho căn thuộc giỏ có kind: 'exclusive' (GHĐQ). Đổi tên ở đây nếu cần.
    exclusiveTab: { enabled: true, short: 'ĐQ', label: 'ĐQ Á Đông Land', title: 'Giỏ hàng độc quyền Á Đông Land' },
    // Trạng thái nội bộ → chữ hiển thị cho khách. Trạng thái khác hiện "Liên hệ".
    statusLabels: { 'Còn hàng': 'Còn hàng', 'Check admin': 'Đang giữ chỗ', 'Đang lock': 'Đang giữ chỗ', 'Đã cọc': 'Đang giữ chỗ', 'Đã bán': 'Đã bán' }
  },

  // Các tab app tự tạo trong file Google Sheet của từng dự án.
  logSheetName: 'LOG CẬP NHẬT APP',        // ai sửa gì trên app
  feedSheetName: 'BIẾN ĐỘNG GIỎ HÀNG',     // căn mới, rút giỏ, đổi trạng thái, đổi giá (kể cả sửa thẳng trên sheet)
  requestSheetName: 'YÊU CẦU GIỮ CĂN',     // sale xin giữ căn, admin duyệt
  snapshotSheetName: '_APP_SNAPSHOT',      // ảnh chụp giỏ hàng để so sánh biến động (tab ẩn)

  // true: bắt buộc nhập mã xem (VIEW_PIN) trước khi xem app nội bộ, chưa đặt mã thì chỉ admin vào được.
  // Chỉ cần bật nếu app nội bộ được triển khai "Bất kỳ ai, kể cả ẩn danh" hoặc nhúng vào website.
  requireViewPin: false,

  cacheSeconds: 60,       // giữ cache dữ liệu (giây); cập nhật trên app xóa cache ngay
  lockHours: 24,          // thời hạn giữ căn mặc định khi admin duyệt
  feedDays: 7,            // số ngày biến động hiển thị
  recentHours: 48,        // căn biến động trong khoảng này được gắn nhãn "Mới"
  sessionHours: 6,        // thời gian đăng nhập (tối đa 6 giờ do giới hạn của Google)

  projects: [
    {
      id: 'VHSGP',
      name: 'Vinhomes Saigon Park',
      spreadsheetId: '1xUA-B3RgED5RuSDrDgSB4JDYuhHfNhks--Ga8ZdswVc',
      sources: [
        { sheet: 'GHĐQ ADL', label: 'Độc quyền ADL', kind: 'exclusive', editable: true, enabled: true },
        { sheet: 'GIỎ HÀNG ĐỐI TÁC', label: 'Đối tác', kind: 'partner', editable: false, enabled: true }
        // Thêm public: false vào một nguồn để không đưa giỏ đó lên trang công khai.
      ],
      references: [
        { sheet: 'STK CỌC VHSGP', label: 'STK cọc / ký quỹ' },
        { sheet: 'Quỹ VOS', label: 'Quỹ VOS' }
      ]
    },
    {
      id: 'VHCG',
      name: 'Vinhomes Green Paradise',
      spreadsheetId: '1F7AQQ9vbz4oPSUIVA2UQIQMUyFZxjOMbZS9HokU1eRM',
      sources: [
        { sheet: 'GHĐQ', label: 'Độc quyền ADL', kind: 'exclusive', editable: true, enabled: true },
        { sheet: 'GIỎ HÀNG ĐỐI TÁC', label: 'Đối tác', kind: 'partner', editable: true, enabled: true }
        // File VHSGP cũng có tab "VHCG ADL". Nếu tab đó còn dùng, bật dòng dưới:
        // { spreadsheetId: '1xUA-B3RgED5RuSDrDgSB4JDYuhHfNhks--Ga8ZdswVc', sheet: 'VHCG ADL', label: 'Độc quyền (file SGP)', kind: 'exclusive', editable: true, enabled: true }
      ],
      references: [
        { sheet: 'STK VỊNH NGỌC', label: 'STK Vịnh Ngọc' },
        { sheet: 'STK VỊNH TIÊN', label: 'STK Vịnh Tiên' },
        { sheet: 'MTR- HẠN BG (Qũy căn đặc thù)', label: 'Hạn bàn giao' }
      ]
    }
  ]
};

/** Tên chuẩn của các trạng thái hiển thị trên app. */
var STATUS = {
  AVAILABLE: 'Còn hàng',
  CHECK: 'Check admin',
  LOCKED: 'Đang lock',
  DEPOSITED: 'Đã cọc',
  SOLD: 'Đã bán'
};

/**
 * Tên cột trong sheet → trường dữ liệu trên app.
 * So khớp không phân biệt hoa thường và dấu, lấy cột đầu tiên khớp.
 */
var FIELD_ALIASES = {
  code: ['ma can moi', 'ma can', 'ma can tm'],
  zone: ['khu', 'phan khu'],
  street: ['duong', 'day / quy', 'day'],
  type: ['loai can'],
  handover: ['tcbg moi', 'tcbg'],
  partner: ['doi tac'],
  direction: ['huong'],
  land: ['dt dat', 'dt dat (m2)', 'dt dat (m²)'],
  build: ['dtxd', 'dtxd (m2)', 'dtxd (m²)'],
  stk: ['stk'],
  priceExVat: ['gia chua gom vat'],
  priceTotal: ['gia gom vat va kpbt', 'gia gom vat + kpbt'],
  priceLoan: ['gia vay 18t'],
  status: ['tinh trang'],
  note: ['ghi chu', 'noted'],
  date: ['ngay chia gio', 'ngay coc'],
  ptg: ['link ptg', 'ptg + chi can', 'ptg'],
  unitLink: ['chi can', 'link chi can']
};

/** Trường admin được sửa trên app (giá không sửa vì thường là công thức). */
var EDITABLE_FIELDS = ['status', 'note', 'date'];
