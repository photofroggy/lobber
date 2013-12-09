
var EventEmitter = require('events').EventEmitter;

/**
 * Handles protocol commands for lobber.
 * 
 * Anything not handled here is sent to an appropriate lobber.Lobby object
 * where possible.
 *
 * @class lobber.Protocol
 * @constructor
 * @param manager {Object} Instance of lobber.LobbyManager
 */
var Protocol = function( manager ) {

    this.manager = manager;
    this.events = new EventEmitter();

};

/**
 * Process a message received from a connection.
 * 
 * @method handle
 * @param connection {Object} lobber.Connection that received the message.
 * @param message {Object} The message received over WebSocket.
 * @param [lobby] {Object} Associated lobber.Lobby object, if any.
 */
Protocol.prototype.handle = function( connection, message, lobby ) {

    switch( message.cmd ) {
        
        case 'quit':
            connection.quit( message.reason || 'quit' );
            break;
            
        case 'lobby.list':
            var seq = this.manager.list( message.application );
            
            if( seq === false ) {
                connection.send({ cmd: 'error', message: 'No such application on the server' });
                break;
            }
            
            connection.send( { cmd: 'lobby.list', application: message.application, list: seq } );
            break;
        
        case 'lobby.open':
            var lobby = this.manager.createLobby( connection, message.application, message.tag, message['private'] );
            
            if( !lobby )
                break;
            
            for( var id in this.manager.server.connections ) {
            
                if( !this.manager.server.connections.hasOwnProperty( id ) )
                    continue;
                
                this.manager.server.connections[id].send( { cmd: 'lobby.new', lobby: lobby.info() } );
            
            }
            break;
            
        case 'lobby.close':
            var lobby = this.manager.get( message.application, message.id );
            
            if( !lobby ) {
                connection.send( { cmd: 'error', message: 'No such lobby', application: message.application } );
                return;
            }
            
            lobby.close( connection );
            break;
        
        case 'lobby.join':
            var lobby = this.manager.get( message.application, message.id );
            
            if( !lobby ) {
                connection.send( { cmd: 'error', message: 'No such lobby', application: message.application } );
                return;
            }
            
            lobby.join( connection );
            break;
        
        case 'lobby.part':
            var lobby = this.manager.get( message.application, message.id );
            
            if( !lobby ) {
                connection.send( { cmd: 'error', message: 'No such lobby', application: message.application } );
                return;
            }
            
            lobby.part( connection, message.reason || '' );
            break;
        
        case 'lobby.kick':
            var lobby = this.manager.get( message.application, message.id );
            
            if( !lobby ) {
                connection.send( { cmd: 'error', message: 'No such lobby', application: message.application } );
                return;
            }
            
            lobby.kick( connection, message.user, message.reason || '' );
            break;
        
        case 'lobby.message':
            var lobby = this.manager.get( message.application, message.id );
            
            if( !lobby ) {
                connection.send( { cmd: 'error', message: 'No such lobby', application: message.application } );
                return;
            }
            
            lobby.message( connection, message.message );
            break;
        
        case 'lobby.action':
            var lobby = this.manager.get( message.application, message.id );
            
            if( !lobby ) {
                connection.send( { cmd: 'error', message: 'No such lobby', application: message.application } );
                return;
            }
            
            lobby.action( connection, message.action );
            break;
        
        
    }

};



module.exports = Protocol;
