import {slaves} from 'services/botNet';

export const tasks = [];

let udpIp, updPort;
let myUdpServer;

export const socketHandler = (socket) => {
  let slave;
  if (!slave) {
    slave = {messages: []};
    slaves.push(slave);
  }

  slave.socket = socket;
  slave.connectedOn = Date.now();
  slave.isConnected = true;

  console.log(slave.socket.id, 'connected');

  socket.on('disconnect', () => {
    slave.isConnected = false;
    slave.disconnectedOn = Date.now();
    console.log(slave.socket.id, 'disconnected');
  });

  socket.on('message', (msg) => {
    console.log('message', msg);
    //slave.socket.emit('message', msg);
    if (udpIp && updPort && myUdpServer) {
      console.log('udpsent', msg, updPort, udpIp);
      const a = new Uint8Array(msg);
      myUdpServer.send(a, updPort, udpIp);
    }
  });
};

export const udpLoader = (udpServer) => {
  myUdpServer = udpServer;
  udpServer.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    udpServer.close();
  });

  udpServer.on('message', (msg, rinfo) => {
    udpIp = rinfo.address;
    updPort = rinfo.port;
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    slaves.find((el) => el.isConnected)?.socket?.emit('message', String(msg));
  });

  udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`server listening ${address.address}:${address.port}`);
  });

  // udpServer.bind(8015, '10.0.1.82');
  udpServer.bind(8015, process.env.BIND_IP);
};
