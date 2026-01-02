import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        let transporter;

        const isProduction = process.env.NODE_ENV === "production";
        const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

        if (hasSmtp) {
            const port = parseInt(process.env.SMTP_PORT) || 587;
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: port,
                secure: port === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
                tls: {
                    rejectUnauthorized: false
                },
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
            });
        } else if (!isProduction) {
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
                return { messageId: "mock-id-" + Date.now(), preview: "See Console" };
            }
        } else {
            throw new Error("SMTP credentials are required in production but were not found in environment variables.");
        }

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"AttendMate Support" <no-reply@attendmate.com>',
            to,
            subject,
            text,
            html,
        });

        console.log("Email sent: %s", info.messageId);

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log("Preview URL: %s", previewUrl);
        }

        return info;

    } catch (error) {
        console.error("sendEmail Error:", error.message);
        throw error; // Rethrow to let the controller know it failed
    }
};
