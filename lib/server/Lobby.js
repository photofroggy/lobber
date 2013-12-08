
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
 * @param [private=false] {Boolean} Determine whether public access is granted
 *                                  or not.
 */
var Lobby = function( host, id, plob ) {

    this.id = id || uuid.v1();
    this.name = 'lobby';
    this.host = host;
    this.isPrivate = plob || false;
    this.connections = [];
    this.connections.push( host );

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

Lobby.prototype.join = function( connection ) {

    switch( this.joinRequest( connection ) ) {
        
        case 0:
            break;
        
        case 1:
            connection.send({ cmd: 'error', message: 'Lobby full.' });
        case 2:
        default:
            return false;
        
    }
    
    var lobby = {
        name: this.name,
        id: this.id,
        host: {
            id: this.host.id,
            username: this.host.user.username
        },
        connections: []
    }
    
    var conn = null;
    
    for( var i = 0; i <= this.connections.length; i++ ) {
    
        if( !this.connections.hasOwnProperty( i ) )
            continue;
        
        conn = this.connections[i];
        conn.newConnection( connection );
        
        lobby.connections.push( conn.info( connection ) );
    
    }
    
    this.connections.push( connection );
    
    connection.send({
        cmd: 'lobby.join',
        lobby: lobby
    });
    
    return true;

};

module.exports = Lobby;