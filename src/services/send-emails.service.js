/**
 *  to send emails we need to follow some steps 
 * 1 setup nodemailer configuration
 */

import nodemailer from "nodemailer";


export let sendEmail = async ({to = "", subject = "no reply", message = "<h1>no reply</h1>",attachments })=>{
    // Here we are setting up the configuration
    const transporter = nodemailer.createTransport({
        host: "lsmtp.forwardemail.net", // we can rplace with "smtp.forwardemail.net" in case of faliure of the local host >> simple mail transfer protocol
        service:'gmail',
        port: 465, 
        secure: true,
        auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
    });

    const info = await transporter.sendMail({
        from: `"no-reply" <${process.env.EMAIL}>`,
        to,
        subject,
        html:message,
        attachments
    })
    return info.accepted.length > 0 
}


