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
     * @param {Object} stream The remote Stream
     * @param {String} peerID The PeerConnection on which the remote Stream is attached
     * @param {String} mediaType The Media (video or screen)
     * @api public
     */

    stream: function(stream, peerID, mediaType) {
        if(stream !== null) {
            if(this._stream[peerID] !== null) {
                Sonotone.log("REMOTEMEDIA", "Stream already exists. Add again to the Remote Media for peer <" + peerID + ">");
            }
            else {
                Sonotone.log("REMOTEMEDIA", "Set the stream associated to this Remote Media for peer <" + peerID + ">");
            }
            this._stream[peerID] = stream;

            //Get the userID (= peerID without the media)
            var id = peerID.substring(1);

            this._subscribeToStreamEvent(stream, id, mediaType);

            this._callbacks.trigger('onRemoteStreamStarted', {id: id, media: mediaType, stream: stream});
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

    renderStream: function(HTMLMediaElement, id, media) {
        
        var flag = media.substring(0,1),
        peerID = flag + id;

        if(media === "video") {
            Sonotone.log("REMOTEMEDIA", "Render the video stream associated to peer <" + peerID + ">"); 
        }
        else {
            Sonotone.log("REMOTEMEDIA", "Render the screen stream associated to peer <" + peerID + ">"); 
        }
        this._adapter.attachToMedia(HTMLMediaElement, this._stream[peerID]);
    },

    /**
     * Subscribe to Stream events
     *
     * @api private
     */

    _subscribeToStreamEvent: function(stream, id, media) {

        var that = this;

        stream.onended = function() {
            Sonotone.log("REMOTEMEDIA", "Remote Stream has ended"); 
            //TODO
            //Perahps we have to remove the MediaTrack that ended
            that._callbacks.trigger('onRemoteStreamEnded', {id: id, media: media});

            // Free memory
            var peerID = media.substring(0,1) + id;
            that._stream[peerID] = null;
            delete that.stream[peerID];
        };

        stream.onaddtrack = function() {
            Sonotone.log("REMOTEMEDIA", "New track added to RemoteStream"); 
        };

        stream.onremovetrack = function() {
            Sonotone.log("REMOTEMEDIA", "Track removed from RemoteStream"); 
        };
    }
};