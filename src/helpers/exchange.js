import delay from 'delay';
import Binance from 'node-binance-api-ext';
const bn = Binance();

const CORRECTION_CONST = 10000000000;
const roundNumber = (number, multiplier) => Math.round(number * (multiplier || CORRECTION_CONST));
const calcPrice = (price, symbol) => {
  const info = exchangeInfo[symbol];
  const tickSize = Number(info?.filters?.[0]?.tickSize);
  const tickMultiplier = Math.round(1 / tickSize);
  if (tickSize != 0) return roundNumber(price, tickMultiplier) / tickMultiplier;
};

export let exchangeInfo;
let exchangeInfoRoutineStared = false;
export const exchangeInfoRoutine = async () => {
  if (exchangeInfoRoutineStared) return;
  exchangeInfoRoutineStared = true;
  while (true) {
    try {
      exchangeInfo = await bn.futures.exchangeInfo();
      exchangeInfo = exchangeInfo.symbols.reduce((out, i) => ((out[i.symbol] = i), out), {});
    } catch (error) {}
    await delay(5 * 60 * 1000);
  }
};

export let prices = {};
let pricesRoutineStared = false;
export const pricesRoutine = async () => {
  if (pricesRoutineStared) return;
  pricesRoutineStared = true;
  while (true) {
    try {
      prices = await bn.futures.prices();
    } catch (error) {}
    await delay(200);
  }
  // botsRoutine();
  // updateRoutine();
};

const roundStep = (qty, stepSize) => {
  // Integers do not require rounding
  if (Number.isInteger(qty)) return qty;
  const qtyString = qty.toFixed(16);
  const desiredDecimals = Math.max(stepSize.indexOf('1') - 1, 0);
  const decimalIndex = qtyString.indexOf('.');
  return parseFloat(qtyString.slice(0, decimalIndex + desiredDecimals + 1));
};

export const keyObject = (user, params = {}) => {
  return {APIKEY: user.apiKey, APISECRET: user.secretKey, ...params};
};

export const fixOrderAmount = (qty, symbol) => {
  let maxQty, minQty, stepSize;
  const info = exchangeInfo[symbol];

  maxQty = parseFloat(info.filters[1].maxQty);
  minQty = parseFloat(info.filters[1].minQty);
  stepSize = parseFloat(info.filters[1].stepSize);

  if (qty >= maxQty) qty = maxQty;
  if (qty <= minQty) qty = minQty;

  qty = Math.round(qty * CORRECTION_CONST) - Math.round(minQty * CORRECTION_CONST);

  qty = Math.round(qty) / CORRECTION_CONST;

  qty = Math.round(qty * CORRECTION_CONST) - (Math.round(qty * CORRECTION_CONST) % Math.round(stepSize * CORRECTION_CONST));

  qty = Math.round(qty) / CORRECTION_CONST;

  qty = Math.round(qty * CORRECTION_CONST) + Math.round(minQty * CORRECTION_CONST);
  qty /= CORRECTION_CONST;
  qty = roundStep(qty, '' + stepSize);

  return qty;
};

export const parseTradeResult = (tradeResult) => {
  let {avgPrice, price, fills, executedQty, symbol, origQty} = tradeResult;

  const onResError = () => {
    console.log('!!!!!!!!!!!!!!!!!! wrong order result', tradeResult);
    throw 'order result error';
  };

  if (!symbol) onResError();

  if (avgPrice && parseFloat(avgPrice) > 0) tradeResult.price = parseFloat(avgPrice);
  else if (fills?.[0]) {
    tradeResult.price = fills.reduce((p, c) => p + parseFloat(c.price), 0) / fills.length;
  } else if (price && parseFloat(price) > 0) tradeResult.price = parseFloat(price);
  else onResError();

  tradeResult.price = calcPrice(tradeResult.price, symbol);

  if (executedQty && parseFloat(executedQty)) {
    tradeResult.executedQty = parseFloat(executedQty);
    let commission = 0;
    tradeResult?.fills?.forEach((el) => {
      if (symbol.startsWith(el.commissionAsset)) commission += parseFloat(el.commission);
    });
    tradeResult.origQty = parseFloat(tradeResult.origQty);
    tradeResult.executedQty = parseFloat(tradeResult.executedQty);
    tradeResult.executedQty = fixOrderAmount(Math.floor((tradeResult.executedQty - commission) * CORRECTION_CONST) / CORRECTION_CONST, symbol);
    tradeResult.commission = commission;
  } else onResError();
};

export const getOrderStatus = async (user, symbol, orderID) => {
  try {
    const orderStatus = await bn.futures.orderStatus(symbol, keyObject(user, {origClientOrderId: orderID}));
    if (orderStatus && orderStatus.status) {
      parseTradeResult(orderStatus);
      if (orderStatus.status === 'FILLED') return {...orderStatus, filled: true};
      else if (orderStatus.status === 'CANCELED') return {...orderStatus, canceled: true};
      else if (orderStatus.status === 'EXPIRED') return {...orderStatus, expired: true};
      else if (orderStatus.status === 'PARTIALLY_FILLED') return {...orderStatus, partiallyFilled: true};
      else if (orderStatus.status === 'NEW') return {...orderStatus, new: true};
    } else return false;
  } catch (error) {
    console.log(error);
    if (error.code === -2011) {
      return {canceled: true};
    }
  }
  return false;
};
