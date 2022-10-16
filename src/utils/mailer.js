const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

module.exports.sendMail = async (mailType, { email, name }, params) => {
  const sgDynamicMailTemplates = {
    'verify-email-via-link': 'd-224079e5026843a9b6b3d1aeb848963c',
    'verify-email-via-code': 'd-4e59fa58c5b94acfbc882d26e75a4aa3',
    'reset-password-via-code': 'd-6c55ebafdf1e4ca0981c6723fca4aab3',
    'auto-reset-password': 'd-82579102102743db992ce544df6a1b06',
    'reservation-notification': 'd-97470a09634245569f21761218872123',
    'travel-notification': 'd-b9cb4cff736e414bb795e7c6bfb75ef6'
  }

  const templateId = (mailType && sgDynamicMailTemplates[mailType]) || null

  const message = {
    personalizations: [
      {
        to: [
          {
            email,
            name
          }
        ]
      }
    ],
    from: {
      email: 'service@mail.getlug.com',
      name: 'GetLug'
    },
    reply_to: {
      email: 'no-reply@mail.getlug.com',
      name: 'GetLug'
    },
    templateId: templateId,
    dynamic_template_data: params
  }

  sgMail
    .send(message)
    .then(([response, body]) => {
      // console.log('response.statusCode:', response.statusCode)
    })
    .catch((err) => console.log('mailer error:', err))
}
