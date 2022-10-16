/* eslint-disable no-unused-vars */
import socketServer from 'socket.io';
import {socketHandler, udpLoader} from 'lib/taskManager';
import dgram from 'node:dgram';

export default async (app, http) => {
  const udpServer = dgram.createSocket('udp4');

  const io = socketServer(http, {
    path: '/websocket',
    pingInterval: 5000,
    pingTimeout: 10000,
  });
  // const io = socketServer.listen(3333);

  io.on('connection', socketHandler);
  udpLoader(udpServer);
};
