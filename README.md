lobber
======

A library for creating and managing application lobbies.

This stuff is fairly simple, and lobber comes with a simple type of Lobby object
which acts as a chatroom.

## Example
In this example, you can see how to create a very simple chat application.

### Server
On the server, you will need something like this.

```javascript
// At the moment we need to use node-websocket for the websocket server
var http = require('http'),
    WebSocketServer = require('websocket').server,
    lobber = require('lobber');

// Create a simple HTTP server.
var server = http.createServer(function(request, response) {
    response.writeHead(404);
    response.end();
});

// Listen for connections on port 8044    
server.listen(8044, function() {
    console.log((new Date()) + '] lobber server listening on port 8044');
});

// Create a WebSocket server
var wss = new WebSocketServer({
    httpServer: crserver,
    autoAcceptConnections: false
});

// Create a lobber server!
var lobserver = new lobber.Server( {
    websocket: crwss
});

// This is to prevent circular imports in lobber...
var ChatLobby = lobber.ChatLobby.Manager( 'chat' );

// Register a chat application, and use ChatLobby to manage individual lobbies.
lobserver.manager.registerApplication( 'chat', ChatLobby );

// You need to tell the server whether to accept a request or not.
// If you don't overwrite this method, all requests will be rejected!
lobserver.onrequest = function( request, response, answer ) {

    // Connections must have an associated user object.
    // User objects should have an attribute `username`.
    // Pass this to the answer method if you accept a request.
    // Accept a request
    var user = { username: 'testUser' };
    answer( true, user );
    console.log((new Date()) + '] lobber >> New connection from ' + user.username);

};

```

### Client
Need to make a client library...

