
var uuid = require('node-uuid');


/**
 * This object represents and handles a user's connection.
 * 
 * The `user` parameter should be an object with an attribute `username`.
 * @class lobber.Connection
 * @constructor
 * @param manager {Object} Instance of lobber.LobbyManager
 * @param manager {Object} Instance of a node-websocket connection
 * @param id {String} Unique identifier for the connection/user. Users should
 *                    get a different id per connection.
 * @param user {Object} An object representing the user. Should at least have
 *                      an attribute `username`, otherwise things will break.
 */
var Connection = function( manager, sock, id ) {

    this.manager = manager;
    this.conn = sock;
    this.id = id || uuid.v1();
    this.user = {
        username: '',
        loggedIn: false
    };
    
    this.lobby = {};

};

Connection.prototype.onmessage = function( message ) {

    this.manager.protocol.handle( this, message );
    return;

};

Connection.prototype.onclose = function( reason, description ) {

    console.log((new Date()) + '] lobber >> ' + this.user.username + ' disconnected.');
    this.quit( reason || 'connection closed' );

};

/**
 * Log a user in on this connection.
 * 
 * @method onlogin
 * @param data {Object} Data sent on the socket
 */
Connection.prototype.onlogin = function( data ) {

    

};

/**
 * Get information about the connection and user.
 * 
 * This method returns information to be sent over a WebSocket connection when
 * the connection is added to a lobby. Overwrite this method in a subclass if
 * you want different information to be sent.
 * 
 * @method info
 * @param connection {Object} The lobber.Connection that the information is
 *                            intended for.
 */
Connection.prototype.info = function( connection, lobby ) {

    return {
        id: this.id,
        username: this.user.username,
        host: ( lobby ? lobby.host == this : false )
    };

};

/**
 * Send data on a connection.
 * 
 * @method send
 * @param data {Object} Data to send on the socket
 */
Connection.prototype.send = function( data ) {

    this.conn.send( JSON.stringify( data ) );

};

/**
 * Join a lobby.
 * @method join
 * @param lobby {Object} Lobby to join.
 */
Connection.prototype.join = function( lobby ) {

    if( !this.lobby.hasOwnProperty( lobby.name ) ) {
        this.lobby[lobby.name] = [ lobby ];
        return true;
    }
    
    if( !lobby.polygamus && this.lobby[lobby.name].length > 0 )
        return false;
    
    this.lobby[lobby.name].push( lobby );
    return true;

};

/**
 * Part a lobby.
 * @method part
 * @param lobby {Object} Lobby to join.
 */
Connection.prototype.part = function( lobby ) {

    if( !this.lobby.hasOwnProperty( lobby.name ) ) {
        return false;
    }
    
    var i = this.lobby[lobby.name].indexOf( lobby );
    
    if( i == -1 )
        return false;
    
    this.lobby[lobby.name].splice( i, 1 );
    return true;

};

/**
 * Disconnect from the server. Part all lobbies.
 * @method quit
 */
Connection.prototype.quit = function( reason ) {

    for( var app in this.lobby ) {
    
        if( !this.lobby.hasOwnProperty( app ) )
            continue;
        
        for( var i = 0; i < this.lobby[app].length; i++ ) {
        
            if( !this.lobby[app].hasOwnProperty( i ) )
                continue;
            
            this.lobby[app][i].part( this, reason );
        
        }
    
    }
    
    this.manager.server.quit( this );

};


/**
 * This object represents and handles a user's websocket connection.
 * 
 * The `user` parameter should be an object with an attribute `username`.
 * @class lobber.Connection
 * @constructor
 * @param manager {Object} Instance of lobber.LobbyManager
 * @param manager {Object} Instance of a node-websocket connection
 * @param id {String} Unique identifier for the connection/user. Users should
 *                    get a different id per connection.
 * @param user {Object} An object representing the user. Should at least have
 *                      an attribute `username`, otherwise things will break.
 */
Connection.WebSocket = function( manager, sock, id ) {

    Connection.call(this, manager, sock, id );
    
    var conn = this;
    
    this.conn.on('message', function( message ) {
    
        conn.onmessage( JSON.parse( message.utf8Data ) );
    
    } );
    
    this.conn.on('close', function(reason, description) {
        conn.onclose( reason, description );
    });

};

Connection.WebSocket.prototype = new Connection();
Connection.WebSocket.prototype.constructor = Connection.WebSocket;

/**
 * Send data on a connection.
 * 
 * @method send
 * @param data {Object} Data to send on the socket
 */
Connection.WebSocket.prototype.send = function( data ) {

    this.conn.send( JSON.stringify( data ) );

};

/**
 * Quit the server.
 * 
 * @method quit
 * @param reason {String} Reason for quitting
 */
Connection.WebSocket.prototype.quit = function( reason ) {

    Connection.prototype.quit.call( this, reason );
    
    try {
        this.conn.close();
    } catch( err ) {
        
    }

};


/**
 * This object represents and handles a user's socket connection.
 * 
 * The `user` parameter should be an object with an attribute `username`.
 * @class lobber.Connection
 * @constructor
 * @param manager {Object} Instance of lobber.LobbyManager
 * @param manager {Object} Instance of a node-websocket connection
 * @param id {String} Unique identifier for the connection/user. Users should
 *                    get a different id per connection.
 * @param user {Object} An object representing the user. Should at least have
 *                      an attribute `username`, otherwise things will break.
 */
Connection.Socket = function( manager, sock, id ) {

    Connection.call(this, manager, sock, id );
    
    var conn = this;
    this._buf = '';
    
    this.conn.on('data', function( buffer ) {
    
        conn.buffer( buffer );
    
    } );
    
    this.conn.on('close', function(reason, description) {
        conn.onclose( 'connection closed' );
    });

};

Connection.Socket.prototype = new Connection();
Connection.Socket.prototype.constructor = Connection.Socket;

/**
 * Buffer incoming data.
 *
 * @method buffer
 * @param buffer {String} Data to buffer
 */
Connection.Socket.prototype.buffer = function( buffer ) {

    this._buf+= buffer;
    
    var segs = this._buf.split( '\0' );
    
    this._buf = segs.pop();
    
    for( var i = 0; i < segs.length; i++ ) {
        
        this.onmessage( JSON.parse( segs[i] ) );
    
    }

};

/**
 * Send data on a connection.
 * 
 * @method send
 * @param data {Object} Data to send on the socket
 */
Connection.Socket.prototype.send = function( data ) {

    this.conn.write( JSON.stringify( data ) + '\0' );

};

/**
 * Quit the server.
 * 
 * @method quit
 * @param reason {String} Reason for quitting
 */
Connection.Socket.prototype.quit = function( reason ) {

    Connection.prototype.quit.call( this, reason );
    
    try {
        this.conn.destroy();
    } catch( err ) {
        
    }

};


module.exports = Connection;