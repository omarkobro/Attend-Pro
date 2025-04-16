/**
 *  to send emails we need to follow some steps 
 * 1 setup nodemailer configuration
 */

import SibApiV3Sdk from 'sib-api-v3-sdk';

export const sendEmail = async ({ to, subject, message }) => {
    const client = SibApiV3Sdk.ApiClient.instance;
    const apiKey = client.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
  
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  
    const emailData = {
      sender: { email: process.env.EMAIL, name: 'Attend Pro' },
      to: [{ email: to }],
      subject,
      htmlContent: message,
    };
  
    try {
      const response = await apiInstance.sendTransacEmail(emailData);
      console.log('Email sent:', response.messageId || response);
      return true;
    } catch (error) {
      console.error('Email send error:', error.response?.body || error.message);
      return false;
    }
  };