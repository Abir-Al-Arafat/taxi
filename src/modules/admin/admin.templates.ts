interface AdminInviteTemplateInput {
  name: string;
  email: string;
  tempPassword: string;
}

export const buildAdminInviteEmailTemplate = ({
  name,
  email,
  tempPassword,
}: AdminInviteTemplateInput) => ({
  subject: "Welcome to SwiftRide - Admin Access Granted",
  text: `Hi ${name}, you have been added as an admin to SwiftRide. Your temporary password is: ${tempPassword}. Please log in and change it immediately.`,
  html: `
    <h2>Welcome to SwiftRide Admin Portal</h2>
    <p>Hi ${name},</p>
    <p>You have been granted administrative access to the SwiftRide dashboard. Please use the credentials below to log in for the first time:</p>
    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #333;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 0; color: #333;"><strong>Temporary Password:</strong> 
        <span style="font-family: monospace; font-size: 18px; letter-spacing: 2px; background: #fff; padding: 2px 8px; border-radius: 4px; margin-left: 8px;">${tempPassword}</span>
      </p>
    </div>
    <p style="color: #d9534f; font-weight: bold;">Important: Please change this temporary password immediately after logging in.</p>
    <p>Best regards,<br>SwiftRide Team</p>
  `,
});
