global.http      = require('./src/http')();      // init http server
global.websocket = require('./src/websocket')(); // init websocket server

global.__SRC     = require('path').join(__dirname, './src'); // init src location for scripts