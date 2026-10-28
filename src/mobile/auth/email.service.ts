import { Injectable } from '@nestjs/common';

import { Client } from 'node-mailjet';

@Injectable()
export class EmailService {
  private readonly mailjet = new Client({
    apiKey: process.env.MAILJET_API_KEY!,
    apiSecret: process.env.MAILJET_SECRET_KEY!,
  });

  async sendOtp(email: string, otp: string) {
    try {
      await this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_FROM_EMAIL!,
              Name: 'Wallverse',
            },
            To: [{ Email: email }],
            Subject: 'Reset your Wallverse password',
            TextPart: `Your Wallverse password reset code is ${otp}. It expires in 5 minutes. If you didn't request this, please ignore this email.`,
            HTMLPart: `
              <!DOCTYPE html>
              <html>
                <body style="margin:0; padding:0; background-color:#f4f4f7; font-family:Arial,Helvetica,sans-serif; color:#1f2937;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f7; padding:32px 12px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px; background-color:#ffffff; border-radius:16px; overflow:hidden;">
                          
                          <tr>
                            <td align="center" style="background-color:#7c3aed; padding:28px 20px;">
                              <h1 style="margin:0; color:#ffffff; font-size:28px; letter-spacing:1px;">Wallverse</h1>
                              <p style="margin:8px 0 0; color:#ede9fe; font-size:14px;">Password Reset</p>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:32px 28px;">
                              <h2 style="margin:0 0 16px; font-size:22px; color:#111827;">Reset your password</h2>

                              <p style="margin:0 0 20px; font-size:15px; line-height:1.7; color:#4b5563;">
                                We received a request to reset your Wallverse account password.
                                Use the verification code below to continue.
                              </p>

                              <div style="margin:28px 0; padding:20px; text-align:center; background-color:#f5f3ff; border:1px solid #ddd6fe; border-radius:12px;">
                                <p style="margin:0 0 10px; font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:2px;">Your verification code</p>
                                <div style="font-size:34px; font-weight:bold; letter-spacing:8px; color:#6d28d9;">
                                  ${otp}
                                </div>
                              </div>

                              <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#4b5563;">
                                This code expires in <strong>5 minutes</strong>. For your security, do not share it with anyone.
                              </p>

                              <div style="padding:14px 16px; background-color:#fff7ed; border-radius:8px;">
                                <p style="margin:0; font-size:13px; line-height:1.6; color:#9a3412;">
                                  <strong>Didn't request a password reset?</strong><br />
                                  You can safely ignore this email. Your password will not change unless the reset process is completed.
                                </p>
                              </div>
                            </td>
                          </tr>

                          <tr>
                            <td align="center" style="padding:20px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
                              <p style="margin:0 0 6px; font-size:13px; color:#6b7280;">
                                Thanks for using Wallverse.
                              </p>
                              <p style="margin:0; font-size:11px; color:#9ca3af;">
                                This is an automated email. Please do not reply.
                              </p>
                            </td>
                          </tr>

                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
              </html>
            `,
          },
        ],
      });
    } catch (error) {
      console.error('Mailjet error:', error);
      throw error;
    }
  }
}
