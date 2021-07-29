const handlers_manager = {
    all: [],
    client: [],
    server: []
};

const add_handler = (message_name, handler_obj) => {
    remove_handler(message_name, handler => handler.name !== handler_obj.name);

    if(!handlers_manager[message_name]) handlers_manager[message_name] = [];
    handlers_manager[message_name].push(handler_obj);

    console.log(`handler [${handler_obj.name ?? 'no_name /!\\'}] added on [${message_name}]`);
}

const remove_handler = (message_name, handler_filter) => {
    if(handlers_manager[message_name]){
        handlers_manager[message_name] = handlers_manager[message_name].filter(handler_filter);
    }
}

const handle_message = async (server, socket, informations) => {
    try{
        await active_all_handlers(server, socket, informations, 'all');
        await active_all_handlers(server, socket, informations, informations.from_client ? 'client' : 'server');
        await active_all_handlers(server, socket, informations, informations.message_data_decoded.__name);
    }catch(error){
        console.error(error);
    }
}

const active_all_handlers = async (server, socket, informations, handler_manager_name) => {
    if(handlers_manager[handler_manager_name]){
        handlers_manager[handler_manager_name].forEach(handler => {
            active_handler(server, socket, informations, handler);
        });
    }
}

const active_handler = async (server, socket, informations, handler_obj) => {
    try{
        await handler_obj.handle(server, socket, informations).then(async () => {
            if(handler_obj.endHandle){
                await handler_obj.endHandle(server, socket, informations);
            }
        });
    }catch(error){
        if(handler_obj.error){
            handler_obj.error(server, socket, informations, error);
        }
    }
}

module.exports = {
    add_handler,
    remove_handler,
    handle_message
}