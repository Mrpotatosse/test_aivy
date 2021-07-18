const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.HTTP_PORT || 5000;

const set_default_path = _ => {
    app.get('*', async (request, result) => {
        result.status(404).send({
            error: 'Page not found',
            url: request.url
        });
    });
}

module.exports = {
    app,
    start_http: _ => {
        set_default_path();
        
        const server = app.listen(PORT, () => {
            console.log(`http server started on port [${PORT}]`);
        });

        process.on('SIGINT', _ => {
            server.close();
        });

        return server;
    }
}