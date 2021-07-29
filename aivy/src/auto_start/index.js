const {read_mod_json} = require('../utils/file_reader');
const fetch = require('node-fetch');

module.exports = async () => {
    const urls = read_mod_json('auto_start.json', __dirname);

    for(let i in urls){
        const url = urls[i];

        const code = await fetch(url, {
            method: 'GET'
        })
            .then(res => res.text());
        try{
            eval(code);
            console.log(`[${url}] initied`);
        }catch(error){       
            console.error(`[${url}]`, error);
        }
    }
}