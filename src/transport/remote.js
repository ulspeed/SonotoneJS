/**
 * RemoteTransport namespace
 * Use a Remote Transport when you have your own transport defined and you want to use it
 *
 * @namespace
 */

var RemoteTransport = Sonotone.IO.RemoteTransport = function(config) {
    this._transportReady = true;
    this._callbacks = new Sonotone.IO.Events();
    this._sendCallbackFn = config.sendCallback;
    this._context = config.context;

    Sonotone.log("TRANSPORT", "Creating a Remote transport");
};

/**
 * RemoteTransport interface.
 *
 */

RemoteTransport.prototype = {


    type: function() {
        return "remote";
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

    /**
     * Connect using the Custom transport
     *
     * @api public
     */

    connect: function() {
        this._transportReady = true;
        this._callbacks.trigger('onReady', {});
    },

    /**
     * Send a message using the Custom Transport
     * This function calls the 'sendCallback' function
     * @param {Object} JSONMessage  The message in JSON format
     *
     * @api public
     */

    send: function(JSONMessage) {
        if(this._transportReady) {
            Sonotone.log("TRANSPORT", "Send Message", JSONMessage);
            if(this._sendCallbackFn) {
                this._sendCallbackFn.call(this._context || this, JSONMessage);
            }
            else {
                Sonotone.log("TRANSPORT", "Transport not configured");
                this._callbacks.trigger('onError', "NOT_CONFIGURED");
            }
        }
        else {
            Sonotone.log("TRANSPORT", "Transport not ready");
            this._callbacks.trigger('onError', "NOT_READY");
        }
    },

    /**
     * Receive a message from your own transport and push it to the Remote Transport
     * Parameters will be injected in Sonotone.IO as if they come from a transport managed by Sonotone 
     *
     * @param {Object} JSONMessage
     */

    receive: function(JSONMessage) {
        if(JSONMessage.data.type !== undefined) {
            Sonotone.log("TRANSPORT", "Receive a message of type " + JSONMessage.data.type);
            this._callbacks.trigger('onMessage', JSONMessage);

        }
        else {
            Sonotone.log("TRANSPORT", "Unknown message. Do not treat" + JSON.stringify(JSONMessage));
        }
    }
};