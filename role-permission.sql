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