export const getIpFromSocket = (socket) => {
  //'::ffff:127.0.0.1'
  const ipString = socket?.handshake?.address;
  if (ipString.indexOf(':') >= 0) {
    if (ipString.indexOf('.') >= 0) return ipString.substring(ipString.lastIndexOf(':') + 1);
    else return ipString;
  } else if (ipString.indexOf('.') >= 0) {
    return ipString;
  }
};
