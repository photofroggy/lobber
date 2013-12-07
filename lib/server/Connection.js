
var Connection = function( manager, sock, id, user ) {

    this.manager = manager;
    this.conn = sock;
    this.id = id;
    this.user = user;
    this.lobby = null;
    this.inlobby = false;
    
    var conn = this;
    
    this.conn.on('message', function( message ) {
    
        conn.onmessage( JSON.parse( message.utf8Data ) );
    
    } );
    
    this.conn.on('close', function(reason, description) {
        conn.onclose( reason, description );
    });

};

Connection.prototype.onmessage = function( message ) {

    if( !this.inlobby ) {
    
        switch( message.cmd ) {
        
            case 'lobby.list':
                var seq = this.manager.list( message.lobby );
                
                if( seq === false ) {
                    this.send({ cmd: 'error', message: 'No such lobby on the server' });
                    break;
                }
                
                this.send( { cmd: 'lobby.list', lobby: message.lobby, list: seq } );
                break;
                
            case 'lobby.create':
                var lobby = this.manager.createLobby( message.lobby, this );
                
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
                break;
            
            case 'lobby.join':
                this.join( message.lobby, message.id );
                break;
            
            default:
                this.send({cmd: 'error', message: 'Unrecognised command or invalid state.'});
                break;
        
        }
    
    }

};

Connection.prototype.onclose = function( reason, description ) {

    console.log((new Date()) + '] cr >> ' + this.user.username + ' disconnected.');

};

Connection.prototype.send = function( data ) {

    this.conn.send( JSON.stringify( data ) );

};

Connection.prototype.join = function( type, id ) {

    if( this.inlobby ) {
        this.send({cmd: 'error', message: 'Already in a lobby.'});
        return;
    }
    
    var lobby = this.manager.get( type, id );
    
    if( lobby === false ) {
        this.send({cmd: 'error', message: 'No such lobby.'});
        return;
    }
    
    if( !lobby.join( this ) )
        return;
    
    this.inlobby = true;
    this.lobby = lobby;

};

Connection.prototype.newConnection = function( user ) {

    this.send({
        cmd: 'lobby.user.join',
        user: {
            id: user.id,
            username: user.user.username
        }
    });

};

module.exports = Connection;