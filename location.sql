-- ============================================================
-- Tạo bảng provinces và districts (mô hình 2 cấp từ 1/7/2025)
-- districts = xã/phường/thị trấn trực thuộc tỉnh
-- ============================================================
USE be_tt;
CREATE TABLE IF NOT EXISTS "provinces" (
    "province_id"   INTEGER      PRIMARY KEY,
    "province_name" VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS "districts" (
    "district_id"   INTEGER      PRIMARY KEY,
    "district_name" VARCHAR(100) NOT NULL,
    "province_id"   INTEGER      NOT NULL REFERENCES "provinces"("province_id")
);

CREATE INDEX IF NOT EXISTS idx_districts_province_id ON districts(province_id);

-- ============================================================
-- Seed 34 tỉnh/thành sau sáp nhập (hiệu lực 1/7/2025)
-- Nguồn: Nghị quyết 202/2025/QH15
-- ============================================================
INSERT INTO provinces (province_id, province_name) VALUES
(1,  'Hà Nội'),
(2,  'Hà Giang'),
(3,  'Cao Bằng'),
(4,  'Lào Cai'),
(5,  'Điện Biên'),
(6,  'Tuyên Quang'),
(7,  'Thái Nguyên'),
(8,  'Lạng Sơn'),
(9,  'Bắc Giang'),
(10, 'Phú Thọ'),
(11, 'Vĩnh Phúc'),
(12, 'Bắc Ninh'),
(13, 'Quảng Ninh'),
(14, 'Hải Phòng'),
(15, 'Hưng Yên'),
(16, 'Thái Bình'),
(17, 'Nam Định'),
(18, 'Thanh Hóa'),
(19, 'Nghệ An'),
(20, 'Hà Tĩnh'),
(21, 'Quảng Bình'),
(22, 'Thừa Thiên Huế'),
(23, 'Đà Nẵng'),
(24, 'Quảng Nam'),
(25, 'Quảng Ngãi'),
(26, 'Bình Định'),
(27, 'Khánh Hòa'),
(28, 'Đắk Lắk'),
(29, 'Lâm Đồng'),
(30, 'Bình Phước'),
(31, 'Tây Ninh'),
(32, 'Bình Dương'),
(33, 'Đồng Nai'),
(34, 'Thành phố Hồ Chí Minh'),
(35, 'Long An'),
(36, 'Đồng Tháp'),
(37, 'An Giang'),
(38, 'Tiền Giang'),
(39, 'Kiên Giang'),
(40, 'Cần Thơ'),
(41, 'Sóc Trăng'),
(42, 'Bạc Liêu'),
(43, 'Cà Mau')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Ghi chú: districts (xã/phường) cần import từ bộ dữ liệu
-- chính thức của Bộ Nội vụ hoặc VNDIVISIONDATA sau 1/7/2025
-- vì có ~3.300+ đơn vị cấp xã mới sau sáp nhập
-- Bạn có thể import từ file CSV tại:
-- https://danhmuchanhchinh.gso.gov.vn
-- ============================================================