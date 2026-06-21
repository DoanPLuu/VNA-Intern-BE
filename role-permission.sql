-- Roles
INSERT INTO roles (code, name, created_at, updated_at) VALUES
('ADMIN', 'Quản trị viên', NOW(), NOW()),
('MANAGER', 'Quản lý', NOW(), NOW()),
('STAFF', 'Nhân viên', NOW(), NOW()),
('AUDITOR', 'Kiểm toán viên', NOW(), NOW()),
('VIEWER', 'Người xem', NOW(), NOW());

-- Permissions
INSERT INTO permissions (code, name, type, parent_id, created_at, updated_at) VALUES
('VIEW_USER', 'Xem người dùng', 'VIEW', NULL, NOW(), NOW()),
('CREATE_USER', 'Tạo người dùng', 'CREATE', NULL, NOW(), NOW()),
('UPDATE_USER', 'Cập nhật người dùng', 'UPDATE', NULL, NOW(), NOW()),
('DELETE_USER', 'Xóa người dùng', 'DELETE', NULL, NOW(), NOW()),
('VIEW_REPORT', 'Xem báo cáo', 'VIEW', NULL, NOW(), NOW());

-- Role - Permission (role_permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), -- ADMIN có tất cả
(2, 1), (2, 2), (2, 3), (2, 5),          -- MANAGER không có DELETE
(3, 1), (3, 2),                           -- STAFF chỉ VIEW + CREATE
(4, 1), (4, 5),                           -- AUDITOR chỉ VIEW
(5, 1);                                   -- VIEWER chỉ VIEW_USER

-- Thêm permissions cho company
INSERT INTO permissions (code, name, type, parent_id, created_at, updated_at) VALUES
('VIEW_COMPANY', 'Xem doanh nghiệp', 'VIEW', NULL, NOW(), NOW()),
('CREATE_COMPANY', 'Tạo doanh nghiệp', 'CREATE', NULL, NOW(), NOW()),
('UPDATE_COMPANY', 'Cập nhật doanh nghiệp', 'UPDATE', NULL, NOW(), NOW()),
('DELETE_COMPANY', 'Xóa doanh nghiệp', 'DELETE', NULL, NOW(), NOW()),
('BAN_COMPANY', 'Khóa/mở khóa doanh nghiệp', 'UPDATE', NULL, NOW(), NOW());

-- Gán cho roles (giả sử permissions company có id 6-10)
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 6), (1, 7), (1, 8), (1, 9), (1, 10), -- ADMIN có tất cả
(2, 6), (2, 7), (2, 8), (2, 10),          -- MANAGER không có DELETE
(3, 6), (3, 7),                            -- STAFF chỉ VIEW + CREATE
(4, 6),                                    -- AUDITOR chỉ VIEW
(5, 6);                                    -- VIEWER chỉ VIEW_COMPANY

 INSERT INTO permissions (code, name, type, parent_id, created_at, updated_at) VALUES
    ('CREATE_REPORT', 'Tạo báo cáo', 'CREATE', NULL, NOW(), NOW()),
    ('UPDATE_REPORT', 'Cập nhật báo cáo', 'UPDATE', NULL, NOW(), NOW()),
    ('APPROVE_REPORT', 'Duyệt báo cáo', 'UPDATE', NULL, NOW(), NOW()),
    ('REJECT_REPORT', 'Từ chối báo cáo', 'UPDATE', NULL, NOW(), NOW());

    -- Gán cho roles (giả sử các permission trên có id 11-14)
    -- VIEW_REPORT (id=5) đã có, gán thêm cho các role phù hợp
    INSERT INTO role_permissions (role_id, permission_id) VALUES
    (1, 11), (1, 12), (1, 13), (1, 14),  -- ADMIN có tất cả
    (2, 11), (2, 12), (2, 13), (2, 14),  -- MANAGER (Sở) có tất cả
    (3, 11), (3, 12);                     -- STAFF chỉ tạo + cập nhật