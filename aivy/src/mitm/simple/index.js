const on_server_started      = require('./on_server_started');
const on_server_closed       = require('./on_server_closed');
const on_server_error        = require('./on_server_error');

const on_client_connected    = require('./on_client_connected');
const on_client_disconnected = require('./on_client_disconnected');
const on_client_data         = require('./on_client_data');

module.exports = {
    on_server_started,
    on_server_closed,
    on_server_error,
    
    on_client_connected,
    on_client_disconnected,
    on_client_data
}