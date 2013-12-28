
/**
 * HTTP 
 */

var http = require('http');

/**
 * HTTPS
 */

var https = require('https');

/**
 * File System
 */

var fs = require('fs');

/**
 * Path
 */

var path = require('path');

/**
 * websocket
 */

var WebSocketServer = require('websocket').server;

/**
 * HTTPS certificate & privatekey
 */

var options = {
  key: fs.readFileSync('privatekey.pem'),
  cert: fs.readFileSync('certificate.pem')
};

/**
 * Serve static pages thru HTTPS
 */

https.createServer(options, function (req, res) {
    
    var filePath = '.' + req.url;
    if (filePath == './')
        filePath = './index.html';
        
    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }
    
    path.exists(filePath, function(exists) {
    
        if (exists) {
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    res.writeHead(500);
                    res.end();
                }
                else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        }
        else {
            res.writeHead(404);
            res.end();
        }
    });
}).listen(8886);

/**
 * Server static pages thru HTTP
 */

var connect = require('connect');
connect.createServer(
    connect.static(__dirname)
).listen(8887);

/** 
 * Store client connections
 */

var connections = [];

/**
 * Create server for managing websocket connection
 */

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});
server.listen(1337, function() { });

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

/**
 * Listen to webserver event
 */

wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);

    connections.push({id: '', socket: connection});

    console.log("New peer connected");

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(evt) {
        if (evt.type === 'utf8') {
            // process WebSocket message

            var msg = JSON.parse(evt.utf8Data);
            
            var caller = msg.caller;

            var callee = msg.callee;

            console.log("RECEIVED from <" + caller + ">:" + evt.utf8Data);

            if(msg.data.type === "join") {

                for (var i=0;i<connections.length;i++) {
                    // Associate Socket <-> ID
                    if(connections[i].socket === connection) {
                        console.log("old id:" + connections[i].id);
                        connections[i].id = caller;
                        console.log("<"+ caller + "> has been associated to a socket");
                    }
                    // Send information about other peer connected
                    else {
                        console.log("Inform <" + connections[i].id + "> about new peer <" + caller + ">");
                        connections[i].socket.send(evt.utf8Data);

                        console.log("Inform <" + caller + "> about connected <" + connections[i].id + ">");

                        // Send to this peer all others connections
                        var msg = {
                            data: {
                                type: 'already_joined'
                            },
                            callee: caller,
                            caller: connections[i].id
                        };

                        connection.send(JSON.stringify(msg));
                    }
                }

            } else {
                if(callee !== "all") {

                     for (var i = 0;i < connections.length; i++) {
                        console.log("Connections:" + connections[i].id);
                        if(connections[i].id === callee) {
                            console.log("Send message <" + msg.data.type + "> to <" + connections[i].id + ">");
                            connections[i].socket.send(evt.utf8Data);
                        }
                     }
                }
                else {
                    for (var i = 0;i < connections.length; i++) {
                        if(connections[i].socket !== connection) {
                            console.log("Send message <" + msg.data.type + "> to <" + connections[i].id + ">");
                            connections[i].socket.send(evt.utf8Data);
                        }
                    }
                }
            }

            
        }
        else {
          console.log("RECEIVED OTHER:" + evt.binaryData);
        }
    });

    connection.on('close', function(evt) {
        
        var index = -1;

        for (var i = 0;i < connections.length; i++) {
            if(connections[i].socket === connection) {
                index = i;
            }
        }

        if(index > -1) {
            console.log("remove item:" + index);
            var old = connections.splice(index, 1);

            //Inform others peer about the disconnection
            for (var i = 0;i < connections.length; i++) {
                if(connections[i].socket !== connection) {

                    var toSend = {
                        data: {
                            type:'release'
                        },
                        callee: 'all',
                        caller:old[0].id
                    };
                    connections[i].socket.send(JSON.stringify(toSend));
                }
            }
        }
    });
});