// Cấu hình sản phẩm. Đổi tên sản phẩm, bảng giá, tài khoản nhận tiền tại đây.
// Biến môi trường (file .env hoặc khai báo khi chạy) ghi đè các giá trị mặc định.

const env = process.env;

export const PRODUCT = {
  name: env.PRODUCT_NAME || 'ADL Giỏ Hàng',
  tagline: 'Quản lý giỏ hàng bất động sản cho sàn và đại lý',
  vendor: 'CÔNG TY CỔ PHẦN ĐẦU TƯ Á ĐÔNG LAND',
  vendorTaxCode: '0316796067',
  vendorAddress: 'T4-01 Đường T4, Khu The Manhattan, Vinhomes Grand Park, Phường Long Bình, Thành phố Hồ Chí Minh',
  supportPhone: env.SUPPORT_PHONE || '0901 30 30 92',
  supportZalo: env.SUPPORT_ZALO || 'https://zalo.me/386470265573132310',
  supportEmail: env.SUPPORT_EMAIL || ''
};

// Tài khoản nhận thanh toán (chuyển khoản, mã VietQR).
export const BANK = {
  bin: env.BANK_BIN || '970407',            // Techcombank
  code: env.BANK_CODE || 'TCB',
  name: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank), Chi nhánh An Phú',
  account: env.BANK_ACCOUNT || '19037047058017',
  holder: env.BANK_HOLDER || 'CONG TY CO PHAN DAU TU A DONG LAND'
};

// Các gói dịch vụ. Giá là ĐỀ XUẤT, đã gồm VAT; chỉnh theo quyết định kinh doanh.
// limit null = không giới hạn.
export const PLANS = {
  trial: { name: 'Dùng thử', price: 0, projects: 3, units: 2000, members: 10, days: 14, hidden: true },
  starter: { name: 'Cơ bản', price: 990000, projects: 2, units: 1500, members: 5,
    features: ['2 dự án, 1.500 căn', '5 tài khoản', 'Bảng hàng công khai và mã nhúng website', 'Nhập từ Excel, Google Sheet'] },
  pro: { name: 'Chuyên nghiệp', price: 2490000, projects: 10, units: 10000, members: 30, popular: true,
    features: ['10 dự án, 10.000 căn', '30 tài khoản', 'Đồng bộ Google Sheet tự động', 'Duyệt giữ căn, nhật ký biến động', 'Thương hiệu riêng trên bảng hàng'] },
  business: { name: 'Doanh nghiệp', price: null, projects: null, units: null, members: null,
    features: ['Không giới hạn dự án, căn, tài khoản', 'Tên miền riêng', 'Hỗ trợ chuyển dữ liệu', 'Hỗ trợ ưu tiên'] }
};
// Trả trước 12 tháng chỉ tính 10 tháng.
export const YEARLY_MONTHS_CHARGED = 10;
// Hết hạn: vẫn xem được dữ liệu; bảng hàng công khai còn chạy thêm số ngày này rồi tạm ngưng.
export const GRACE_DAYS = 7;

export const STATUS = { AVAILABLE: 'Còn hàng', CHECK: 'Check admin', LOCKED: 'Đang lock', DEPOSITED: 'Đã cọc', SOLD: 'Đã bán' };
export const STATUS_LIST = Object.values(STATUS);
// Trạng thái hiển thị cho khách trên bảng hàng công khai.
export const PUBLIC_STATUS = { 'Còn hàng': 'Còn hàng', 'Check admin': 'Đang giữ chỗ', 'Đang lock': 'Đang giữ chỗ', 'Đã cọc': 'Đang giữ chỗ', 'Đã bán': 'Đã bán' };

export const SETTINGS = {
  port: Number(env.PORT || 8080),
  dbFile: env.DB_FILE || 'data/gio-hang.db',
  // Địa chỉ công khai của phần mềm, ví dụ https://giohang.adongland.vn (dùng trong link mời, mã nhúng).
  baseUrl: (env.BASE_URL || '').replace(/\/$/, ''),
  // Email được cấp quyền quản trị hệ thống (duyệt thanh toán, quản lý khách hàng), cách nhau bởi dấu phẩy.
  superadmins: (env.SUPERADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  secureCookies: env.SECURE_COOKIES ? env.SECURE_COOKIES === '1' : (env.BASE_URL || '').startsWith('https://'),
  sessionDays: 30,
  holdHours: 24,
  sheetSyncMinutes: Number(env.SHEET_SYNC_MINUTES || 10),
  maxBodyBytes: 5 * 1024 * 1024
};
