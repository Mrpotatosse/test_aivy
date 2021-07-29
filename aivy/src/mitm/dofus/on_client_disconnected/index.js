module.exports = () => {
    global.websocket.broadcastClients({
        type: 'dofus_client_disconnected'
    });

    console.log('Dofus MITM client disconnected');
}
