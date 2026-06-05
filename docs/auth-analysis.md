# Phan tich cau truc project va huong trien khai auth

## Muc tieu tai lieu

Tai lieu nay mo ta:

- Cau truc hien tai cua project.
- Hien trang module `auth` va `user`.
- Nhung phan da co san, phan con thieu, va rui ro ky thuat.
- Huong cai thien de trien khai 3 tinh nang: `register`, `login`, `change email`.

Tai lieu nay chi phuc vu phan tich. Chua thuc hien thay doi logic business.

## 1. Tong quan cau truc project

Project hien tai la backend `NestJS` su dung:

- `@nestjs/common`, `@nestjs/core`
- `@nestjs/typeorm`
- `@nestjs/jwt`
- `class-validator`, `class-transformer`
- `bcrypt`
- `PostgreSQL`

Cau truc source chinh:

- `src/app.module.ts`: ghep module va cau hinh TypeORM.
- `src/main.ts`: bootstrap app va Swagger.
- `src/modules/auth`: xu ly dang ky, dang nhap, token.
- `src/modules/user`: xu ly user profile va cac entity lien quan user.
- `src/modules/location`: du lieu dia gioi hanh chinh.

## 2. Hien trang auth va user

### 2.1 Module `auth`

Dang co:

- `AuthController`
- `AuthService`
- `Account` entity
- DTO cho `login`, `register`, `refreshToken`, `changePassword`, `verifyOtp`, `confirmNewEmail`

Endpoint hien tai:

- `POST /auth/login`
- `POST /auth/registerDemo`
- `POST /auth/register`

Luong hien tai:

- `register` chi tao `account` bang `username` va `password`.
- `login` xac thuc bang `username` va `password`.
- Khi login thanh cong se tao `accessToken` va `refreshToken`, sau do luu hash refresh token vao bang `refresh_tokens`.

### 2.2 Module `user`

Dang co:

- `UserService`
- `UserController`
- `User` entity
- `RefreshToken`, `OtpCode`, `EmailChangeRequest` entity

Luong hien tai:

- Khi tao account moi, system tao them mot `User` profile rong lien ket 1-1 voi `Account`.
- Co API cap nhat profile va lay profile theo `username`.

## 3. Model du lieu hien tai

### 3.1 `accounts`

Dang luu:

- `account_id`
- `username` unique
- `password`
- `role`
- `is_active`

Vai tro:

- Day la bang chua thong tin dang nhap.
- Phu hop de tach `credential` khoi `profile`.

### 3.2 `users`

Dang luu:

- thong tin profile: `fullName`, `email`, `dateOfBirth`, `gender`, `title`, `provinceId`, `districtId`, `address`, `avatarUrl`
- lien ket `account_id`

Vai tro:

- Day la bang profile nghiep vu cua nguoi dung.

### 3.3 `refresh_tokens`

Dang luu:

- `account_id`
- `token_hash`
- `is_remember_me`
- `expires_at`
- `is_revoked`

Danh gia:

- Model nay hop ly cho refresh token theo huong luu hash trong DB.
- Tuy nhien hien chua co flow `refresh`, `logout`, `revoke`, `cleanup`.

### 3.4 `otp_codes`

Dang luu:

- `user_id`
- `code`
- `type`
- `is_used`
- `expires_at`

Danh gia:

- Da co y tuong cho OTP.
- Quan he voi `User` dang bi comment out.
- Chua co service sinh, gui, verify OTP.

### 3.5 `email_change_requests`

Dang luu:

- `user_id`
- `new_email`
- `otp_id`
- `is_completed`

Danh gia:

- Model nay dung huong cho use case `change email`.
- Nhung chua du de theo doi trang thai day du, vi chua co `expiresAt`, `verifiedAt`, `cancelledAt`, `attemptCount`.

## 4. Nhung diem dang lam tot

- Da tach `Account` va `User`, giup phan quyen auth/profile ro rang hon.
- Da hash password bang `bcrypt`.
- Da sinh access token va refresh token rieng.
- Da luu hash refresh token thay vi luu plain token.
- Da co entity cho OTP va doi email, nghia la data model ban dau da nghi toi use case mo rong.
- Da co Swagger bootstrap san.

