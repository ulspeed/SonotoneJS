/**
 * Remote Media namespace.
 * We can have several remote media for the moment one per peerconnection
 *
 * @namespace
 */

var RemoteMedia = Sonotone.IO.RemoteMedia = function(adapter) {
    Sonotone.log("REMOTEMEDIA", "RemoteMedia initialized");

    this._callbacks = new Sonotone.IO.Events();
    this._stream = {};
    this._mediaReady = false;
    this._adapter = adapter;
};

/**
 * RemoteMedia interface.
 *
 */

RemoteMedia.prototype = {
    
    /**
     * Get or set the remote Stream
     *
     * @api public
     */

    stream: function(stream, peerID) {
        if(stream !== null) {
            if(this._stream[peerID] !== null) {
                Sonotone.log("REMOTEMEDIA", "Stream already exists. Add again to the Remote Media for peer <" + peerID + ">");
            }
            else {
                Sonotone.log("REMOTEMEDIA", "Set the stream associated to this Remote Media for peer <" + peerID + ">");
            }
            this._stream[peerID] = stream;
            this._subscribeToStreamEvent(stream, peerID); 
            this._callbacks.trigger('onRemoteStreamStarted', peerID);
        }

        return this._stream;
    },

    /**
     * Subscribe to Local Media events
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
     * Attach the RemoteStream to a <video> or <canvas> element
     *
     * @api public
     */

    renderStream: function(HTMLMediaElement, peerID) {
        Sonotone.log("REMOTEMEDIA", "Render the remote stream associated to peer <" + peerID + ">"); 
        this._adapter.attachToMedia(HTMLMediaElement, this._stream[peerID]);
    },

    /**
     * Subscribe to Stream events
     *
     * @api private
     */

    _subscribeToStreamEvent: function(stream, peerID) {

        var that = this;

        stream.onended = function() {
            Sonotone.log("REMOTEMEDIA", "Remote Stream has ended"); 
            //TODO
            //Perahps we have to remove the MediaTrack that ended
            that._callbacks.trigger('onRemoteStreamEnded', peerID);
        };

        stream.onaddtrack = function() {
            Sonotone.log("REMOTEMEDIA", "New track added to RemoteStream"); 
        };

        stream.onremovetrack = function() {
            Sonotone.log("REMOTEMEDIA", "Track removed from RemoteStream"); 
        };
    }
};