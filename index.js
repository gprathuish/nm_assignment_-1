var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

// create httpServer
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

// start the server
httpServer.listen(config.httpPort,() => {
    console.log('server started on ' + config.httpPort);
});

var httpOptions = {
    'key': fs.readFileSync('./https/key.pen'),
    'cert': fs.readFileSync('./https/cert.pem')
}
// create httpsServer
const httpsServer = https.createServer(httpOptions, (req, res) => {
    unifiedServer(req, res);
});

// start the server
httpsServer.listen(config.httpsPort,() => {
    console.log('server started on ' + config.httpsPort);
});

// unique server code 
unifiedServer = function(req, res){
    // parse the url
    var parsedUrl = url.parse(req.url, true);

    // get the trimmed path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // get the query params
    var queryParams = parsedUrl.query;

    // get the method
    var method = req.method.toLowerCase();

    // get the headers
    var headers = req.headers;

    // get the payload
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', (data) => { buffer = buffer + decoder.write(data) });
    req.on('end', () => {
        buffer = buffer + decoder.end();
        // choose handler on path match
        var choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handler.notFound;
        var data = {
            'trimmedPath': trimmedPath,
            'queryParams': queryParams,
            'payload': JSON.parse(buffer),
            'method': method,
            'headers': headers
        }

        choosenHandler(data, (statusCode, payload) => {
            
            // set the status code 
            statusCode = typeof (statusCode) == 'number' ?  statusCode : 200;
            

            // set the payload to send as responce to the clien
            payload =  typeof (payload) == 'object' ? payload : {};
            
            // convert the payload to string
            var payloadString = JSON.stringify(payload);

            // set the headers before sending the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
        });
        
    });
};

var handler = {};

// hello handler 
handler.hello = function(data, callback) {
    callback(200, {hello: 'message'});
}

// notfound hander
handler.notFound = function(data, callback) {
    callback(404);
}

// Define Routes
var router = {
    hello: handler.hello
}