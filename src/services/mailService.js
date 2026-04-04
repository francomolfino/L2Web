import nodemailer from "nodemailer";
import { config } from "../config.js";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: Number(config.smtp.port) === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass
  }
});

export async function sendPasswordResetEmail({ to, login, resetUrl }) {
  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject: "Recuperación de contraseña",
    text: `Hola ${login},

Recibimos una solicitud para restablecer tu contraseña.

Usá este enlace:
${resetUrl}

Si no fuiste vos, ignorá este correo.
El enlace vence en 30 minutos.`
  });
}