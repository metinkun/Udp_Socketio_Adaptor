const ascii = /^[\x00-\x7F]+$/;

export const isAscii = (str) => {
  return ascii.test(str);
};
