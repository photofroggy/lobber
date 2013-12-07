
var LobbyManager = function() {

    this.lobbys = {};

};

LobbyManager.prototype.registerLobby = function( name, lobby ) {

    this.lobbys[name] = {
    
        manager: lobby,
        open: {}
    
    };

};

LobbyManager.prototype.createLobby = function( name, connection ) {

    if( !this.lobbys.hasOwnProperty( name ) )
        return false;
    
    var lobby = new this.lobbys[name].manager( connection );
    this.lobbys[name].open[lobby.id] = lobby;
    return lobby;

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

LobbyManager.prototype.join = function( lobby, id, connection ) {

    if( !this.lobbys.hasOwnProperty( lobby ) );

};

module.exports = LobbyManager;