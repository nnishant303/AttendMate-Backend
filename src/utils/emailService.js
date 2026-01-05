import nodemailer from "nodemailer";
import { Resend } from 'resend';

export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        // Option 1: Try Brevo (Sendinblue) - works without domain verification
        const brevoApiKey = process.env.BREVO_API_KEY;

        if (brevoApiKey) {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': brevoApiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: {
                        name: "AttendMate Support",
                        email: process.env.BREVO_FROM_EMAIL || "noreply@attendmate.com"
                    },
                    to: [{ email: to }],
                    subject: subject,
                    textContent: text,
                    htmlContent: html
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("Brevo Error:", error);
                throw new Error(`Brevo failed: ${error.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log("Email sent via Brevo:", data.messageId);
            return { messageId: data.messageId, service: 'brevo' };
        }

        // Option 2: Try Resend (requires domain verification)
        const resendApiKey = process.env.RESEND_API_KEY;

        if (resendApiKey) {
            // Use Resend (recommended for production)
            const resend = new Resend(resendApiKey);

            const fromEmail = process.env.SMTP_FROM || 'AttendMate <onboarding@resend.dev>';

            const { data, error } = await resend.emails.send({
                from: fromEmail,
                to: [to],
                subject: subject,
                text: text,
                html: html,
            });

            if (error) {
                console.error("Resend Error:", error);
                throw new Error(`Email sending failed: ${error.message}`);
            }

            console.log("Email sent via Resend:", data.id);
            return { messageId: data.id, service: 'resend' };
        }

        // Fallback to SMTP if Resend is not configured
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
                const otpMatch = text ? text.match(/\d{6}/) : null;
                return { messageId: "mock-id-" + Date.now(), preview: "See Console", otpUsed: otpMatch ? otpMatch[0] : null };
            }
        } else {
            throw new Error("Email service not configured. Please set RESEND_API_KEY or SMTP credentials.");
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
