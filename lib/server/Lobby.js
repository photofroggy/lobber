
var uuid = require('node-uuid');

var Lobby = function( host, id ) {

    this.id = id || uuid.v1();
    this.name = 'somelobby';
    this.host = host;
    this.connections = [];
    this.connections.push( host );

};

Lobby.prototype.join = function( connection ) {
/*
    if( this.connections.length == this.limit ) {
        connection.send({ cmd: 'error', message: 'Lobby full.' });
        return false;
    }
  */  
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
        
        lobby.connections.push({
            id: conn.id,
            username: conn.user.username
        });
    
    }
    
    this.connections.push( connection );
    
    connection.send({
        cmd: 'lobby.join',
        lobby: lobby
    });
    
    return true;

};

module.exports = Lobby;