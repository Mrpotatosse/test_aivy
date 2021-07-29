module.exports = (app) => {
    app.post('/dofus/characters/list', async (request, result) => {
        const characters = [];

        for(let i in global.servers){
            const clients = [...global.servers[i].clients];

            characters.push(...clients.filter(x => x.current_character).map(x => ({
                character: x.current_character,
                map: x.current_map_info
            })));
        }

        result.status(200).send(characters);
    });
}