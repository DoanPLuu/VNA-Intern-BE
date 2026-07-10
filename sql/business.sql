-- ============================================================
-- Seed: business_types + business_industries
-- ============================================================

-- ── Business Types ───────────────────────────────────────────
INSERT INTO business_types (code, name, status) VALUES
  ('TNHH_1TV',  'Công ty TNHH một thành viên', 'ACTIVE'),
  ('TNHH_2TV',  'Công ty TNHH hai thành viên trở lên', 'ACTIVE'),
  ('CO_PHAN',   'Công ty cổ phần', 'ACTIVE'),
  ('HOP_DANH',  'Công ty hợp danh', 'ACTIVE'),
  ('TU_NHAN',   'Doanh nghiệp tư nhân', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- ── Business Industries (100 ngành nghề cấp 4) ───────────────
INSERT INTO business_industries (code, name, status, parent_id) VALUES
  ('0111', 'Trồng lúa', 'ACTIVE', NULL),
  ('0112', 'Trồng ngô và cây lương thực có hạt khác', 'ACTIVE', NULL),
  ('0113', 'Trồng cây lấy củ có chất bột', 'ACTIVE', NULL),
  ('0114', 'Trồng cây mía', 'ACTIVE', NULL),
  ('0115', 'Trồng cây thuốc lá, thuốc lào', 'ACTIVE', NULL),
  ('0116', 'Trồng cây lấy sợi', 'ACTIVE', NULL),
  ('0117', 'Trồng cây có hạt chứa dầu', 'ACTIVE', NULL),
  ('0118', 'Trồng rau, đậu các loại và trồng hoa, cây cảnh', 'ACTIVE', NULL),
  ('0119', 'Trồng cây hàng năm khác', 'ACTIVE', NULL),
  ('0121', 'Trồng cây ăn quả', 'ACTIVE', NULL),
  ('0122', 'Trồng cây lấy quả chứa dầu', 'ACTIVE', NULL),
  ('0123', 'Trồng cây điều', 'ACTIVE', NULL),
  ('0124', 'Trồng cây hồ tiêu', 'ACTIVE', NULL),
  ('0125', 'Trồng cây cao su', 'ACTIVE', NULL),
  ('0126', 'Trồng cây cà phê', 'ACTIVE', NULL),
  ('0127', 'Trồng cây chè', 'ACTIVE', NULL),
  ('0128', 'Trồng cây gia vị, cây dược liệu', 'ACTIVE', NULL),
  ('0129', 'Trồng cây lâu năm khác', 'ACTIVE', NULL),
  ('0130', 'Nhân và chăm sóc cây giống nông nghiệp', 'ACTIVE', NULL),
  ('0141', 'Chăn nuôi trâu, bò', 'ACTIVE', NULL),
  ('0142', 'Chăn nuôi ngựa, lừa, la', 'ACTIVE', NULL),
  ('0144', 'Chăn nuôi dê, cừu', 'ACTIVE', NULL),
  ('0145', 'Chăn nuôi lợn', 'ACTIVE', NULL),
  ('0146', 'Chăn nuôi gia cầm', 'ACTIVE', NULL),
  ('0149', 'Chăn nuôi khác', 'ACTIVE', NULL),
  ('0150', 'Trồng trọt, chăn nuôi hỗn hợp', 'ACTIVE', NULL),
  ('0161', 'Hoạt động dịch vụ trồng trọt', 'ACTIVE', NULL),
  ('0162', 'Hoạt động dịch vụ chăn nuôi', 'ACTIVE', NULL),
  ('0163', 'Hoạt động dịch vụ sau thu hoạch', 'ACTIVE', NULL),
  ('0164', 'Xử lý hạt giống để nhân giống', 'ACTIVE', NULL),
  ('0170', 'Săn bắt, đánh bẫy và hoạt động dịch vụ có liên quan', 'ACTIVE', NULL),
  ('0210', 'Trồng rừng và chăm sóc rừng', 'ACTIVE', NULL),
  ('0221', 'Khai thác gỗ', 'ACTIVE', NULL),
  ('0222', 'Khai thác lâm sản khác trừ gỗ', 'ACTIVE', NULL),
  ('0230', 'Thu nhặt sản phẩm từ rừng không phải gỗ và lâm sản khác', 'ACTIVE', NULL),
  ('0240', 'Hoạt động dịch vụ lâm nghiệp', 'ACTIVE', NULL),
  ('0311', 'Khai thác thuỷ sản biển', 'ACTIVE', NULL),
  ('0312', 'Khai thác thuỷ sản nội địa', 'ACTIVE', NULL),
  ('0321', 'Nuôi trồng thuỷ sản biển', 'ACTIVE', NULL),
  ('0322', 'Nuôi trồng thuỷ sản nội địa', 'ACTIVE', NULL),
  ('0323', 'Sản xuất giống thuỷ sản', 'ACTIVE', NULL),
  ('0510', 'Khai thác và thu gom than cứng', 'ACTIVE', NULL),
  ('0520', 'Khai thác và thu gom than non', 'ACTIVE', NULL),
  ('0610', 'Khai thác dầu thô', 'ACTIVE', NULL),
  ('0620', 'Khai thác khí đốt tự nhiên', 'ACTIVE', NULL),
  ('0710', 'Khai thác quặng sắt', 'ACTIVE', NULL),
  ('0721', 'Khai thác quặng uranium và quặng thorium', 'ACTIVE', NULL),
  ('0722', 'Khai thác quặng kim loại khác không chứa sắt', 'ACTIVE', NULL),
  ('0730', 'Khai thác quặng kim loại quí hiếm', 'ACTIVE', NULL),
  ('0810', 'Khai thác đá, cát, sỏi, đất sét', 'ACTIVE', NULL),
  ('0891', 'Khai thác khoáng hoá chất và khoáng phân bón', 'ACTIVE', NULL),
  ('0892', 'Khai thác và thu gom than bùn', 'ACTIVE', NULL),
  ('0893', 'Khai thác muối', 'ACTIVE', NULL),
  ('0899', 'Khai khoáng khác chưa được phân vào đâu','ACTIVE', NULL),
  ('0910', 'Hoạt động dịch vụ hỗ trợ khai thác dầu thô và khí tự nhiên', 'ACTIVE', NULL),
  ('0990', 'Hoạt động dịch vụ hỗ trợ khai thác mỏ và quặng khác', 'ACTIVE', NULL),
  ('1010', 'Chế biến, bảo quản thịt và các sản phẩm từ thịt', 'ACTIVE', NULL),
  ('1020', 'Chế biến, bảo quản thuỷ sản và các sản phẩm từ thuỷ sản', 'ACTIVE', NULL),
  ('1030', 'Chế biến và bảo quản rau quả', 'ACTIVE', NULL),
  ('1040', 'Sản xuất dầu, mỡ động, thực vật', 'ACTIVE', NULL),
  ('1050', 'Chế biến sữa và các sản phẩm từ sữa', 'ACTIVE', NULL),
  ('1061', 'Xay xát và sản xuất bột thô', 'ACTIVE', NULL),
  ('1062', 'Sản xuất tinh bột và các sản phẩm từ tinh bột', 'ACTIVE', NULL),
  ('1071', 'Sản xuất các loại bánh từ bột', 'ACTIVE', NULL),
  ('1072', 'Sản xuất đường', 'ACTIVE', NULL),
  ('1073', 'Sản xuất ca cao, sôcôla và mứt kẹo', 'ACTIVE', NULL),
  ('1074', 'Sản xuất mì ống, mỳ sợi và sản phẩm tương tự', 'ACTIVE', NULL),
  ('1075', 'Sản xuất món ăn, thức ăn chế biến sẵn', 'ACTIVE', NULL),
  ('1076', 'Sản xuất chè', 'ACTIVE', NULL),
  ('1077', 'Sản xuất cà phê', 'ACTIVE', NULL),
  ('1079', 'Sản xuất thực phẩm khác chưa được phân vào đâu', 'ACTIVE', NULL),
  ('1080', 'Sản xuất thức ăn gia súc, gia cầm và thuỷ sản', 'ACTIVE', NULL),
  ('1101', 'Chưng, tinh cất và pha chế các loại rượu mạnh', 'ACTIVE', NULL),
  ('1102', 'Sản xuất rượu vang', 'ACTIVE', NULL),
  ('1103', 'Sản xuất bia và mạch nha ủ men bia', 'ACTIVE', NULL),
  ('1104', 'Sản xuất đồ uống không cồn, nước khoáng', 'ACTIVE', NULL),
  ('1200', 'Sản xuất sản phẩm thuốc lá', 'ACTIVE', NULL),
  ('1311', 'Sản xuất sợi', 'ACTIVE', NULL),
  ('1312', 'Sản xuất vải dệt thoi', 'ACTIVE', NULL),
  ('1313', 'Hoàn thiện sản phẩm dệt', 'ACTIVE', NULL),
  ('1391', 'Sản xuất vải dệt kim, vải đan móc và vải không dệt khác', 'ACTIVE', NULL),
  ('1392', 'Sản xuất hàng dệt sẵn (trừ trang phục)','ACTIVE', NULL),
  ('1393', 'Sản xuất thảm, chăn, đệm', 'ACTIVE', NULL),
  ('1394', 'Sản xuất các loại dây bện và lưới', 'ACTIVE', NULL),
  ('1399', 'Sản xuất các loại hàng dệt khác chưa được phân vào đâu', 'ACTIVE', NULL),
  ('1410', 'May trang phục (trừ trang phục từ da lông thú)', 'ACTIVE', NULL),
  ('1420', 'Sản xuất sản phẩm từ da lông thú', 'ACTIVE', NULL),
  ('1430', 'Sản xuất trang phục dệt kim, đan móc', 'ACTIVE', NULL),
  ('1511', 'Thuộc, sơ chế da; sơ chế và nhuộm da lông thú', 'ACTIVE', NULL),
  ('1512', 'Sản xuất vali, túi xách và các loại tương tự, sản xuất yên đệm', 'ACTIVE', NULL),
  ('1520', 'Sản xuất giày, dép', 'ACTIVE', NULL),
  ('1610', 'Cưa, xẻ, bào gỗ và bảo quản gỗ', 'ACTIVE', NULL),
  ('1621', 'Sản xuất gỗ dán, gỗ lạng, ván ép và ván mỏng khác', 'ACTIVE', NULL),
  ('1622', 'Sản xuất đồ gỗ xây dựng', 'ACTIVE', NULL),
  ('1623', 'Sản xuất bao bì bằng gỗ', 'ACTIVE', NULL),
  ('1629', 'Sản xuất sản phẩm khác từ gỗ; sản xuất sản phẩm từ tre, nứa, rơm, rạ và vật liệu tết bện', 'ACTIVE', NULL),
  ('1701', 'Sản xuất bột giấy, giấy và bìa', 'ACTIVE', NULL),
  ('1702', 'Sản xuất giấy nhăn, bìa nhăn, bao bì từ giấy và bìa', 'ACTIVE', NULL),
  ('1709', 'Sản xuất các sản phẩm khác từ giấy và bìa chưa được phân vào đâu', 'ACTIVE', NULL),
  ('1811', 'In ấn', 'ACTIVE', NULL)
ON CONFLICT (code) DO NOTHING;

-- Thêm từ dòng này trở xuống không cần xóa db
-- =====================================================================
-- Bổ sung Ngành cấp 1, Ngành cấp 2, Ngành cấp 3 (cha) cho 100 ngành cấp 4
-- Theo QĐ 27/2018/QĐ-TTg - Hệ thống ngành kinh tế Việt Nam
-- =====================================================================

-- Ngành cấp 1
INSERT INTO business_industries (code, name, level, status, parent_id) VALUES
  ('A', 'NÔNG NGHIỆP, LÂM NGHIỆP VÀ THUỶ SẢN', 'Cấp 1', 'ACTIVE', NULL),
  ('B', 'KHAI KHOÁNG', 'Cấp 1', 'ACTIVE', NULL),
  ('C', 'CÔNG NGHIỆP CHẾ BIẾN, CHẾ TẠO', 'Cấp 1', 'ACTIVE', NULL)
ON CONFLICT (code) DO UPDATE SET level = EXCLUDED.level;

-- Ngành cấp 2
INSERT INTO business_industries (code, name, level, status, parent_id) VALUES
  ('01', 'Nông nghiệp và hoạt động dịch vụ có liên quan', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'A')),
  ('02', 'Lâm nghiệp và hoạt động dịch vụ có liên quan', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'A')),
  ('03', 'Khai thác, nuôi trồng thủy sản', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'A')),
  ('05', 'Khai thác than cứng và than non', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'B')),
  ('06', 'Khai thác dầu thô và khí đốt tự nhiên', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'B')),
  ('07', 'Khai thác quặng kim loại', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'B')),
  ('08', 'Khai khoáng khác', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'B')),
  ('09', 'Hoạt động dịch vụ hỗ trợ khai khoáng', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'B')),
  ('10', 'Sản xuất, chế biến thực phẩm', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'C')),
  ('11', 'Sản xuất đồ uống', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'C')),
  ('12', 'Sản xuất sản phẩm thuốc lá', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'C')),
  ('13', 'Dệt', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'C')),
  ('14', 'Sản xuất trang phục', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'C')),
  ('15', 'Sản xuất da và các sản phẩm có liên quan', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'C')),
  ('16', 'Chế biến gỗ và sản xuất sản phẩm từ gỗ, tre, nứa (trừ giường, tủ, bàn, ghế); sản xuất sản phẩm từ rơm, rạ và vật liệu tết bện', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'C')),
  ('17', 'Sản xuất giấy và sản phẩm từ giấy', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'C')),
  ('18', 'In, sao chép bản ghi các loại', 'Cấp 2', 'ACTIVE', (SELECT id FROM business_industries WHERE code = 'C'))
