const { inject_script, spawn_and_inject } = require('../../hook');
const { read_file_async, read_mod_json_async } = require('../../utils/file_reader');
const { write_file_json_async } = require('../../utils/file_writer');

module.exports = (app) => {
    app.post('/launch', async (request, result) => {
        const redirection_script_with_port = (await read_file_async('../../hook/redirection_script.js', __dirname)).toString().replace('PORT', request.body.port);
        const redirection_error_message = (message, data) => {
            console.log(message);
        };

        try{
            let pid = request.body.pid;
            if(pid){
                inject_script(pid, redirection_script_with_port, redirection_error_message);
            }else if(request.body.path){
                pid = await spawn_and_inject(request.body.path, redirection_script_with_port, redirection_error_message);
            }

            result.status(200).send({
                result: 'ok',
                pid 
            });
        }catch(error){
            result.status(200).send({
                result: 'error',
                reason: error.message
            });
        }
    });

    app.post('/launch/list', async (request, result) => {
        const list = await read_mod_json_async('launch.json', __dirname);
        result.status(200).send(list);
    });

    app.post('/launch/add', async (request, result) => {
        try{
            const list = await read_mod_json_async('launch.json', __dirname);
            if(!request.body.path || request.body.path == ''){
                result.status(200).send({
                    result: 'error',
                    reason: 'Path must have value'
                });
                return;
            }
            if(!request.body.port || request.body.port == 0){
                result.status(200).send({
                    result: 'error',
                    reason: 'Port must have value'
                });
                return;
            }
            
            if(list.find(x => x.path === request.body.path && x.port === request.body.port)){
                result.status(200).send({
                    result: 'error',
                    reason: 'Item already in'
                });
            }else{
                list.push(request.body);
                write_file_json_async('launch.json', __dirname, list);
                result.status(200).send({
                    result: 'ok'
                });
            }
        }catch(error){
            result.status(200).send({
                result: 'error',
                reason: error.message
            });
        }
    });

    app.post('/launch/remove', async (request, result) => {
        try{
            const list = (await read_mod_json_async('launch.json', __dirname)).filter(x => x.path !== request.body.path || x.port !== request.body.port);
            write_file_json_async('launch.json', __dirname, list);
            result.status(200).send({
                result: 'ok'
            });
        }catch(error){
            result.status(200).send({
                result: 'error',
                reason: error.message
            });
        }
    });
}