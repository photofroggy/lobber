
module.exports = {
    Manager: function( app ) {
    
        var Lobby = require('lobber').Lobby;
        
        /**
         * Custom lobby example.
         * 
         * Allows simple chatrooms.
         */
        var ChatLobby = function( manager, host, id, tag, plob ) {
            Lobby.call( this, manager, host, id, tag, plob );
            this.polygamus = true;
            this.name = app || 'chat';
        };
        
        ChatLobby.prototype = new Lobby;
        ChatLobby.prototype.constructor = ChatLobby;
        
        return ChatLobby;
    
    }
};