ON CONFLICT (code) DO UPDATE SET level = EXCLUDED.level, parent_id = EXCLUDED.parent_id;

-- Ngành cấp 3
INSERT INTO business_industries (code, name, level, status, parent_id) VALUES
  ('011', 'Trồng cây hàng năm', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '01')),
  ('012', 'Trồng cây lâu năm', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '01')),
  ('013', 'Nhân và chăm sóc cây giống nông nghiệp', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '01')),
  ('014', 'Chăn nuôi', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '01')),
  ('015', 'Trồng trọt, chăn nuôi hỗn hợp', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '01')),
  ('016', 'Hoạt động dịch vụ nông nghiệp', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '01')),
  ('017', 'Săn bắt, đánh bẫy và hoạt động dịch vụ có liên quan', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '01')),
  ('021', 'Trồng rừng, chăm sóc rừng và ươm giống cây lâm nghiệp', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '02')),
  ('022', 'Khai thác gỗ', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '02')),
  ('023', 'Khai thác, thu nhặt lâm sản khác trừ gỗ', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '02')),
  ('024', 'Hoạt động dịch vụ lâm nghiệp', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '02')),
  ('031', 'Khai thác thủy sản', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '03')),
  ('032', 'Nuôi trồng thủy sản', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '03')),
  ('051', 'Khai thác và thu gom than cứng', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '05')),
  ('052', 'Khai thác và thu gom than non', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '05')),
  ('061', 'Khai thác dầu thô', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '06')),
  ('062', 'Khai thác khí đốt tự nhiên', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '06')),
  ('071', 'Khai thác quặng sắt', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '07')),
  ('072', 'Khai thác quặng không chứa sắt (trừ quặng kim loại quý hiếm)', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '07')),
  ('073', 'Khai thác quặng kim loại quý hiếm', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '07')),
  ('081', 'Khai thác đá, cát, sỏi, đất sét', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '08')),
  ('089', 'Khai khoáng chưa được phân vào đâu', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '08')),
  ('091', 'Hoạt động dịch vụ hỗ trợ khai thác dầu thô và khí tự nhiên', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '09')),
  ('099', 'Hoạt động dịch vụ hỗ trợ khai khoáng khác', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '09')),
  ('101', 'Chế biến, bảo quản thịt và các sản phẩm từ thịt', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '10')),
  ('102', 'Chế biến, bảo quản thuỷ sản và các sản phẩm từ thuỷ sản', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '10')),
  ('103', 'Chế biến và bảo quản rau quả', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '10')),
  ('104', 'Sản xuất dầu, mỡ động, thực vật', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '10')),
  ('105', 'Chế biến sữa và các sản phẩm từ sữa', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '10')),
  ('106', 'Xay xát và sản xuất bột', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '10')),
  ('107', 'Sản xuất thực phẩm khác', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '10')),
  ('108', 'Sản xuất thức ăn gia súc, gia cầm và thuỷ sản', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '10')),
  ('110', 'Sản xuất đồ uống', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '11')),
  ('120', 'Sản xuất sản phẩm thuốc lá', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '12')),
  ('131', 'Sản xuất sợi, vải dệt thoi và hoàn thiện sản phẩm dệt', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '13')),
  ('139', 'Sản xuất hàng dệt khác', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '13')),
  ('141', 'May trang phục (trừ trang phục từ da lông thú)', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '14')),
  ('142', 'Sản xuất sản phẩm từ da lông thú', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '14')),
  ('143', 'Sản xuất trang phục dệt kim, đan móc', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '14')),
  ('151', 'Thuộc, sơ chế da; sản xuất va li, túi xách, yên đệm; sơ chế và nhuộm da lông thú', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '15')),
  ('152', 'Sản xuất giày, dép', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '15')),
  ('161', 'Cưa, xẻ, bào gỗ và bảo quản gỗ', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '16')),
  ('162', 'Sản xuất sản phẩm từ gỗ, tre, nứa (trừ giường, tủ, bàn, ghế); sản xuất sản phẩm từ rơm, rạ và vật liệu tết bện', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '16')),
  ('170', 'Sản xuất giấy và sản phẩm từ giấy', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '17')),
  ('181', 'In ấn và dịch vụ liên quan đến in', 'Cấp 3', 'ACTIVE', (SELECT id FROM business_industries WHERE code = '18'))
