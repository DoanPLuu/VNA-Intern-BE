-- ==========================================================
-- Danh mục các yếu tố gây chấn thương
-- Theo Thông tư 23/LĐTBXH-TT
-- Bảng: injury_factors(code, name, status)
-- ==========================================================

INSERT INTO injury_factors (code, name, status) VALUES
('01', 'Điện', true),
('0101', 'Điện cao thế', true),

('02', 'Phóng xạ', true),

('03', 'Do phương tiện vận tải', true),

('04', 'Do thiết bị chịu áp lực', true),

('05', 'Do thiết bị nâng, thang máy', true),

('06', 'Nổ vật liệu nổ', true),

('07', 'Máy móc, thiết bị cán, cuốn, kẹp, cắt, va đập', true),

('08', 'Bỏng hóa chất', true),

('09', 'Ngộ độc hóa chất', true),

('10', 'Cháy nổ xăng dầu', true),

('11', 'Sập đổ công trình', true),
('1101', 'Sập đổ công trình cũ', true),
('1102', 'Sập đổ công trình mới', true),

('12', 'Sập lò, sập đất đá trong xây dựng, khai thác, thăm dò khoáng sản', true),

('13', 'Cây hoặc vật đổ, đè, rơi', true),

('14', 'Ngã cao', true),

('15', 'Chết đuối', true),

('16', 'Các loại khác', true)

ON CONFLICT (code) DO NOTHING;
```
