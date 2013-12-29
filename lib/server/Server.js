
var EventEmitter = require('events').EventEmitter;

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
var Server = function( config ) {

    this.serv = {};
    this.connections = {};
    this.connection = {};
    
    config.connection = config.connection || {};
    
    var Connection = require('lobber').Connection;
    
    this.connection.default = config.connection.default || Connection;
    this.connection.websocket = config.connection.websocket || Connection.WebSocket;
    //this.connection.socketio = config.connection.socketio || Connection.SocketIO;
    this.connection.socket = config.connection.socket || Connection.Socket;
    
    this.manager = new (config.manager || require('lobber').LobbyManager)( this );
    this.events = new EventEmitter();
    
    if( !config.hasOwnProperty( 'server' ) ) {
        throw new Server.Error.NoServersGiven( config );
        return;
    }
    
    if( config.server.length == 0 ) ) {
        throw new Server.Error.NoServersGiven( config );
        return;
    }
    
    this.config_servers( config.server );
    this.hook();

};

/**
 * Shorthand for emitting events.
 * 
 * @method emit
 * @param event {String} Name of the event
 * @param data {Object} Event data
 * @param connection {Object} Connection the event originates from
 */
Server.prototype.emit = function( event, data, connection ) {

    this.events.emit( event, data, connection, this );

};

/**
 * Shorthand for adding event listeners.
 *
 * @method on
 * @param event {String} Name of the event to listen for
 * @param method {Function} Method to call for each event
 */
Server.prototype.on = function( event, method ) {

    this.events.on( event, method );

};

/**
 * Set up server stuff yay.
 * 
 * @method config_servers
 * @param servers {Array} Config data for servers.
 */
Server.prototype.config_servers = function( servers ) {

    var nserv = 0;
    var port = 8080;
    
    if( servers.hasOwnProperty( 'websocket' ) ) {
        
        try {
        
            var wsserver = require('websocket').server;
            var http = require('http');
            port = servers.websocket;
            
            var server = http.createServer( function(request, response) {
                response.writeHead(404);
                response.end();
            } );
            
            server.listen( port, function() {
                console.log((new Date()) + '] lobber websocket server listening on port 8044');
            } );
    
            this.serv.websocket = new wsserver({
                httpServer: server,
                autoAcceptConnections: false
            });
            
            nserv++;
        
        } catch( err ) {}
        
    }
    
    if( servers.hasOwnProperty( 'socketio' ) ) {
        
        try {
        
            /*
            var wsserver = require('socketio').server;
            var http = require('http');
            port = servers.socketio;
            
            var server = http.createServer( function(request, response) {
                response.writeHead(404);
                response.end();
            } );
            
            server.listen( port, function() {
                console.log((new Date()) + '] lobber websocket server listening on port 8044');
            } );
    
            this.serv.websocket = new wsserver({
                httpServer: server,
                autoAcceptConnections: false
            });
            
            nserv++;/**/
        
        } catch( err ) {}
    }
    }
    
    if( servers.hasOwnProperty( 'socket' ) ) {
        
        try {
        
            var net = require('net');
            port = servers.socket;
            
            var server = net.createServer(  );
            
            server.listen( port, function() {
                console.log((new Date()) + '] lobber socket server listening on port', port);
            } );
            
    
            this.serv.socket = server;
            
            nserv++;
        
        } catch( err ) {}
    }
    
    console.log('>> nserv', nserv);
    
    if( nserv == 0 ) {
        throw new Server.Error.NoServersGiven( servers );
        return;
    }

};

/**
 * Hook request methods.
 * @method hook
 */
Server.prototype.hook = function(  ) {

    var s = this;
    
    if( this.serv.hasOwnProperty( 'websocket' ) ) {
        
        this.serv.websocket.on( 'request', function( request, response ) {
            s.request( request, response );
        } );
    
    }
    
    if( this.serv.hasOwnProperty( 'socketio' ) ) {
        
        
    
    }
    
    if( this.serv.hasOwnProperty( 'socket' ) ) {
        
        this.serv.socket.on( 'connection', function( socket ) {
            var conn = new this.connection.socket( this.manager, socket );
            this.connections[conn.id] = conn;
            this.onconnect( conn );
        } );
    
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
    
    this.onrequest( request, response, function( accept ) {
        return s.answerRequest( request, response, accept );
    });

};

/**
 * Applications using the server object should overwrite this method.
 * 
 * By default, this method always accepts connections.
 * 
 * @method onrequest
 * @param request {Object} WebSocket request object.
 * @param response {Object} WebSocket response object.
 * @param done {Function} Method to call when we are done handling. The function
 *                        accepts a boolean. Pass true to accept the
 *                        connection, and false to refuse the connection.
 */
Server.prototype.onrequest = function( request, response, done ) {

    done( true );

};

/**
 * Applications using the server object should overwrite this method.
 * 
 * Called when a new connection is accepted.
 * 
 * @method onconnect
 * @param connection {Object} An instance of Lobber.Connection representing the connection
 */
Server.prototype.onconnect = function( connection ) {};

/**
 * Respond to a request.
 * @method answerRequest
 * @param request {Object} WebSocket request object.
 * @param response {Object} WebSocket response object.
 * @param accept {Boolean} Accept or reject the request.
 * @param user {Object} An object representing the user. Should contain an
 *                      attribute `username`.
 */
Server.prototype.answerRequest = function( request, response, accept ) {

    if( !accept ) {
        request.reject();
        return null;
    }
    
    var conn = new this.connection.websocket( this.manager, request.accept('lobber', request.origin) );
    this.connections[conn.id] = conn;
    this.onconnect( conn );
    
    return conn;

};

/**
 * A connection is quitting.
 * @method quit
 * @param connection {Object} Connection leaving the server.
 */
Server.prototype.quit = function( connection ) {

    if( !this.connections.hasOwnProperty( connection.id ) )
        return false;
    
    delete this.connections[connection.id];
    return true;

};

// Server type. Wooo.
Server.Type = {};
Server.Type.UNKNOWN = -1;
Server.Type.WEBSOCKET = 0;
Server.Type.SOCKETIO = 1;
Server.Type.SOCKET = 2;

// Server error.
Server.Error = {};
Server.Error.UnknownServer = function( config ) {

    this.name = 'Unknown Server';
    this.message = this.description = 'Received an unknown server type or no server';
    this.servers = Server.Type;
    this.config = config;

};
Server.Error.NoServersGiven = function( config ) {

    this.name = 'No Servers Given';
    this.message = this.description = 'No servers were provided for the serving of services';
    this.config = config;

};


module.exports = Server;
