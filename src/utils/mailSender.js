var nodemailer = require('nodemailer');

// const SendMail = async (targetMail, head, text, html) => {
//   try {
//     var transporter = nodemailer.createTransport({
//       service: "hotmail",
//       auth: {
//         user: "metin.kundakcioglu@hotmail.com",
//         pass: "Acousticmetin"
//       }
//     });

//     var mailOptions = {
//       from: "metin.kundakcioglu@hotmail.com",
//       to: targetMail,
//       subject: head,
//       text: text,
//       html: html
//     };

//     await transporter.sendMail(mailOptions);
//   } catch (err) {}
// };

export const SendMail = async (targetMail, head, text, html) => {
  try {
    var transporter = nodemailer.createTransport({
      service: 'Office365',
      host: 'smtp.office365.com',
      secureConnection: false,
      port: 587,
      auth: {
        user: 'main@bproservis.com',
        pass: 'Nazilli_09',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    var mailOptions = {
      from: 'main@bproservis.com',
      to: targetMail,
      subject: head,
      text: text,
      html: html,
    };

    let result = await transporter.sendMail(mailOptions);
    console.log('mail result', result);
  } catch (err) {
    console.log('mail error', err);
  }
};

export const SendMailFromBot = async (processData, head, text, html) => {
  try {
    var transporter = nodemailer.createTransport({
      service: 'Office365',
      host: 'smtp.office365.com',
      secureConnection: false,
      port: 587,
      auth: {
        user: 'main@bproservis.com',
        pass: 'Nazilli_09',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    var mailOptions = {
      from: 'main@bproservis.com',
      to: processData.user.email,
      subject: 'Bot' + (processData.ind + 1) + ': ' + head,
      text: 'Bot' + (processData.ind + 1) + ': ' + text,
      html: html,
    };

    let result = await transporter.sendMail(mailOptions);
    console.log('mail result', result);
  } catch (err) {
    console.log('mail error', err);
  }
};
