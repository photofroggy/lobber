

/**
 * The server object handles incoming requests and such.
 *
 * @class lobber.Server
 * @constructor
 * @param config {Object} Configuration stuff. Provide some sort of websocket
 *                        server here.
 * @param [connection=lobber.Connection] {Function} Object to use for connections. 
 * @param [connection=lobber.LobbyManager] {Function} Object to use for
 *                                                    managing lobbies.
 */
var Server = function( config, connection, manager ) {

    this.type = Server.Type.UNKNOWN;
    this.serv = null;
    this.connections = {};
    this.connection = connection || require('lobber').Connection;
    this.manager = new (manager || require('lobber').LobbyManager)( this );
    
    if( config.hasOwnProperty( 'websocket' ) ) {
        this.type = Server.Type.WEBSOCKET;
        this.serv = config.websocket;
    } else if( config.hasOwnProperty( 'socketio' ) ) {
        this.type = Server.Type.SOCKETIO;
        this.serv = config.socketio;
    } else {
        throw new Server.Error.UnknownServer( config );
    }
    
    this.hook();

};

/**
 * Hook request methods.
 * @method hook
 */
Server.prototype.hook = function(  ) {

    var s = this;
    
    switch( this.type ) {
    
        case Server.Type.WEBSOCKET:
            this.serv.on( 'request', function( request, response ) { s.request( request, response ); } );
            break;
        
        case Server.Type.SOCKETIO:
        default:
            break;
    
    }

};

/**
 * Handle incoming request.
 *
 * @method request
 * @param request {Object} WebSocket request object.
 * @param response {Object} WebSocket response object.
 */
Server.prototype.request = function( request, response ) {

    request.cookieJar = {};
    
    request.cookies.forEach(function(cookie){
    
        request.cookieJar[cookie.name] = JSON.parse( cookie.value.substr( 2 ) );
    
    });
    
    var s = this;
    
    this.onrequest( request, response, function( accept, user ) {
        return s.answerRequest( request, response, accept, user );
    });

};

/**
 * Applications using the server object should overwrite this method.
 * 
 * By default, this method always refuses connections.
 * 
 * @method onrequest
 * @param request {Object} WebSocket request object.
 * @param response {Object} WebSocket response object.
 * @param done {Function} Method to call when we are done handling. The function
 *                        accepts a boolean. Pass true to accept the
 *                        connection, and false to refuse the connection.
 */
Server.prototype.onrequest = function( request, response, done ) {

    done( false );

};

/**
 * Respond to a request.
 * @method answerRequest
 * @param request {Object} WebSocket request object.
 * @param response {Object} WebSocket response object.
 * @param accept {Boolean} Accept or reject the request.
 * @param user {Object} An object representing the user. Should contain an
 *                      attribute `username`.
 */
Server.prototype.answerRequest = function( request, response, accept, user ) {

    if( !accept ) {
        request.reject();
        return null;
    }
    
    var conn = new this.connection( this.manager, request.accept('matchmaking', request.origin), false, user );
    this.connection[conn.id] = conn;
    
    return conn;

};

// Server type. Wooo.
Server.Type.UNKNOWN = -1;
Server.Type.WEBSOCKET = 0;
Server.Type.SOCKETIO = 1;

// Server error.
Server.Error = {};
Server.Error.UnknownServer = function( config ) {

    this.name = 'Unknown Server';
    this.message = this.description = 'Received an unknown websocket server type or no websocket server';
    this.config = config;

};


module.exports = Server;
