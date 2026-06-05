import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly from: string;

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

  async sendForgotPasswordEmail(
    email: string,
    username: string,
    otp: string,
    expiresMinutes: number,
  ) {
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: 'Khôi phục mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Xin chào, <strong>${username}</strong></p>
          <p>Bạn vừa yêu cầu khôi phục mật khẩu cho tài khoản của mình.</p>
          <p>Mã OTP của bạn là:</p>
          <h2 style="color: #2563eb; letter-spacing: 2px;">${otp}</h2>
          <p>Mã OTP có hiệu lực trong <strong>${expiresMinutes} phút</strong>.</p>
          <p>Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.</p>
        </div>
      `,
    });
  }
}
