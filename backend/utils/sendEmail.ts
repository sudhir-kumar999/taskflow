import nodemailer from "nodemailer";
export const sendMail = async (to: string, template: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const info = await transporter.sendMail({
      from: "akumar07067@gmail.com",
      to: to,
      subject: "OTP verification",
      text: "Don't share your to other person",
      html: template,
    });
    return info;
  } catch (error) {
    console.log("Error", error);
  }
};
