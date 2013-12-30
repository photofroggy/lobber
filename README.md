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
// Create a lobber server!
var lobserver = new lobber.Server( {
    websocket: 8044,
    socket: 8080
});

// This is to prevent circular imports in lobber...
var ChatLobby = lobber.ChatLobby.Manager( 'chat' );

// Register a chat application, and use ChatLobby to manage individual lobbies.
lobserver.manager.registerApplication( 'chat', ChatLobby );

// This method is called when someone connects.
lobserver.onconnect = function( connection ) {

    // Connections must be logged in to do anything specific.
    // You can grant a connection access to whatever here, or you
    // can wait for the user to send login data over the socket and
    // verify it.
    connection.onlogin = function( data ) {
    
        // Set the username
        connection.user.username = data.username;
        // Grant access to everything else
        connection.user.loggedIn = true;
    
    };

};

```

### Client
Here we can use clobber to make a client, connect, and open a lobby/chatroom.

```javascript```
// Create a new lobber client.
// This client automatically sends a login packet when connected.
// Hence, the username and token should be provided here.
var client = new Clobber({
    "server": "ws://addr:port",
    "user": {
        "name": "username",
        "token": "token"
    }
});

// Create a lobby for chatrooms.
var ChatLobby = function( client, ns, conn ) {

    Clobber.Lobby.call(this, client, ns, conn);
    this.type = 'chat';

};

ChatLobby.prototype = new Clobber.Lobby;
ChatLobby.prototype.constructor = clobb;

// Register the application with the client.
client.registerApplication( 'chat', ChatLobby );

// Connect to the server
client.connect();

// Join/open a channel when we log in
client.on( 'pkt.login', function( event, client ) {

    client.open( 'chat', 'test' );

} );

// Chat lobby is already open, so join  it instead.
client.on( 'lobby.open.error', function( event, client ) {

    client.join( event.application, event.id );

} );

// Joined a lobby! Say hello world!
client.on( 'lobby.join', function( event, client ) {

    event.lobby.say( 'Hello, world!' );

} );
```

