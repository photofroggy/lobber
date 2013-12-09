
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
 * Get a list of applications currently registered with the manager.
 * @method applicationList
 */
LobbyManager.prototype.applicationList = function(  ) {

    var seq = [];
    
    for( var application in this.lobbys ) {
    
        if( !this.lobbys.hasOwnProperty( application ) )
            continue;
        
        seq.push( application );
    
    }
    
    return seq;

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
LobbyManager.prototype.createLobby = function( connection, application, name, plob ) {

    if( !this.lobbys.hasOwnProperty( application ) )
        return false;
    
    if( this.lobbys[application].open.hasOwnProperty( name ) ) {
    
        connection.send({ cmd: 'lobby.open.error', message: 'lobby already exists', id: name, application: application });
        return false;
    
    }
    
    var lobby = new this.lobbys[application].manager( this, connection, name, plob );
    var hosted = connection.join( lobby );
    
    if( !hosted )
        return false;
    
    this.lobbys[application].open[lobby.id] = lobby;
    connection.send( { cmd: 'lobby.join', lobby: lobby.info( true, connection ) } );
    return lobby;

};

/**
 * Close a lobby!
 * @method close
 * @param lobby {Object} Lobby to close.
 */
LobbyManager.prototype.close = function( lobby ) {

    if( !this.lobbys.hasOwnProperty( lobby.name ) )
        return;
    
    if( !this.lobbys[lobby.name].open.hasOwnProperty( lobby.id ) )
        return;
    
    delete this.lobbys[lobby.name].open[lobby.id];

};

/**
 * Return a list of all the open lobbies.
 * @method list
 * @param lobby {String} The type of lobby to list.
 */
LobbyManager.prototype.list = function( lobby ) {

    var seq = [];
    
    if( !this.lobbys.hasOwnProperty( lobby ) )
        return false;
    
    for( var id in this.lobbys[lobby].open ) {
        
        if( !this.lobbys[lobby].open.hasOwnProperty( id ) )
            continue;
        
        if( this.lobbys[lobby].open[id].isPrivate )
            continue;
        
        seq.push({
            id: id,
            application: this.lobbys[lobby].open[id].name,
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