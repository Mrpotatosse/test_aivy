const message_decoder = require('../../../dofus/buffer/message_decoder');
const buffer_writer = require('../../../dofus/buffer/buffer_writer');
const { handle_message } = require('../../../dofus/handler');
const { dofus_writer } = require('../../../dofus/io');

module.exports = async (server, socket, data, from_client) => {
    const receiver = from_client ? socket : socket.remote;
    const result = receiver.buffer_reader.parse_data(data);

    const instance_id_writer = new dofus_writer([]);

    for (let i = 0; i < result.length; i++) {
        result[i].message_data_decoded = message_decoder(server.dofus_protocol, result[i].message_data_buffer, result[i].message_id);

        const log_sending = {
            type: 'message_log'
        };

        if (!result[i].message_data_decoded.error) {
            if ((server.server_dofus_log_level === 'client' && from_client) ||
                (server.server_dofus_log_level === 'server' && !from_client) ||
                (server.server_dofus_log_level === 'all')) {

                log_sending.data = {
                    message: server.server_dofus_log_type === 'content' ? result[i].message_data_decoded : result[i],
                    port: server.server_port
                }

                global.websocket.broadcastClients(log_sending); // send log to websocket clients
            }

            if (from_client) {
                socket.LAST_INSTANCE_ID = result[i].instance_id;
                socket.DIFF_INSTANCE_ID = 0;

                const message_data = new buffer_writer(from_client).parse_message({
                    message_id: result[i].message_id,
                    instance_id: socket.current_instance_id(),
                    data: result[i].message_data_buffer
                });

                instance_id_writer.writeBytes(message_data);
            } else {
                socket.DIFF_INSTANCE_ID++;
            }

            await handle_message(server, socket, result[i]);
        }
    }

    if (from_client) {
        return instance_id_writer.data();
    }

    return data;
};