## 5. Van de va khoang trong hien tai

## 5.1 Validation chua chat

DTO dang dung `@IsOptional()` cho nhieu truong bat buoc nhu:

- `username`
- `password`
- `refreshToken`
- `otp`

He qua:

- Request thieu field van co the di qua validation.
- Loi input se rat kho kiem soat.

De xuat:

- Doi sang `@IsNotEmpty()`, `@IsString()`, `@IsEmail()` va rule password ro rang.

## 5.2 Chua bat global `ValidationPipe`

Trong `main.ts` hien chua thay:

- `app.useGlobalPipes(new ValidationPipe(...))`

He qua:

- DTO decorator co the khong phat huy het tac dung.

## 5.3 Register dang rat toi gian

`register` hien tai:

- chi nhan `username`, `password`
- khong nhan `email`
- khong kiem tra policy mat khau
- khong kiem tra duplicate email
- khong su dung transaction khi tao `Account` va `User`

Rui ro:

- Co the tao `Account` thanh cong nhung `User` that bai, gay du lieu lech.

## 5.4 Login chua hoan chinh ve bao mat

Dang co:

- kiem tra password
- kiem tra `isActive`
- cap token

Con thieu:

- endpoint refresh token
- logout / revoke token
- gioi han so lan dang nhap sai
- ghi nhan `lastLoginAt`
- guard / strategy de bao ve API can dang nhap

## 5.5 Change email moi o muc entity va DTO

Project da co:

- `OtpCode`
- `EmailChangeRequest`
- `VerifyOtpDTO`
- `ConfirmNewEmailDTO`

Nhung chua co:

- endpoint yeu cau doi email
- endpoint gui OTP
- endpoint xac minh OTP
- endpoint xac nhan cap nhat email
- service gui email
- check trung email
- xu ly het han OTP

## 5.6 Quan he entity dang chua hoan tat

Trong `User`, `OtpCode`, `EmailChangeRequest`:

- nhieu relation dang bi comment out

He qua:

- Kho query quan he mot cach ro rang.
- De phat sinh loi khi mo rong service.

## 5.7 API user hien tai chua an toan

`GET /user/profile/:username` va `POST /user/update_userprofile` dang dua theo `username` tu input.

Rui ro:

- Neu chua co auth guard, nguoi dung co the doc/sua profile cua nguoi khac neu biet username.

De xuat:

- Lay user hien tai tu JWT payload thay vi nhan `username` tu client.

## 5.8 Cau hinh DB chua phu hop production

`synchronize: true` trong `TypeOrmModule.forRootAsync`.

Rui ro:

- De gay loi schema khi deploy.

De xuat:

- Chuyen sang migration.

## 5.9 Test hien tai moi la scaffold

Spec file chi test `should be defined`.

He qua:

- Chua co test bao ve login/register/change-email flow.

## 5.10 Tai lieu project chua cap nhat

`README.md` van la template mac dinh cua NestJS.

He qua:

- Kho onboard.
- Khong mo ta API auth, env, schema, hay workflow phat trien.

## 6. Huong thiet ke de trien khai 3 tinh nang

## 6.1 Nguyen tac tach trach nhiem

Nen tach nhu sau:

- `Account`: credential, trang thai dang nhap, role.
- `User`: profile nghiep vu.
- `AuthService`: register, login, refresh, logout.
- `UserService` hoac `AccountSecurityService`: change email, change password, OTP verify.

Neu muon giu don gian, van co the dat `change email` trong `AuthService`, nhung can tach method ro rang.

## 6.2 De xuat flow `register`

Flow nen la:

1. Nhan `username`, `password`, `email` va co the them thong tin toi thieu cua user.
2. Validate format.
3. Check trung `username`.
4. Check trung `email`.
5. Hash password.
6. Tao `Account` + `User` trong cung mot transaction.
7. Tra ve thong tin can thiet, khong tra password/hash.

DTO nen co:

- `username`
- `password`
- `email`
- co the them `fullName`

Neu muon xac minh email ngay tu dau, co the them buoc:

1. Tao account o trang thai `inactive`.
2. Gui OTP hoac verification token.
3. Kich hoat sau khi verify.

