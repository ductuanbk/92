/**
 * CẤU HÌNH GIỎ HÀNG — Á ĐÔNG LAND
 *
 * Mỗi dự án gồm nhiều "nguồn" (mỗi nguồn là một tab trong Google Sheet).
 * Muốn thêm hoặc bớt tab, chỉ cần sửa danh sách `sources` bên dưới.
 *
 *  - editable: true  → admin được cập nhật Tình trạng, Ghi chú, Ngày trên app.
 *  - editable: false → chỉ xem (ví dụ tab tổng hợp tự động từ đại lý).
 *  - enabled:  false → tạm ẩn khỏi app.
 *
 * App tự dò dòng tiêu đề (dòng có chữ "Mã căn") nên không cần khai báo cột.
 */
var CONFIG = {
  companyName: 'CÔNG TY CỔ PHẦN ĐẦU TƯ Á ĐÔNG LAND',
  hotline: 'Mr. Tuấn: 0901 303 092',

  // Tên tab nhật ký, tự tạo trong từng file khi có cập nhật đầu tiên.
  logSheetName: 'LOG CẬP NHẬT APP',

  // Thời gian giữ cache dữ liệu (giây). Cập nhật trên app sẽ xóa cache ngay.
  cacheSeconds: 60,

  projects: [
    {
      id: 'VHSGP',
      name: 'Vinhomes Saigon Park',
      spreadsheetId: '1xUA-B3RgED5RuSDrDgSB4JDYuhHfNhks--Ga8ZdswVc',
      sources: [
        { sheet: 'GHĐQ ADL', label: 'Độc quyền ADL', kind: 'exclusive', editable: true, enabled: true },
        { sheet: 'GIỎ HÀNG ĐỐI TÁC', label: 'Đối tác', kind: 'partner', editable: false, enabled: true }
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
