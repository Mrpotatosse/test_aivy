const frida = require('frida');

/**
 * 
 * @param {number} target 
 * @param {string} script_str
 * @param {Function<string, object>} on_script_connected
 * 
 * @return {void}
 */
const inject_script = async (target, script_str, on_script_connected) => {
    // attach frida to target
    const session = await frida.attach(target);
    // create script
    const script = await session.createScript(script_str);
    // init output message
    script.message.connect(on_script_connected);
    // load script
    await script.load();
}

/**
 * 
 * @param {string} target_path 
 * @param {string} script_str 
 * @param {Function<string, object>} on_script_connected 
 * 
 * @return {Promise<number>}
 */
const spawn_and_inject = async (target_path, script_str, on_script_connected) => {
    // create process
    const process_id = await frida.spawn(target_path);
    // replace script #_PROCESS_ID_ by process_id
    script_str = script_str.replace('#_PROCESS_ID_#', `${process_id}`);
    // inject script
    await inject_script(process_id, script_str, on_script_connected);
    // resume process
    frida.resume(process_id);
    // return pid
    return process_id;
}

module.exports = {
    inject_script,
    spawn_and_inject
}