var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bw6751430@gmail.com',
    pass: "vxhp tcno hvbe avly"
  }
});

var mailOptions = {
  from: 'bw6751430@gmail.com',
  to: 'bw709788@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
