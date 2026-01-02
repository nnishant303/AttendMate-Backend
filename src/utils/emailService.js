import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        let transporter;

        // Check if real SMTP credentials are provided
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            const port = parseInt(process.env.SMTP_PORT) || 587;
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: port,
                secure: port === 465, // Use true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
                tls: {
                    rejectUnauthorized: false // Often needed for cloud environments
                },
                connectionTimeout: 10000, // 10 seconds timeout
                greetingTimeout: 10000,
                socketTimeout: 15000,
            });
        } else {
            // Fallback to Ethereal (Test Account) or Console Log
            console.log("No SMTP credentials found in .env. Attempting to generate test account...");

            try {
                const testAccount = await nodemailer.createTestAccount();
                console.log("Test account created:", testAccount.user);

                transporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
            } catch (testError) {
                console.warn("Failed to create test account. Falling back to console logging.", testError.message);
                // Fully Mock Transporter if Ethereal fails
                console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Content: ${text}`);
                return { messageId: "mock-id-123", preview: "See Console" };
            }
        }

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"AttendMate Support" <no-reply@attendmate.com>',
            to,
            subject,
            text,
            html,
        });

        console.log("Email sent: %s", info.messageId);

        // If using Ethereal, log the preview URL
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log("Preview URL: %s", previewUrl);
        }

        return info;

    } catch (error) {
        console.error("Error sending email:", error);
        // Do not throw error to avoid crashing the flow if email service is down,
        // unless it's critical. For OTP, it is critical, but locally we might want to proceed.
        // Let's rethrow to let the controller handle it, but the controller currently 500s.
        // The user saw "Server Error" which means 500.
        throw new Error(`Email sending failed: ${error.message}`);
    }
};
