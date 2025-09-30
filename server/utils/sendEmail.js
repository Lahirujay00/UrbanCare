const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create reusable transporter object using the default SMTP transport
  let transporter;

  if (process.env.NODE_ENV === 'production') {
    // Production email service (e.g., SendGrid, Amazon SES)
    transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development - use Ethereal Email for testing
    transporter = nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  const message = {
    from: `${process.env.FROM_NAME || 'UrbanCare'} <${process.env.FROM_EMAIL || 'noreply@urbancare.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message
  };

  const info = await transporter.sendMail(message);

  if (process.env.NODE_ENV === 'development') {
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }

  return info;
};

module.exports = sendEmail;