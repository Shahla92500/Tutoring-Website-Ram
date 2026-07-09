const nodemailer = require("nodemailer");
const { Resend } = require("resend");

let transporter;
let resend;
const provider = (process.env.MAIL_PROVIDER || "").toLowerCase();

// if (process.env.MAIL_PROVIDER === "mailtrap") {
// 	// ✅ Local / testing
// 	transporter = nodemailer.createTransport({
// // const transporter = nodemailer.createTransport({
//   host: process.env.MAILTRAP_HOST,
//   port: Number(process.env.MAILTRAP_PORT),
//   auth: {
//     user: process.env.MAILTRAP_USER,
//     pass: process.env.MAILTRAP_PASS,
//   },
// });
// } else {
// 	// ✅ Production (example: SendGrid SMTP)
// 	transporter = nodemailer.createTransport({
// 		host: process.env.SMTP_HOST,
// 		port: process.env.SMTP_PORT,
// 		secure: false,
// 		auth: {
// 			user: process.env.SMTP_USER,
// 			pass: process.env.SMTP_PASS,
// 		},
// 	});
// }
// async function sendMail({ to, subject, html }) {
//   	await transporter.sendMail({
// //   return transporter.sendMail({
// 		from: `"PeerTrack+" <${process.env.MAIL_FROM}>`,
// //     from: process.env.MAIL_FROM,
//     to,
//     subject,
//     html,
//   });
// }

if (provider === "mailtrap") {
	transporter = nodemailer.createTransport({
		host: process.env.MAILTRAP_HOST,
		port: Number(process.env.MAILTRAP_PORT || 2525),
		auth: {
			user: process.env.MAILTRAP_USER,
			pass: process.env.MAILTRAP_PASS,
		},
	});
} else if (provider === "gmail") {
	transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});
} else if (provider === "smtp") {
	const port = Number(process.env.SMTP_PORT || 587);
	transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port,
		secure: port === 465,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});
} else if (provider === "resend") {
	resend = new Resend(process.env.RESEND_API_KEY);
}

async function sendMail({ to, subject, html }) {
	console.log("MAIL PROVIDER:", provider || "(not set)");

	if (provider === "resend") {
		if (!resend) {
			throw new Error("MAIL_PROVIDER is resend but RESEND_API_KEY is missing/invalid");
		}
		await resend.emails.send({
			from: process.env.MAIL_FROM,
			to,
			subject,
			html,
		});
		return;
	}

	if (!transporter) {
		throw new Error(
			"Mailer is not configured. Set MAIL_PROVIDER to resend, smtp, gmail, or mailtrap."
		);
	}

	await transporter.sendMail({
		from: process.env.MAIL_FROM,
		to,
		subject,
		html,
	});
}

module.exports = { sendMail };
