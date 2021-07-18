const fetch = require('node-fetch');
const { read_file_async, read_mod_json_async } = require('../../utils/file_reader');
const { write_file_json_async } = require('../../utils/file_writer');

module.exports = (app) => {
    app.post('/scripts/execute', async (request, result) => {
        const code_url = request.body.url;

        const code = await fetch(code_url, {
            method: 'GET'
        })
            .then(res => res.text());

        try{
            eval(code);
        }catch(error){            
            result.status(200).send({
                result: 'error',
                reason: error.message
            });
            return;
        }

        result.status(200).send({
            result: 'ok'
        });
    });

    app.post('/scripts/list', async (request, result) => {
        const list = await read_mod_json_async('scripts.json', __dirname);
        result.status(200).send(list);
    });    

    app.post('/scripts/add', async (request, result) => {
        try{
            const list = await read_mod_json_async('scripts.json', __dirname);
            if(!request.body.name || request.body.name == ''){
                result.status(200).send({
                    result: 'error',
                    reason: 'Name must have value'
                });
                return;
            }

            if(!request.body.url || request.body.url == ''){
                result.status(200).send({
                    result: 'error',
                    reason: 'Url must have value'
                });
                return;
            }
            
            if(list.find(x => x.url === request.body.url)){
                result.status(200).send({
                    result: 'error',
                    reason: 'Script already in'
                });
            }else{
                list.push(request.body);
                write_file_json_async('scripts.json', __dirname, list);
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

    app.post('/scripts/remove', async (request, result) => {
        try{
            const list = (await read_mod_json_async('scripts.json', __dirname)).filter(x => x.url !== request.body.url || x.name !== request.body.name);
            write_file_json_async('scripts.json', __dirname, list);
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