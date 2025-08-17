import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Send confirmation email
    const { data, error } = await resend.emails.send({
      from: "SupoClip <noreply@shiori.ai>",
      to: [email],
      subject: "Welcome to the SupoClip Waitlist! 🎬",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome to SupoClip Waitlist</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; padding: 0; background-color: #fff; color: #000; }
              .container { max-width: 600px; margin: 0 auto; background: #fff; }
              .header { background: #000; padding: 40px 20px; text-align: center; }
              .logo { display: inline-block; width: 40px; height: 40px; background: #fff; border-radius: 8px; line-height: 40px; color: #000; font-weight: bold; font-size: 16px; border: 2px solid #000; }
              .content { padding: 40px 20px; }
              .features { margin: 30px 0; }
              .feature { display: flex; align-items: center; margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
              .feature-icon { width: 40px; height: 40px; background: #000; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; }
              .footer { background: #000; color: #fff; padding: 20px; text-align: center; font-size: 14px; }
              h1, h2, h3, h4, strong { color: #000; }
              a { color: #000; }
              p { color: #000; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">SC</div>
                <h1 style="color: #fff; margin: 20px 0 10px; font-size: 28px;">Welcome to SupoClip!</h1>
                <p style="color: #fff; margin: 0; font-size: 16px;">You're now on our exclusive waitlist</p>
              </div>

              <div class="content">
                <h2 style="font-size: 24px; margin-bottom: 20px;">Thanks for joining our waitlist! 🎉</h2>

                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  We're thrilled to have you as one of our early supporters. SupoClip is going to revolutionize the way you create and edit videos.
                </p>

                <div class="features">
                  <h3 style="font-size: 20px; margin-bottom: 20px;">What to expect:</h3>

                  <div class="feature">
                    <div class="feature-icon">⚡</div>
                    <div>
                      <h4 style="margin: 0 0 5px;">AI-Powered Editing</h4>
                      <p style="margin: 0; font-size: 14px;">Smart tools that understand your content and automate complex editing tasks</p>
                    </div>
                  </div>

                  <div class="feature">
                    <div class="feature-icon">🚀</div>
                    <div>
                      <h4 style="margin: 0 0 5px;">Lightning Fast</h4>
                      <p style="margin: 0; font-size: 14px;">Create professional videos in minutes, not hours</p>
                    </div>
                  </div>

                  <div class="feature">
                    <div class="feature-icon">✨</div>
                    <div>
                      <h4 style="margin: 0 0 5px;">Professional Results</h4>
                      <p style="margin: 0; font-size: 14px;">Studio-quality output with zero learning curve</p>
                    </div>
                  </div>
                </div>

                <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
                  We'll keep you updated on our progress and notify you as soon as SupoClip is ready for early access.
                </p>

                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                  Stay tuned for something amazing!<br>
                  <strong>The SupoClip Team</strong>
                </p>
              </div>

              <div class="footer">
                <p style="margin: 0;">© 2025 SupoClip. All rights reserved.</p>
                <p style="margin: 10px 0 0;">You received this email because you joined our waitlist.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send confirmation email" },
        { status: 500 }
      );
    }

    // In a real application, you would also store the email in a database here
    console.log("Email added to waitlist:", email);
    console.log("Confirmation email sent:", data);

    return NextResponse.json({
      message: "Successfully added to waitlist",
      data,
    });
  } catch (error) {
    console.error("Error processing waitlist signup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
