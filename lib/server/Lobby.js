
var Lobby = function( host, id ) {

    this.id = id || uuid.v1();
    this.name = 'somelobby';
    this.host = host;
    this.connections = [];
    this.connections.push( host );

};

Lobby.prototype.join = function( connection ) {

    if( this.connections.length == this.limit ) {
        connection.send({ cmd: 'error', message: 'Lobby full.' });
        return false;
    }
    
    var lobby = {
        name: this.name,
        id: this.id,
        host: {
            id: this.host.id,
            connectionname: this.host.account.connectionname
        },
        connections: []
    }
    
    var connection = null;
    
    for( var i = 0; i <= this.connections.length; i++ ) {
    
        if( !this.connections.hasOwnProperty( i ) )
            continue;
        
        connection = this.connections[i];
        connection.newPlayer( connection );
        
        lobby.connections.push({
            id: connection.id,
            connectionname: connection.account.connectionname
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