const websocket = require('../server/websocket');

const on_client_connected = require('./on_client_connected');
const on_client_closed    = require('./on_client_closed');
const on_client_error     = require('./on_client_error');
const on_client_message   = require('./on_client_message');

const WSPORT = process.env.WS_PORT || 3030;

module.exports = () => {
    return websocket(
        on_client_connected,
        on_client_message,
        on_client_closed,
        on_client_error,
        {
            host: '127.0.0.1',
            port: WSPORT
        }
    );
}