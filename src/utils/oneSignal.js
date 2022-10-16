const axios = require('axios')

const API_KEY = process.env.ONESIGNAL_API_KEY
const APP_ID = process.env.ONESIGNAL_APP_ID

module.exports.sendPushNotification = async (signalType, to, params) => {
  const signalTemplates = {
    'breaking-news': {
      content: `${params.content}`,
      data: {
        type: 'BREAKING_NEWS'
      }
    },
    'new-message': {
      content: `${params.senderFullName} kullanıcısından mesajınız var`,
      data: {
        type: 'NEW_MESSAGE',
        messageId: params.messageId,
        reservationId: params.reservationId
      }
    },
    'reservation-response': {
      content: 'Rezervasyon talebinize yanıt geldi',
      data: {
        type: 'RESERVATION_RESPONSE',
        reservationId: params.reservationId
      }
    },
    'new-reservation': {
      content: 'İlanınıza rezervasyon isteği geldi',
      data: {
        type: 'NEW_RESERVATION',
        reservationId: params.reservationId
      }
    },
    'new-user-rating': {
      content: 'Hakkınızda yorum ve değerlendirme yapıldı',
      data: {
        type: 'NEW_USER_RATING',
        userId: params.userId
      }
    }

  }

  const messageTemplate = (signalType && signalTemplates[signalType]) || {}

  const oneSignalApiUrl = 'https://onesignal.com/api/v1/notifications'

  const notification = {
    app_id: APP_ID,
    include_external_user_ids: to, // ['5ed2996ecb2a5711582a8fb3'],
    contents: {
      en: messageTemplate.content
    },
    data: messageTemplate.data
  }

  if (params.url) {
    notification.url = params.url
  }

  // console.log(notification)

  const headers = {
    authorization: 'Basic ' + API_KEY,
    'cache-control': 'no-cache',
    'content-type': 'application/json; charset=utf-8'
  }

  // console.log(headers)

  // return {
  //   oneSignalApiUrl,
  //   headers
  // }

  await axios.post(oneSignalApiUrl, notification, { headers })

  // return true

  // const message = {
  //   personalizations: [
  //     {
  //       to: [
  //         {
  //           email,
  //           name
  //         }
  //       ]
  //     }
  //   ],
  //   from: {
  //     email: 'service@mail.getlug.com',
  //     name: 'GetLug'
  //   },
  //   reply_to: {
  //     email: 'no-reply@mail.getlug.com',
  //     name: 'GetLug'
  //   },
  //   templateId: templateId,
  //   dynamic_template_data: params
  // }

  // sgMail
  //   .send(message)
  //   .then(([response, body]) => {
  //     // console.log('response.statusCode:', response.statusCode)
  //   })
  //   .catch((err) => console.log('mailer error:', err))
}