## 6.3 De xuat flow `login`

Flow nen la:

1. Nhan `username` hoac `email` va `password`.
2. Tim account lien quan.
3. Kiem tra password hash.
4. Kiem tra `isActive`.
5. Sinh access token.
6. Sinh refresh token.
7. Luu hash refresh token vao DB.
8. Tra token + thong tin user co ban.

Nen bo sung them:

- `POST /auth/refresh`
- `POST /auth/logout`
- co co che revoke token hien tai
- xoa token cu neu dang nhap lai tren cung thiet bi neu muon don gian hoa

## 6.4 De xuat flow `change email`

Nen tach thanh 3 buoc ro rang:

### Buoc 1: Yeu cau doi email

`POST /auth/change-email/request`

Input:

- user dang dang nhap
- `newEmail`

Xu ly:

1. Kiem tra email moi hop le.
2. Kiem tra email chua ton tai.
3. Tao OTP.
4. Tao `email_change_request`.
5. Gui OTP den email moi.

### Buoc 2: Xac minh OTP

`POST /auth/change-email/verify-otp`

Input:

- `requestId` hoac `newEmail`
- `otp`

Xu ly:

1. Tim request dang pending.
2. Kiem tra OTP dung, chua dung, chua het han.
3. Danh dau OTP da dung.
4. Danh dau request da verify hoac chuyen sang trang thai san sang cap nhat.

### Buoc 3: Xac nhan doi email

`POST /auth/change-email/confirm`

Input:

- `requestId`

Xu ly:

1. Kiem tra request da verify.
2. Cap nhat `user.email`.
3. Danh dau request hoan thanh.
4. Co the revoke session neu email duoc dung de dang nhap.

De don gian hon, co the gop buoc 2 va 3 thanh mot endpoint verify xong la cap nhat email luon.

## 7. De xuat dieu chinh schema va model

## 7.1 `Account`

Can nhac bo sung:

- `lastLoginAt`
- `failedLoginCount`
- `lockedUntil`
- `passwordChangedAt`

## 7.2 `User`

Can giu `email` unique nhu hien tai.

Can nhac:

- neu email la field quan trong cho login, can quy uoc ro login bang `username`, `email`, hay ca hai.

## 7.3 `OtpCode`

Nen bo sung hoac chuan hoa:

- relation voi `User`
- co the them `target` neu OTP gui cho email moi
- index theo `userId`, `type`, `expiresAt`

## 7.4 `EmailChangeRequest`

Nen bo sung:

- `status` (`PENDING`, `VERIFIED`, `COMPLETED`, `CANCELLED`, `EXPIRED`)
- `expiresAt`
- `verifiedAt`
- `completedAt`

Neu muon don gian, co the giu `isCompleted`, nhung se kho mo rong va audit.

## 8. De xuat API toi thieu

API toi thieu cho giai doan tiep theo:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/change-email/request`
- `POST /auth/change-email/verify-otp`
- `GET /user/me`
- `PATCH /user/me`

Khong nen tiep tuc dung:

- `GET /user/profile/:username`
- `POST /user/update_userprofile`

Neu co JWT guard, nen thay bang API dua tren user hien tai.

## 9. Thu tu uu tien de cai thien

Nen lam theo thu tu sau:

1. Chuan hoa DTO + ValidationPipe.
2. Hoan thien register bang transaction va duplicate check.
3. Hoan thien login + refresh + logout.
4. Them JWT strategy / guard cho endpoint can bao ve.
5. Hoan thien flow change email voi OTP.
6. Bo sung unit test va e2e test.
7. Chuyen `synchronize` sang migration.
8. Cap nhat README tai lieu project.

## 10. Ket luan

Nen tang project hien tai da co nen tang du de phat trien `register`, `login`, `change email`, dac biet la da tach `Account`, `User`, `RefreshToken`, `OtpCode`, `EmailChangeRequest`.

Tuy nhien, auth layer moi o muc ban dau. De trien khai on dinh, can uu tien:

- validation input
- transaction khi tao du lieu
- auth guard va refresh flow
- OTP/email service
- test va migration

Neu tiep tuc o buoc tiep theo, nen implement theo tung phase nho thay vi sua tat ca cung luc.
