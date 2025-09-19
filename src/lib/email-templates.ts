export function generateOTPEmailHTML(otp: string, firstName?: string): string {
  const name = firstName ? ` ${firstName}` : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
        .otp-code { 
          background: #f8f9fa; 
          border: 2px solid #007bff; 
          border-radius: 8px; 
          padding: 20px; 
          text-align: center; 
          font-size: 32px; 
          font-weight: bold; 
          letter-spacing: 8px; 
          color: #007bff; 
          margin: 20px 0; 
        }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification</h1>
        </div>
        <div class="content">
          <h2>Hello${name}!</h2>
          <p>Thank you for signing up. To complete your registration, please verify your email address using the verification code below:</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          
          <div class="warning">
            <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.
          </div>
          
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateOTPEmailText(otp: string, firstName?: string): string {
  const name = firstName ? ` ${firstName}` : "";

  return `
Hello${name}!

Thank you for signing up. To complete your registration, please verify your email address using the verification code below:

${otp}

This code will expire in 10 minutes.

Security Notice: Never share this code with anyone. Our team will never ask for your verification code.

If you didn't create an account, please ignore this email.

This is an automated message, please do not reply to this email.
  `.trim();
}
