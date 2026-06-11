import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('MAIL_FROM', '');
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT', 587),
      secure: this.config.get<string>('MAIL_SECURE', 'false') === 'true',
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  // ── Attachment logo dùng chung ────────────────────────────
  private readonly logoAttachment = {
    filename: 'logo.png',
    path: 'src/public/images/khong nen _ sang.png',
    cid: 'vna-logo',
  };

  private get logoImg() {
    return `
      <div style="text-align: center; padding: 20px 0;">
        <img src="cid:vna-logo" alt="VNA GROUP" style="max-width: 200px; height: auto;" />
      </div>
    `;
  }

  // ── Khôi phục mật khẩu ────────────────────────────────────
  async sendForgotPasswordEmail(
    email: string,
    fullname: string,
    username: string,
    otp: string,
    expiresMinutes: number,
  ) {
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: 'Khôi phục mật khẩu',
      attachments: [this.logoAttachment],
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="text-align: center; padding: 20px 0;">
      <img
          src="cid:vna-logo"
          alt="VNA GROUP"
          style="max-width: 200px; height: auto;"
        />
        </div>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${this.logoImg}
          <p>Xin chào, <strong>${fullname}</strong></p>
          <p>
            Bạn vừa yêu cầu khôi phục mật khẩu cho
            <strong>${username}</strong>.
            Dưới đây là mã xác thực OTP của bạn:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">
              ${otp}
            </span>
          </div>
          <p>
            <strong>Lưu ý:</strong>
            Mã OTP có hiệu lực <strong>${expiresMinutes} phút</strong>
          </p>
          <p>Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên hỗ trợ.</p>
          <p>Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
      `,
    });
  }

  // ── Xác thực thay đổi email ───────────────────────────────
  async sendChangeEmailOtp(
    toEmail: string,
    fullName: string,
    otpCode: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: toEmail,
      subject: 'Xác thực thay đổi email - VNA GROUP',
      attachments: [this.logoAttachment],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${this.logoImg}
          <p>Xin chào, <strong>${fullName}</strong></p>
          <p>Bạn vừa yêu cầu thay đổi email. Dưới đây là mã xác thực OTP của bạn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">
              ${otpCode}
            </span>
          </div>
          <p><strong>Lưu ý:</strong> Mã OTP có hiệu lực <strong>5 phút</strong></p>
          <p>Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên hỗ trợ.</p>
          <p>Nếu bạn không yêu cầu thay đổi email, vui lòng bỏ qua email này.</p>
        </div>
      `,
    });
  }

  // ── Xác thực đăng ký doanh nghiệp ────────────────────────
  async sendRegisterDnOtp(
    toEmail: string,
    tenDoanhNghiep: string,
    otpCode: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: toEmail,
      subject: 'Xác thực đăng ký doanh nghiệp - VNA GROUP',
      attachments: [this.logoAttachment],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${this.logoImg}
          <p>Xin chào, <strong>${tenDoanhNghiep}</strong></p>
          <p>Bạn vừa yêu cầu đăng ký tài khoản doanh nghiệp. Dưới đây là mã xác thực OTP của bạn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">
              ${otpCode}
            </span>
          </div>
          <p><strong>Lưu ý:</strong> Mã OTP có hiệu lực <strong>5 phút</strong></p>
          <p>Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên hỗ trợ.</p>
        </div>
      `,
    });
  }

  // ── Gửi thông tin tài khoản DN sau khi đăng ký ───────────
  async sendDoanhNghiepAccount(
    toEmail: string,
    tenDoanhNghiep: string,
    username: string,
    defaultPassword: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0;">
          <h2 style="color: #1a1a1a;">VNA GROUP</h2>
        </div>
        <p>Xin chào, <strong>${tenDoanhNghiep}</strong></p>
        <p>Tài khoản doanh nghiệp của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Tài khoản:</strong> ${username}</p>
          <p><strong>Mật khẩu:</strong> ${defaultPassword}</p>
        </div>
        <p style="color: #dc2626;">Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu.</p>
      </div>
    `;
    await this.sendMail(
      toEmail,
      'Thông tin tài khoản doanh nghiệp - VNA GROUP',
      html,
    );
  }

  // ── Hàm gửi mail chung ────────────────────────────────────
  private async sendMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"VNA GROUP" <${this.from}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Đã gửi email thành công đến ${to}`);
    } catch (err) {
      this.logger.error(`Lỗi khi gửi email đến ${to}: ${String(err)}`);
      throw err;
    }
  }
}
