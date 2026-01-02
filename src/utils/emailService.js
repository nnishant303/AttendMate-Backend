import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        let transporter;

        const isProduction = process.env.NODE_ENV === "production";
        const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

        if (hasSmtp) {
            const host = process.env.SMTP_HOST;
            const user = process.env.SMTP_USER;
            const port = parseInt(process.env.SMTP_PORT) || 587;

            const config = {
                auth: {
                    user: user,
                    pass: process.env.SMTP_PASS,
                },
                tls: {
                    rejectUnauthorized: false
                },
                connectionTimeout: 15000,
                greetingTimeout: 15000,
                socketTimeout: 20000,
            };

            // Optimization for Gmail
            if (host.includes("gmail.com")) {
                config.service = "gmail";
            } else {
                config.host = host;
                config.port = port;
                config.secure = port === 465;
            }

            transporter = nodemailer.createTransport(config);
        } else if (!isProduction) {
            // ... fallback logic ...
            console.log("No SMTP credentials found. Attempting to generate test account...");
            try {
                const testAccount = await nodemailer.createTestAccount();
                console.log("Test account created (Ethereal):", testAccount.user);
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
                console.warn("Ethereal failed. Falling back to console logging.");
                console.log(`\n--- [MOCK EMAIL] ---\nTo: ${to}\nSubject: ${subject}\nContent: ${text}\n--------------------\n`);
                return { messageId: "mock-id-" + Date.now(), preview: "See Console", otpUsed: text.match(/\d{6}/)?.[0] };
            }
        } else {
            throw new Error("SMTP credentials are required in production.");
        }

        const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@attendmate.com';
        const info = await transporter.sendMail({
            from: `"AttendMate Support" <${fromEmail}>`,
            to,
            subject,
            text,
            html,
        });

        console.log("Email sent: %s", info.messageId);
        return info;

    } catch (error) {
        console.error("sendEmail Error:", error.message);
        throw error; // Rethrow to let the controller know it failed
    }
};
