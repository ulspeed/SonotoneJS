/**
 * SIPTransport over WebSocket Namespace.
 *
 * @namespace
 */

var SIPTransport = Sonotone.IO.SIPTransport = function(config) {

    console.log("config:", config);
    this._socket = null;
    this._callbacks = new Sonotone.IO.Events();
};

/**
 * SIPTransport interface.
 *
 */

SIPTransport.prototype = {

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

    connect: function() {
        if(!this._socket) {
            Sonotone.log("TRANSPORT", "Try to connect to SIG server");
            
            this._socket = new WebSocket("ws://172.26.161.86:11112");

            this._socket.onopen = function() {
                Sonotone.log("TRANSPORT", "Channel Ready");
            };

            this._socket.onmessage = function() {
                console.log("toto");
                //Sonotone.log("TRANSPORT", "received", msg);
            };

            this._socket.onclose = function() {
                Sonotone.log("TRANSPORT", "Channel Closed");
            };

            this._socket.onerror = function(err) {
                Sonotone.log("TRANSPORT", "Receive an error message", err);
            };
        }
    },

    invite: function() {

        console.log('invite');

        var msg = 'REGISTER sip:172.26.161.86 SIP/2.0\r\n' + 
            'Via: SIP/2.0/WS 0favl06pnehr.invalid;branch=z9hG4bK6362795\r\n' + 
            'Max-Forwards: 69\r\n' + 
            'To: <sip:1000@172.26.161.86>\n' + 
            'From: "1000" <sip:1000@172.26.161.86>;tag=8pm5mjc9r6\r\n' + 
            'Call-ID: 9m066q4onv48liqouhdo94\r\n' + 
            'CSeq: 81 REGISTER\r\n' + 
            'Contact: <sip:b5ukfko1@0favl06pnehr.invalid;transport=ws>;reg-id=1;+sip.instance="<urn:uuid:a2223471-94ca-4436-b16a-fd78828a2961>";expires=600\r\n' + 
            'Allow: ACK,CANCEL,BYE,OPTIONS\r\n' + 
            'Supported: path, outbound, gruu\r\n' + 
            'User-Agent: JsSIP 0.3.0\r\n' + 
            'Content-Length: 0\r\n\r\n';

        this._socket.send(msg);
    }


};