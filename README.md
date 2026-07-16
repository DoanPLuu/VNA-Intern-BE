<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

# VNA-Intern-BE

Intern project cho VNA Group Co — hệ thống báo cáo tai nạn lao động (TNLĐ) và quản lý doanh nghiệp, backend NestJS + TypeORM + PostgreSQL.

## Yêu cầu môi trường

- Node.js >= 18
- PostgreSQL >= 18
- npm

## Hướng dẫn cài đặt và chạy (thực hiện đúng thứ tự)

### Bước 1: Cài đặt dependencies

```bash
npm install
```

Các thư viện phục vụ upload/xem/xóa/sửa file (`multer`, `xlsx`) đã có sẵn trong `package.json` nên bước này cài luôn, không cần cài thêm thủ công. Nếu vì lý do nào đó thiếu, cài bổ sung:

```bash
npm install multer xlsx
npm install -D @types/multer
```

### Bước 2: Tạo thư mục uploads

```bash
mkdir uploads
echo "" > uploads/.gitkeep
```

Thư mục này dùng để lưu file upload, đã được thêm vào `.gitignore` (chỉ giữ lại `.gitkeep`):

```gitignore
uploads/*
!uploads/.gitkeep
```

### Bước 3: Tạo database PostgreSQL

Tạo database rỗng tên `be_tt` (hoặc tên khác tuỳ bạn, miễn khớp với `.env`):

```bash
psql -U postgres -c "CREATE DATABASE be_tt;"
```

### Bước 4: Tạo file `.env`

Tạo file `.env` ở thư mục gốc project với nội dung sau (thay giá trị cho phù hợp với máy của bạn):

```properties
# JWT
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_TOKEN_EXPIRES_IN=1h
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
JWT_REFRESH_REMEMBER_TOKEN_EXPIRES_IN=30d

# Database
DB_USERNAME=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=be_tt

# App
API_PORT=8080

# OTP
OTP_EXPIRES_MINUTES=5

# Mail (Gmail SMTP — bắt buộc dùng App Password, xem hướng dẫn bên dưới)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_FROM=your_email@gmail.com
```

> ⚠️ Không commit file `.env` thật (chứa mật khẩu/secret thật) lên git hoặc gửi kèm khi nộp bài. Nếu cần chia sẻ mẫu, tạo file `.env.example` với giá trị giả như trên.

#### Tạo Gmail App Password (bắt buộc, không dùng mật khẩu Gmail thường)

1. Vào [myaccount.google.com](https://myaccount.google.com/) → Bảo mật
2. Bật **Xác minh 2 bước** nếu chưa bật
3. Tìm **Mật khẩu ứng dụng** → Tạo mới → đặt tên `be_project`
4. Copy mật khẩu 16 ký tự vào `MAIL_PASSWORD` trong `.env`

### Bước 5: Chạy server lần đầu để TypeORM tự tạo bảng

```bash
npm run start
```

Đợi server khởi động xong (log báo app đã listen ở `API_PORT` đã cấu hình), nghĩa là toàn bộ bảng theo entity đã được tạo trong database.

Sau đó **dừng server** (`Ctrl+C`), đảm bảo server đang đứng yên — **không** chạy ở watch mode (`start:dev`) trong lúc seed, vì TypeORM có thể tự đồng bộ lại schema mỗi lần reload, dễ đụng độ với lúc đang đổ dữ liệu.

### Bước 6: Seed dữ liệu bằng SQL (chạy tuần tự, đúng thứ tự, không chạy song song)

```bash
psql -U postgres -d be_tt -f sql/roles_permissions.sql
psql -U postgres -d be_tt -f sql/location.sql
psql -U postgres -d be_tt -f sql/business.sql
```

Sau đó chạy tiếp các file seed danh mục TNLĐ (nguyên nhân tai nạn, yếu tố gây chấn thương, loại chấn thương, nghề nghiệp — theo QĐ 27/2018, QĐ 34/2020) trong thư mục `sql/`.

**Trên Windows**, nếu `psql` chưa có trong PATH, dùng đường dẫn đầy đủ:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d be_tt -f sql/roles_permissions.sql
```

> ⚠️ Lưu ý quan trọng:
>
> - `location.sql` dùng `TRUNCATE ... RESTART IDENTITY CASCADE`, sẽ xóa sạch dữ liệu ở các bảng có khóa ngoại trỏ tới `provinces`/`wards` (ví dụ `companies`, `reports`...). **Chỉ chạy trên database mới, chưa có dữ liệu nghiệp vụ.** Nếu database đã có dữ liệu thật, không chạy lại file này.
> - Các seed còn lại dùng `INSERT` thường (chưa idempotent tuyệt đối), chỉ chạy trên database sạch hoặc kiểm tra kỹ trước khi chạy lại để tránh trùng dữ liệu.
> - Không seed và chạy server song song — chạy tuần tự để tránh xung đột giữa TypeORM tự đồng bộ schema (nếu `synchronize: true`) và các lệnh SQL đang chạy.

### Bước 7: Khởi động lại server

```bash
npm run start
# hoặc chạy watch mode khi phát triển
npm run start:dev
```

Server sẵn sàng sử dụng với dữ liệu đầy đủ tại `http://localhost:<API_PORT>`.

## Các lệnh khác

```bash
# production mode
npm run start:prod

# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Tài liệu tham khảo NestJS

- [NestJS Documentation](https://docs.nestjs.com)
- [NestJS Discord](https://discord.gg/G7Qnnhy)