ON CONFLICT (code) DO UPDATE SET level = EXCLUDED.level, parent_id = EXCLUDED.parent_id;

-- Cập nhật parent_id và level cho 100 Ngành cấp 4 đã có
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '011') WHERE code = '0111';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '011') WHERE code = '0112';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '011') WHERE code = '0113';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '011') WHERE code = '0114';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '011') WHERE code = '0115';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '011') WHERE code = '0116';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '011') WHERE code = '0117';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '011') WHERE code = '0118';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '011') WHERE code = '0119';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '012') WHERE code = '0121';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '012') WHERE code = '0122';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '012') WHERE code = '0123';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '012') WHERE code = '0124';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '012') WHERE code = '0125';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '012') WHERE code = '0126';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '012') WHERE code = '0127';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '012') WHERE code = '0128';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '012') WHERE code = '0129';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '013') WHERE code = '0130';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '014') WHERE code = '0141';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '014') WHERE code = '0142';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '014') WHERE code = '0144';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '014') WHERE code = '0145';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '014') WHERE code = '0146';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '014') WHERE code = '0149';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '015') WHERE code = '0150';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '016') WHERE code = '0161';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '016') WHERE code = '0162';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '016') WHERE code = '0163';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '016') WHERE code = '0164';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '017') WHERE code = '0170';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '021') WHERE code = '0210';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '022') WHERE code = '0221';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '023') WHERE code = '0222';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '023') WHERE code = '0230';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '024') WHERE code = '0240';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '031') WHERE code = '0311';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '031') WHERE code = '0312';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '032') WHERE code = '0321';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '032') WHERE code = '0322';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '032') WHERE code = '0323';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '051') WHERE code = '0510';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '052') WHERE code = '0520';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '061') WHERE code = '0610';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '062') WHERE code = '0620';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '071') WHERE code = '0710';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '072') WHERE code = '0721';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '072') WHERE code = '0722';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '073') WHERE code = '0730';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '081') WHERE code = '0810';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '089') WHERE code = '0891';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '089') WHERE code = '0892';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '089') WHERE code = '0893';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '089') WHERE code = '0899';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '091') WHERE code = '0910';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '099') WHERE code = '0990';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '101') WHERE code = '1010';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '102') WHERE code = '1020';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '103') WHERE code = '1030';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '104') WHERE code = '1040';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '105') WHERE code = '1050';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '106') WHERE code = '1061';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '106') WHERE code = '1062';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '107') WHERE code = '1071';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '107') WHERE code = '1072';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '107') WHERE code = '1073';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '107') WHERE code = '1074';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '107') WHERE code = '1075';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '107') WHERE code = '1076';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '107') WHERE code = '1077';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '107') WHERE code = '1079';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '108') WHERE code = '1080';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '110') WHERE code = '1101';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '110') WHERE code = '1102';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '110') WHERE code = '1103';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '110') WHERE code = '1104';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '120') WHERE code = '1200';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '131') WHERE code = '1311';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '131') WHERE code = '1312';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '131') WHERE code = '1313';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '139') WHERE code = '1391';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '139') WHERE code = '1392';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '139') WHERE code = '1393';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '139') WHERE code = '1394';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '139') WHERE code = '1399';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '141') WHERE code = '1410';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '142') WHERE code = '1420';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '143') WHERE code = '1430';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '151') WHERE code = '1511';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '151') WHERE code = '1512';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '152') WHERE code = '1520';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '161') WHERE code = '1610';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '162') WHERE code = '1621';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '162') WHERE code = '1622';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '162') WHERE code = '1623';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '162') WHERE code = '1629';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '170') WHERE code = '1701';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '170') WHERE code = '1702';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '170') WHERE code = '1709';
UPDATE business_industries SET level = 'Cấp 4', parent_id = (SELECT id FROM business_industries WHERE code = '181') WHERE code = '1811';