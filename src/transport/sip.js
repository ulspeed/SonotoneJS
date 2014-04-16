/**
 * SIPTransport over WebSocket Namespace.
 *
 * @namespace
 */

var SIPTransport = Sonotone.IO.SIPTransport = function() {

    this._softPhone = null;
    this._transportReady = false;
    this._call = null;

    this._callbacks = new Sonotone.IO.Events();

    this._peer = null;
};

/**
 * SIPTransport interface.
 *
 */

SIPTransport.prototype = {

    type: function() {
        return "sip";
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
     * Connect the Transport
     *
     * @api public
     */

    connect: function(params) {
        var that = this;

        this._softPhone = new JsSIP.UA(params);

        this._softPhone.on('registered', function() {
            Sonotone.log("TRANSPORT", "Registered to SIP Server thru WebSocket Gateway", params.ws_servers);
            that._transportReady = true;
            that._callbacks.trigger('onReady', {msg: 'registered'});
        });

        this._softPhone.on('unregistered', function() {
           that._callbacks.trigger('onClose', {msg: 'unregistered'}); 
        });

        this._softPhone.on('registrationFailed', function() {
            that._callbacks.trigger('onError', {err: 'registration-failed'});
        });

        this._softPhone.on('connected', function() {
            //that._callbacks.trigger('onConnected', null);
        });

        this._softPhone.on('disconnected', function() {
            //that._callbacks.trigger('onDisconnected', null);
        });

        this._softPhone.on('newRTCSession', function(e){
            that._call = e.data.session;
            Sonotone.log("TRANSPORT", "Get the call session", that._call);
        });

        Sonotone.log("TRANSPORT", "Try to register to SIP Server with user", params.uri);
        this._softPhone.start();

        
        // this._softPhone.call('7040', {
        //     'extraHeaders': [ 'X-Foo: foo', 'X-Bar: bar'],
        //     'RTCConstraints': {"optional" : [{'DtlsSrtpKeyAgreement': true}]},
        //     'mediaConstraints': {'audio': true, 'video': false}
        // });
    },

    send: function(JSONMessage) {
        console.log("SEND SIP", JSONMessage);

        console.log("PEER", this._peer);

        if(JSONMessage.data.type === 'offer') {
            this._softPhone.call(JSONMessage.callee, {
                'extraHeaders': [ 'X-Foo: foo', 'X-Bar: bar'],
                'RTCConstraints': {"optional" : [{'DtlsSrtpKeyAgreement': true}]},
                'mediaConstraints': {'audio': true, 'video': false}
            }, JSONMessage.data.sdp, this._peer);
        }

    },

    setPeer: function(peer) {
        this._peer = peer;
    }

};