/**
 *
 */

var SocketIOTransport = Sonotone.IO.SocketIOTransport = function(config) {
    this._host = config.host;
    this._port = config.port;
    this._transportReady = false;
    this._io = config.io;
    this._socket = null;
    this._callbacks = new Sonotone.IO.Events();
    this._id = new Date().getTime();
    this._dataChannel = null;

    Sonotone.log("TRANSPORT", "Creating a SocketIO transport to " + this._host + ":" + this._port);
};
 
SocketIOTransport.prototype = {
    
    /**
     * Connect the Transport
     *
     * @api public
     */

    connect: function() {
        if(!this._socket) {
            Sonotone.log("TRANSPORT", "Try to connect to SIG server");
            
            this._socket = this._io.connect('http://localhost:8080');

            var that = this;

           // this._socket.onopen = function(msg) {
            this._socket.on('connect', function(msg) {
                Sonotone.log("TRANSPORT", "Channel Ready");
                that._transportReady = true;
                that._callbacks.trigger('onReady', msg);

                that.send(
                    {
                        data: {
                            type: 'join'
                        },
                        caller: Sonotone.ID, 
                        callee: 'all'
                    }
                );
            });

            this._socket.on('message', function(msg) {

                var message = JSON.parse(msg.data);

                if(message.data.type !== undefined) {
                    Sonotone.log("TRANSPORT", "Receive a message of type " + message.data.type, message);
                    that._callbacks.trigger('onMessage', message);

                }
                else {
                    Sonotone.log("TRANSPORT", "Unknown message. Do not treat" + JSON.stringify(message));
                }
            });

            this._socket.on('close', function() {
                Sonotone.log("TRANSPORT", "Channel Closed");
                that._transportReady = false;
            });

            this._socket.on('error', function(err) {
                Sonotone.log("TRANSPORT", "Receive an error message" + JSON.stringify(err));
                that._callbacks.trigger('onError', err);
            });
        }
    },


    /**
     * Send a message using the Transport
     *
     * @api public
     */

    send: function(JSONMessage) {
        if(this._transportReady) {

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
    }
};