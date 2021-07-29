const buffer_reader = require('../../../dofus/buffer/buffer_reader');
const buffer_writer = require('../../../dofus/buffer/buffer_writer');
const message_encoder = require('../../../dofus/buffer/message_encoder');

module.exports = (server, socket) => {
    console.log('Dofus MITM client connected');

    socket.buffer_reader = new buffer_reader(true);
    socket.remote.buffer_reader = new buffer_reader(false);

    socket.LAST_INSTANCE_ID = 0;
    socket.DIFF_INSTANCE_ID = 0;
    socket.FAKE_MESSAGE_CREATED = 0;

    socket.current_instance_id = () => {
        return socket.LAST_INSTANCE_ID + socket.DIFF_INSTANCE_ID + socket.FAKE_MESSAGE_CREATED;
    }

    socket.send_dofus_message = (dofus_message, from_client, increment_fake_count=true) => {
        const send_socket = from_client ? socket.remote : socket;
        const {
            protocol_id,
            buffer
        } = message_encoder(server.dofus_protocol, dofus_message);

        if(from_client && increment_fake_count){
            socket.FAKE_MESSAGE_CREATED++;
        }

        const packet_data = new buffer_writer(from_client).parse_message({
            message_id: protocol_id,
            instance_id: socket.current_instance_id(),
            data: buffer
        });

        send_socket.write(packet_data);
    }
};
