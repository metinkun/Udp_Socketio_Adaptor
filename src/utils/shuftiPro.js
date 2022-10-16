const axios = require('axios')
const { v4: uuidv4 } = require('uuid')

// const normalizeDateOfBirth = (dob) => {
//   const [year, month, day] = dob.split('-')

//   return new Date(year, month - 1, day)
// }

const normalizeName = (name) => {
  const { first_name: first, middle_name: middle, last_name: last } = name

  const existingNameParts = [first, middle, last]
    .filter(x => !!x) // check if null or empty
    .map(x => x.trim()) // trim

  const fullName = existingNameParts.join(' ')

  return fullName
}

// const checkDateEquality = (dt1, dt2) => {
//   return new Date(dt1).getTime() === new Date(dt2).getTime()
// }

const checkNameEquality = (name1, name2) => {
  return name1.toLowerCase() === name2.toLowerCase()
}

module.exports.verifyUserIdentity = async (imageBase64, user) => {
  const { SHUFTIPRO_USERNAME, SHUFTIPRO_PASSWORD } = process.env

  const shuftiProApiUrl = 'https://shuftipro.com/api/'

  // request body
  const identityObject = {
    reference: uuidv4(),
    callback_url: 'https://api.getlug.com/api/v1/account/verifications/identity:verify-callback',
    verification_mode: 'any',
    document: {
      name: '',
      // dob: '',
      // document_number: '',
      // expiry_date: '',
      // issue_date: '',
      supported_types: ['id_card', 'driving_license', 'passport'],
      proof: imageBase64
    }
  }

  const requestConfig = {
    auth: {
      username: SHUFTIPRO_USERNAME,
      password: SHUFTIPRO_PASSWORD
    }
  }

  try {
    // console.log('verification is about to start')

    const { data: verificationResult } = await axios.post(shuftiProApiUrl, identityObject, requestConfig)

    // console.log('verification completed')

    // console.log('verificationResult', verificationResult)

    if (verificationResult.event !== 'verification.accepted') {
      console.log('verification: not accepted')
      return false
    }

    // console.log('verification accepted')

    // const { name, dob } = verificationResult.verification_data.document

    const { name } = verificationResult.verification_data.document

    const docFullName = normalizeName(name)

    const areFullNamesEqual = checkNameEquality(user.fullName, docFullName)

    if (!areFullNamesEqual) {
      console.log('verification: full names not equal')
      console.log('verification: user.fullName =>', user.fullName.toLowerCase())
      console.log('verification: docFullName =>', docFullName.toLowerCase())
      return false
    }

    // console.log('full names equal')

    // const docDateOfBirth = normalizeDateOfBirth(dob)

    // const areDateOfBirthsEqual = checkDateEquality(user.profile.dateOfBirth, docDateOfBirth)

    // if (!areDateOfBirthsEqual) {
    //   console.log('verification: user.dateOfBirth => ', user.profile.dateOfBirth)
    //   console.log('verification: docDateOfBirth', docDateOfBirth)
    //   console.log('verification: dates not equal')
    //   return false
    // }

    // console.log('dates equal')

    return true
  } catch (error) {
    console.log('verification: error', error)
    return false
  }
}
