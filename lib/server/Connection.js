
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
var Connection = function( manager, sock, id, user ) {

    this.manager = manager;
    this.conn = sock;
    this.id = id || uuid.v1();
    this.user = user;
    this.lobby = {};
    
    var conn = this;
    
    this.conn.on('message', function( message ) {
    
        conn.onmessage( JSON.parse( message.utf8Data ) );
    
    } );
    
    this.conn.on('close', function(reason, description) {
        conn.onclose( reason, description );
    });

};

Connection.prototype.onmessage = function( message ) {

    this.manager.protocol.handle( this, message );
    return;
    
    if( !this.inlobby ) {
    
        switch( message.cmd ) {
        
            case 'lobby.list':
                var seq = this.manager.list( message.application );
                
                if( seq === false ) {
                    this.send({ cmd: 'error', message: 'No such application on the server' });
                    break;
                }
                
                this.send( { cmd: 'lobby.list', application: message.application, list: seq } );
                return;
                
            case 'lobby.create':
                var lobby = this.manager.createLobby( message.application, this, message['private'] );
                
                if( !lobby ) {
                    this.send({ cmd: 'error', message: 'No such lobby on the server' });
                    break;
                }
                
                this.lobby = lobby;
                this.inlobby = true;
                this.send({
                    cmd: 'lobby.new',
                    lobby: {
                        name: message.lobby,
                        id: this.lobby.id,
                        host: this.lobby.host.user.username
                    }
                });
                return;
            
            case 'lobby.join':
                this.join( message.lobby, message.id );
                return;
            
            default:
                this.send({cmd: 'error', message: 'Unrecognised command or invalid state.'});
                return;
        
        }
    
    }

};

Connection.prototype.onclose = function( reason, description ) {

    console.log((new Date()) + '] cr >> ' + this.user.username + ' disconnected.');
    this.quit( 'connection closed' );

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
    
    try {
        this.conn.close();
    } catch( err ) {
        
    }

};

module.exports = Connection;