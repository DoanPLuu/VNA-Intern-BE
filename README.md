<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## ⚠️ Thứ tự khởi tạo database (bắt buộc theo đúng trình tự)

Project dùng TypeORM để tự tạo bảng theo entity, sau đó dùng các file SQL để đổ dữ liệu tham chiếu (location, business, roles/permissions, danh mục TNLĐ...). **Phải làm đúng thứ tự sau, không chạy tắt hay đảo bước:**

1. **Chạy server một lần để TypeORM tạo bảng:**

   ```bash
   npm run start
   ```

   Đợi server khởi động xong (log báo app đã listen ở port cấu hình), nghĩa là toàn bộ bảng theo entity đã được tạo trong database.

2. **Dừng server** (`Ctrl+C`), hoặc đảm bảo server đang ở trạng thái đứng yên — **không** đang restart/reload (đặc biệt nếu chạy `start:dev` ở watch mode, vì TypeORM có thể tự đồng bộ lại schema mỗi lần reload, dễ đụng độ với lúc đang đổ dữ liệu).

3. **Chạy lần lượt từng file SQL seed theo đúng thứ tự dưới đây — chạy tuần tự, không chạy song song nhiều file cùng lúc:**
   1. `roles_permissions.sql` — seed roles, permissions và role_permissions (ADMIN, MANAGER, STAFF, AUDITOR, VIEWER)
   2. `location.sql` — seed 34 tỉnh/thành và 3321 phường/xã (theo đợt sáp nhập hành chính 2025)
   3. `business.sql` — seed loại hình kinh doanh và ngành nghề kinh doanh (đổi tên từ `business-industry.sql`)
   4. Các file seed danh mục TNLĐ: nguyên nhân tai nạn, yếu tố gây chấn thương, loại chấn thương, nghề nghiệp (theo QĐ 27/2018, QĐ 34/2020)

   **Cách chạy (chọn 1 trong 2 cách cho mỗi file):**

   ```bash
   # Cách 1
   psql -U postgres -d be_tt -f <ten_file>.sql

   # Cách 2 (Windows)
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d be_tt -f <ten_file>.sql
   ```

   Ví dụ chạy lần lượt:

   ```bash
   psql -U postgres -d be_tt -f sql/roles_permissions.sql
   psql -U postgres -d be_tt -f sql/location.sql
   psql -U postgres -d be_tt -f sql/business.sql
   ```

4. **Khởi động lại server** để sử dụng app với dữ liệu đầy đủ:
   ```bash
   npm run start
   # hoặc
   npm run start:dev
   ```

> ⚠️ Lưu ý quan trọng:
>
> - `location.sql` có dùng `TRUNCATE ... RESTART IDENTITY CASCADE`, sẽ xóa sạch mọi dữ liệu ở các bảng khác đang có khóa ngoại trỏ tới `provinces`/`wards` (ví dụ `companies`, `reports`...). **Chỉ an toàn khi chạy trên database mới, chưa có dữ liệu nghiệp vụ.** Nếu database đã có dữ liệu thật, không chạy lại file này.
> - Các seed còn lại dùng `INSERT` thường (không idempotent tuyệt đối), nên chỉ chạy trên database sạch hoặc kiểm tra kỹ trước khi chạy lại để tránh trùng dữ liệu.
> - Không seed và chạy server song song trong cùng một thời điểm — chạy tuần tự để tránh xung đột giữa TypeORM tự đồng bộ schema (nếu `synchronize: true`) và các lệnh SQL đang chạy.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# VNA-Intern-BE

Intern project for VNA Group Co

# Tạo App Password Gmail (bắt buộc, không dùng mật khẩu thường được):

1. Vào [myaccount.google.com](https://myaccount.google.com/) → Bảo mật
2. Bật Xác minh 2 bước nếu chưa bật
3. Tìm Mật khẩu ứng dụng → Tạo mới → đặt tên be_project
4. Copy mật khẩu 16 ký tự vào MAIL_PASSWORD trong file .env

# Cài đặt các thư viện trên để có thể thực hiện chức năng upload, xem, xóa, sửa, file

npm install multer
npm install -D @types/multer
npm install xlsx

# Tạo thư mục uploads/ ở root project (cùng cấp với src/):

mkdir uploads
echo "" > uploads/.gitkeep

# Thêm uploads/ vào .gitignore

uploads/\*
!uploads/.gitkeep

# Luồng xử lý khi DN đính kèm file báo cáo TNLĐ

1. FE gọi POST /upload → nhận về { filePath: '/uploads/xxx.pdf', fileName: 'baocaoTNLD.pdf' }
2. FE gọi PATCH /reports/:id/attachment → gửi { attachment_url, attachment_name } để lưu vào Report
3. Tóm lại:
   POST /upload → FE upload file, nhận về filePath
   PATCH /reports/:id/attachment → FE gửi filePath để lưu vào Report
   PATCH /reports/:id/submit → FE nộp báo cáo (lúc này đã có file đính kèm)
