import type { AuthUserView } from "./auth.types";

interface OtpTemplateInput {
  user: AuthUserView;
  otp: string;
}

export const buildVerificationEmailTemplate = ({
  user,
  otp,
}: OtpTemplateInput) => ({
  subject: "Verify your SwiftRide account",
  text: `Hi ${user.firstName}, your SwiftRide verification code is ${otp}. It expires in 10 minutes.`,
  html: `
    <h2>Verify your SwiftRide account</h2>
    <p>Hi ${user.firstName},</p>
    <p>Thank you for signing up with SwiftRide. To complete your registration, please verify your email address using the code below:</p>
    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
      <h1 style="color: #333; letter-spacing: 5px; font-family: monospace;">${otp}</h1>
    </div>
    <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
    <p>If you didn't sign up for SwiftRide, please ignore this email.</p>
    <p>Best regards,<br>SwiftRide Team</p>
  `,
});

export const buildVerificationSmsTemplate = ({
  user,
  otp,
}: OtpTemplateInput) => ({
  text: `SwiftRide verification code for ${user.firstName}: ${otp}. It expires in 10 minutes.`,
});

export const buildPasswordResetEmailTemplate = ({
  user,
  otp,
}: OtpTemplateInput) => ({
  subject: "Reset your SwiftRide password",
  text: `Hi ${user.firstName}, your SwiftRide password reset code is ${otp}. It expires in 10 minutes.`,
  html: `
    <h2>Reset your SwiftRide password</h2>
    <p>Hi ${user.firstName},</p>
    <p>We received a request to reset your SwiftRide password. If you made this request, use the code below to proceed:</p>
    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
      <h1 style="color: #333; letter-spacing: 5px; font-family: monospace;">${otp}</h1>
    </div>
    <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
    <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
    <p>Best regards,<br>SwiftRide Team</p>
  `,
});

export const buildPasswordResetSmsTemplate = ({
  user,
  otp,
}: OtpTemplateInput) => ({
  text: `SwiftRide password reset code for ${user.firstName}: ${otp}. It expires in 10 minutes.`,
});
