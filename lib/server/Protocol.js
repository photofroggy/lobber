
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
 */
Protocol.prototype.handle = function( connection, message ) {

    var lobby = this.manager.get( message.application, message.id );
    
    switch( message.cmd ) {
        
        case 'login':
            connection.onlogin( message );
            return;
               
        case 'quit':
            connection.quit( message.reason || 'quit' );
            return;
        
    }
    
    if( !connection.user.loggedIn ) {
        connection.send( { cmd: 'login.error', error: 0, message: 'need to be logged in to access these commands', original: message } );
        return;
    }
    
    switch( message.cmd ) {
        
        case 'application.list':
            connection.send( { cmd: 'application.list', list: this.manager.applicationList() } );
            break;
        
        case 'lobby.list':
            var seq = this.manager.list( message.application );
            
            if( seq === false ) {
                connection.send({ cmd: 'lobby.list.error', message: 'No such application on the server' });
                break;
            }
            
            connection.send( { cmd: 'lobby.list', application: message.application, list: seq } );
            break;
        
        case 'lobby.open':
            var lobby = this.manager.createLobby( connection, message.application, message.id, message['private'] );
            
            if( !lobby )
                break;
            
            for( var id in this.manager.server.connections ) {
            
                if( !this.manager.server.connections.hasOwnProperty( id ) )
                    continue;
                
                this.manager.server.connections[id].send( { cmd: 'lobby.new', lobby: lobby.info() } );
            
            }
            break;
            
        case 'lobby.close':
            if( !lobby ) {
                connection.send( { cmd: 'lobby.close.error', message: 'No such lobby', application: message.application } );
                return;
            }
            
            lobby.close( connection );
            break;
        
        case 'lobby.join':
            if( !lobby ) {
                connection.send( { cmd: 'lobby.join.error', message: 'No such lobby', application: message.application } );
                return;
            }
            
            lobby.join( connection );
            break;
        
        case 'lobby.part':
            if( !lobby ) {
                connection.send( { cmd: 'lobby.part.error', message: 'No such lobby', application: message.application } );
                return;
            }
            
            lobby.part( connection, message.reason || '' );
            break;
        
        case 'lobby.kick':
            if( !lobby ) {
                connection.send( { cmd: 'lobby.kick.error', message: 'No such lobby', application: message.application } );
                return;
            }
            
            lobby.kick( connection, message.user, message.reason || '' );
            break;
        
        case 'lobby.message':
            if( !lobby ) {
                connection.send( { cmd: 'lobby.message.error', message: 'No such lobby', application: message.application } );
                return;
            }
            
            lobby.message( connection, message.message );
            break;
        
        case 'lobby.action':
            if( !lobby ) {
                connection.send( { cmd: 'lobby.action.error', message: 'No such lobby', application: message.application } );
                return;
            }
            
            lobby.action( connection, message.message );
            break;
        
        default:
            if( !lobby ) {
                connection.send( { cmd: 'error', message: 'Unknown command sent to unknown lobby', application: message.application } );
                return;
            }
            
            lobby.emit( message.cmd, message, connection );
            break;
        
        
    }

};



module.exports = Protocol;
