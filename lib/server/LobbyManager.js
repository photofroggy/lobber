
/**
 * Manages lobbies for different applications.
 * @class lobber.LobbyManager
 * @constructor
 */
var LobbyManager = function( server ) {

    this.lobbys = {};
    this.server = server;
    this.protocol = new (require('lobber').Protocol)( this );

};

/**
 * Register an application with the manager.
 * 
 * @method registerApplication
 * @param name {String} Name of the application.
 * @param lobby {Object} lobber.Lobby class to use for application lobbies.
 */
LobbyManager.prototype.registerApplication = function( name, lobby ) {

    this.lobbys[name] = {
    
        manager: lobby,
        open: {}
    
    };

};

/**
 * Create a lobby for an application.
 * 
 * @method createLobby
 * @param connection {Object} lobber.Connection object representing the lobby's
 *                            host connection/user.
 * @param tag {String} Plain text representation of the lobby to use in
 *                     listings.
 * @param private {Boolean} Determines if the lobby is private or not.
 */
LobbyManager.prototype.createLobby = function( connection, name, tag, plob ) {

    if( !this.lobbys.hasOwnProperty( name ) )
        return false;
    
    var lobby = new this.lobbys[name].manager( connection, false, tag, plob );
    var hosted = connection.join( lobby );
    
    if( !hosted )
        return;
    
    this.lobbys[name].open[lobby.id] = lobby;
    connection.send( { cmd: 'lobby.new', lobby: lobby.info(  ) } );

};

LobbyManager.prototype.list = function( lobby ) {

    var seq = [];
    
    if( !this.lobbys.hasOwnProperty( lobby ) )
        return false;
    
    for( var id in this.lobbys[lobby].open ) {
        
        if( !this.lobbys[lobby].open.hasOwnProperty( id ) )
            continue;
        
        seq.push({
            id: id,
            host: this.lobbys[lobby].open[id].host.user.username,
            connections: this.lobbys[lobby].open[id].connections.length
        });
    
    }
    
    return seq;

};

LobbyManager.prototype.get = function( lobby, id ) {
    
    if( !this.lobbys.hasOwnProperty( lobby ) )
        return false;
    
    if( !this.lobbys[lobby].open.hasOwnProperty( id ) )
        return false;
    
    return this.lobbys[lobby].open[id];

};

module.exports = LobbyManager;