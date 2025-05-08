// Import the Nodemailer library
const nodemailer = require('nodemailer');

// Create a transporter object
const transporter = nodemailer.createTransport({
  host: 'live.smtp.mailtrap.io',
  port: 587,
  secure: false, // use SSL
  auth: {
    user: 'smtp@mailtrap.io',
    pass: '52bb975578415244a867079425609889',
  }
});

// Configure the mailoptions object
const mailOptions = {
  from: 'jameshenry2005@gmail.com',
  to: 'jameshredd@outlook.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

// Send the email
transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});