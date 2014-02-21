/**
 * WebSocketTransport namespace.
 *
 * @namespace
 */

var WebSocketTransport = Sonotone.IO.WebSocketTransport = function(config, caps) {
    this._host = config.host;
    this._port = config.port;
    this._transportReady = false;
    this._socket = null;
    this._callbacks = new Sonotone.IO.Events();
    this._id = new Date().getTime();
    this._room = null;
    this._caps = caps;

    if(this._port) {
        Sonotone.log("TRANSPORT", "Creating a WebSocket transport to " + this._host + ":" + this._port);
    }
    else {
        Sonotone.log("TRANSPORT", "Creating a WebSocket transport to " + this._host);
    }
};

/**
 * WebSocketTransport interface.
 *
 */

WebSocketTransport.prototype = {

    /**
     * Connect the Transport
     * @param {Object} data The user capabilities that have to be transmitted to others peers (nickname, audio/video capabilities...)
     * @param {String} code, The conference code (room)
     *
     * @api public
     */

    connect: function(data, code) {
        if(!this._socket) {
            Sonotone.log("TRANSPORT", "Try to connect to SIG server");
            
            if(this._port) {
                this._socket = new WebSocket("ws://" + this._host + ":" + this._port);
            }
            else {
                this._socket = new WebSocket("ws://" + this._host);
            }

            this._room = code;

            var that = this;

            this._socket.onopen = function(msg) {
                Sonotone.log("TRANSPORT", "Channel Ready");
                that._transportReady = true;
                that._callbacks.trigger('onReady', msg);

                that.send(
                    {
                        data: {
                            type: 'join',
                            data: data,
                            caps: that._caps
                        },
                        caller: Sonotone.ID, 
                        callee: 'all',
                    }
                );
            };

            this._socket.onmessage = function(msg) {

                var message = JSON.parse(msg.data);

                if(message.data.type !== undefined) {
                    Sonotone.log("TRANSPORT", "Receive a message of type " + message.data.type, message);
                    that._callbacks.trigger('onMessage', message);

                }
                else {
                    Sonotone.log("TRANSPORT", "Unknown message. Do not treat", message);
                }
            };

            this._socket.onclose = function() {
                Sonotone.log("TRANSPORT", "Channel Closed");
                that._transportReady = false;
            };

            this._socket.onerror = function(err) {
                Sonotone.log("TRANSPORT", "Receive an error message", err);
                that._callbacks.trigger('onError', err);
            };
        }
    },

    /**
     * Send a message using the Transport
     *
     * @api public
     */

    send: function(JSONMessage) {
        if(this._transportReady) {
            if(this._room) {
                JSONMessage.room = this._room;    
            }
            var message = JSON.stringify(JSONMessage);
            Sonotone.log("TRANSPORT", "Send a Message", JSONMessage);
            this._socket.send(message);
        }
        else {
             Sonotone.log("TRANSPORT", "Not ready!!!", JSONMessage);
        }
    },

    /**
     * Subscribe to Transport events
     * @param {String} eventName The event to subscribe
     * @param {Function} callbackFunction The function to call
     * @param {Object} context The context to use when calling the callback function
     *
     * @api public
     */

    on: function(eventName, callbackFunction, context) {
        this._callbacks.on(eventName, callbackFunction, context);
    },

    /**
     * Unsubscribe to IO events
     * @param {String} eventName The event to unsubscribe
     * @param {Function} callbackFunction The registered callback
     *
     * @api public
     */    

    off: function(eventName, callbackFunction) {
        this._callbacks.off(eventName, callbackFunction);
    },

};