
var uuid = require('node-uuid');

/**
 * Representation and handling for a lobby.
 * 
 * The idea for this comes from game lobbies. A lobby contains a host, and
 * various connections to users. There may also be some state determining if
 * a game has started or whatever but I'm not sure.
 * 
 * To make a lobby for a particular application, create a subclass of this
 * object and set the `name` parameter. To make sure that your lobby is used
 * by the manager, you will also need to call
 * `lobber.LobbyManager.registerApplication`.
 * @class lobber.Lobby
 * @constructor
 * @param host {Object} Instance of lobber.Connection
 * @param id {String} Unique identifier for the lobby.
 * @param tag {String} Essentially a name for the lobby.
 * @param [private=false] {Boolean} Determine whether public access is granted
 *                                  or not.
 */
var Lobby = function( manager, host, id, tag, plob ) {

    this.id = id || uuid.v1();
    this.tag = tag;
    this.name = 'lobby';
    this.host = host;
    this.manager = manager;
    this.isPrivate = plob || false;
    this.polygamus = false;
    this.connections = [];
    this.connections.push( host );

};

/**
 * Get information about the lobby to send across a websocket connection.
 *
 * @method info
 * @param connections {Boolean} Include connections
 */
Lobby.prototype.info = function( connections, connection ) {

    connections = connections || false;
    
    var lobby = {
        application: this.name,
        id: this.id,
        tag: this.tag
    };
    
    if( !connections )
        return lobby;
    
    lobby.connections = [];
    
    var conn = null;
    
    for( var i = 0; i <= this.connections.length; i++ ) {
    
        if( !this.connections.hasOwnProperty( i ) )
            continue;
        
        conn = this.connections[i];
        lobby.connections.push( conn.info( connection, this ) );
    
    }
    
    return lobby;

};

/**
 * Send a command to all connections in the lobby.
 * @method send
 * @param command
 */
Lobby.prototype.send = function( command ) {

    command.lobby = this.info(  );
    
    this.each( function( connection ) {
        connection.send( command );
    } );

};

/**
 * Call a method for each connection.
 * @method each
 * @param method {Function} Method to call for each connection.
 */
Lobby.prototype.each = function( method ) {

    for( var i = 0; i < this.connections.length; i++ ) {
    
        if( !this.connections.hasOwnProperty( i ) )
            continue;
        
        method( this.connections[i] );
    
    }

};

/**
 * Close the lobby!
 * @method close
 * @param [connection] {Object} Connection closing the channel
 */
Lobby.prototype.close = function( connection ) {

    if( !!connection && connection != this.host && this.connections.length > 0 ) {
    
        connection.send({ cmd: 'error', message: 'Only hosts can close lobbies.', lobby: this.info() });
        return;
    
    }
    
    var command = {
        cmd: 'lobby.close',
        user: connection.info( null, this )
    };
    
    var lobby = this;
    
    this.each( function( connection ) {
        connection.part( lobby );
        connection.send( command );
    } );
    
    this.connections = [];
    this.manager.close( this );

};

/**
 * Overwrite this method in subclasses!
 * 
 * Determine whether or not to let a connection join the lobby. By default this
 * method simply returns 0. Return an integer representing the response to the
 * request. 0 to accept the request, 1 to deny the request, 2 to signify that
 * the request has already been denied (error message sent on the connection).
 *
 * @method joinRequest
 * @param connection {Object} Instance of lobber.Connection
 * @returns {Integer} Status of the request.
 */
Lobby.prototype.joinRequest = function( connection ) {

    return 0;

};

/**
 * A connection has requested to join the lobby. Add them!
 *
 * @method join
 * @param connection {Object} Connection to join the channel.
 */
Lobby.prototype.join = function( connection ) {

    switch( this.joinRequest( connection ) ) {
        
        case 0:
            break;
        
        case 1:
            connection.send({ cmd: 'error', message: 'Join request refused.', lobby: this.info() });
        case 2:
        default:
            return false;
        
    }
    
    if( this.connections.indexOf( connection ) != -1 ) {
        connection.send({ cmd: 'error', message: 'Already in lobby.', lobby: this.info() });
        return;
    }
    
    if( !connection.join( this ) ) {
        connection.send({ cmd: 'error', message: 'Cannot join multiple lobbies of this type.', lobby: this.info() });
        return false;
    }
    
    this.send({
        cmd: 'lobby.user.join',
        user: connection.info( null, this )
    });
    
    this.connections.push( connection );
    
    connection.send({
        cmd: 'lobby.join',
        lobby: this.info( true, connection )
    });
    
    return true;

};

/**
 * A connection has requested to leave the lobby. Remove them!
 *
 * @method part
 * @param connection {Object} Connection to leave the channel.
 */
Lobby.prototype.part = function( connection, reason ) {

    var i = this.connections.indexOf( connection );
    
    if( i == -1 ) {
        connection.send({ cmd: 'error', message: 'Not in lobby.', lobby: this.info() });
        return;
    }
    
    connection.part( this );
    
    try {
        connection.send({
            cmd: 'lobby.part',
            reason: reason,
            lobby: this.info(  )
        });
    } catch( err ) {
    
    }
    
    this.connections.splice( i, 1 );
    
    this.send({
        cmd: 'lobby.user.part',
        reason: reason,
        user: connection.info( null, this )
    });
    
    if( this.connections.length == 0 || this.host == connection ) {
    
        this.close( connection );
    
    }
    
    return true;

};

/**
 * Send a message to all connections in the lobby.
 * @method message
 * @param connection {Object} Connection the message originates from
 * @param message {String} Message to send
 */
Lobby.prototype.message = function( connection, message ) {

    this.send({
        cmd: 'lobby.message',
        lobby: this.info(),
        user: connection.info( null, this ),
        message: message
    });

};

module.exports = Lobby;