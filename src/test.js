import DhlApi from './lib/blocker/index.js';
const dhlApi = new DhlApi();

const starter = async (data) => {
  // try {
  //   const res = await dhlApi.getNearestShop();
  //   console.log('res', res);
  // } catch (err) {
  //   console.error('err', err);
  // }
  // let x = 0;
  // for (x = 0; x < data.length; x++) {
  //   const newCountry = new Country({
  //     name: data[x].name,
  //     code2: data[x].code2,
  //     code3: data[x].code3,
  //     numericCode: data[x].numericCode,
  //   });
  //   let result = await newCountry.save();
  //   console.log('result', result);
  // }
  try {
    throw 'a';
  } catch (error) {
    throw 'b';
  } finally {
    console.log('sss');
  }
};

starter();
