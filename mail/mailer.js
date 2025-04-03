const nodemailer = require('nodemailer');
const path = require('path');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  
    }
});

const sendEmail = async (to, subject, template, context) => {
    const hbs = await import('nodemailer-express-handlebars');

    transporter.use('compile', hbs.default({
        viewEngine: {
            extname: ".hbs",
            partialsDir: path.join(__dirname, "templates"),
            defaultLayout: false,
        },
        viewPath: path.join(__dirname, "templates"),
        extName: ".hbs",
    }));

    const mailOptions = {
        from: process.env.EMAIL_USER, 
        to: to,                       
        subject: subject,
        template: template,
        context: context,                           
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message envoyé: %s', info.messageId);
    });
};

module.exports = sendEmail;