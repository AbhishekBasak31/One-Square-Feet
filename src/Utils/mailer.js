import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// 🟢 FORCE load the .env variables right here
dotenv.config();

// 🟢 Quick Debug: This will print your email to the terminal. 
// If it prints "undefined", your .env file is in the wrong folder!
console.log("Mailer initialized with Email:", process.env.EMAIL_USER); 

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendDynamicEmail = async (to, subject, htmlContent) => {
  const mailOptions = {
    from: `"OneSquare Feet CRM" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent
  };
  return await transporter.sendMail(mailOptions);
};