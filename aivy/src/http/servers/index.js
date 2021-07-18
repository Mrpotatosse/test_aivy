const path = require('path');

const mitm = require('../../server/mitm');

const SERVER_NOT_STARTED = 'server not started'

module.exports = (app) => {
    /**
     * POST
     */
    app.post('/servers/list', async (request, result) => {
        if (global.servers && Array.isArray(global.servers)) {
            result.status(200).send(global.servers.map(s => ({
                title: s.server_title,
                port: s.server_port,
                link: `/servers/${s.server_port}`
            })));
        } else {
            result.status(200).send([]);
        }
    });

    app.post('/servers/add', async (request, result) => {
        if (!global.servers) global.servers = [];

        if (global.servers.find(s => s.server_port === request.body.port)) {
            result.status(200).send({
                result: 'error',
                reason: `Port ${request.body.port} already used`
            });
        } else {
            const type = request.body.type.find(t => t[0] === ':');
            let server;
            let events;
            try {
                const events_path = path.join(path.join(__dirname, '../../'), type.replace(':', ''));
                events = require(`${events_path}`);
            } catch {
                result.status(200).send({
                    result: 'error',
                    reason: `'${type.replace(':', '')}' is not implemented`
                });
                return;
            }

            server = mitm(
                events.on_server_started,
                events.on_server_closed,
                events.on_server_error,
                events.on_client_connected,
                events.on_client_data,
                events.on_client_disconnected);

            // server informations
            server.server_title = request.body.title;
            server.server_port = request.body.port;
            server.server_type = type.replace(':', '');
            server.server_uptime = SERVER_NOT_STARTED;

            const keys = Object.keys(request.body).filter(x => x.startsWith('additional_') && request.body[x] !== undefined);
            for(let k = 0;k<keys.length;k++){
                const key = keys[k].replace('additional_', 'server_');
                if(Array.isArray(request.body[keys[k]])){
                    server[key] = request.body[keys[k]].find(x => x.startsWith(':')).replace(':', '');
                }else{
                    server[key] = request.body[keys[k]];
                }
            }

            global.servers.push(server);

            result.status(200).send({
                result: 'ok'
            });
        }
    });

    app.post('/servers/remove', async (request, result) => {
        if (global.servers) {
            const server = global.servers.find(s => s.server_port === request.body.port);
            if (server) {
                if (server.isRunning) {
                    server.stop();
                }
                global.servers = global.servers.filter(s => s.server_port !== request.body.port);
                result.status(200).send({
                    result: 'ok'
                });
            } else {
                result.status(200).send({
                    result: 'error',
                    reason: `Server ${request.body.port} not found`
                });
            }
        }
    });

    app.post('/servers/informations', async (request, result) => {
        if (!global.servers) {
            result.status(200).send({
                result: 'error',
                reason: `Server ${request.body.port} is not found`
            });
            return;
        }

        const server = global.servers.find(x => x.server_port === request.body.port);

        if (server) {
            const informations_keys = Object.keys(server).filter(x => x.startsWith('server_'));
            const informations = {
                is_running: server.isRunning ?? false
            };

            for (let i = 0; i < informations_keys.length; i++) {
                informations[informations_keys[i].replace('server_', '')] = server[informations_keys[i]];
            }

            result.status(200).send(informations);
        } else {
            result.status(200).send({
                result: 'error',
                reason: `Server ${request.body.port} is not found`
            });
        }
    });

    app.post('/servers/run', async (request, result) => {
        if (!global.servers) {
            result.status(200).send({
                result: 'error',
                reason: `Server ${request.body.port} is not found`
            });
            return;
        }

        const server = global.servers.find(x => x.server_port === request.body.port);

        if (!server.isRunning) {
            server.start(server.server_port);
            server.server_uptime = new Date().toLocaleString();
        } else {
            server.stop();
            server.server_uptime = SERVER_NOT_STARTED;
        }

        const informations_keys = Object.keys(server).filter(x => x.startsWith('server_'));
        const informations = {
            is_running: server.isRunning ?? false
        };

        for (let i = 0; i < informations_keys.length; i++) {
            informations[informations_keys[i].replace('server_', '')] = server[informations_keys[i]];
        }

        result.status(200).send({
            result: 'ok',
            data: informations
        });
    });
    /**
     * GET
     */
}