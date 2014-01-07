/**
 * IO namespace.
 * @param {String} id The ID of the user
 * @param {stunTurnOption}
 *
 * @namespace
 */

var IO = Sonotone.IO = function(id, stunConfig, turnConfig) {

    // Display Sonotone.IO version in logs
    Sonotone.log("SONOTONE.IO", "Running v" + Sonotone.VERSION);

    /**
     * Sonotone ID
     *
     * @api public
     */

    Sonotone.ID = id;

    /**
     * Configuration for STUN
     *
     * @api public
     */

    //Firefox (STUN) = {"iceServers": [{"url": "stun:stun.services.mozilla.com"}]};
    //Google (STUN) = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
    Sonotone.stunConfig = stunConfig;

    /**
     * Configuration for TURN
     * TODO: Take into account TURN server
     *
     * @api public
     */

    Sonotone.turnConfig = turnConfig;    

    /**
     * Transport to use
     *
     * @api private
     */

    this._transport = null;

    /**
     * Capabilities
     *
     * @api private
     */

    this._capabilities = new Sonotone.IO.Capabilities();

    /**
     * Adapter
     *
     * @api private
     */
     this._adapter = new Sonotone.IO.Adapter();

    /**
     * Local stream
     *
     * @api private
     */

    this._localMedia = new Sonotone.IO.LocalMedia(this.caps(), this._adapter);

    /**
     * Remote stream
     *
     * @api private
     */

    this._remoteMedia = new Sonotone.IO.RemoteMedia(this._adapter);

    /**
     * List of created Peerconnections
     *
     * @api private
     */

    this._peerConnections = {};

     /**
     * Store the temp offer (in case of answering the call)
     *
     * @api private
     */
    
    this._tmpOffer = null;

    /**
     * Store the temp ICE Candidate in case of Answer not created yet
     *
     * @api private
     */

    this._tmpCandidate = [];

    /**
     * Events
     *
     * @api private
     */

    this._callbacks = new Sonotone.IO.Events();

    //Initialization event
    this._subscribeToLocalStreamEvent();
    this._subscribeToRemoteStreamEvent();

};

/**
 * IO interface.
 *
 */

IO.prototype = {

    /**
     * Get or set the transport
     * @param {String} name The transport name
     * @param {Object} config The JSON Configuration of the transport
     * @return {Object} the Sonotone.IO.<xxx>Transport Object
     *
     * @api public
     */

    transport: function(name, config) {

        if(name !== undefined && config !== undefined) {

            switch (name) {
                case "websocket":
                    this._transport = new Sonotone.IO.WebSocketTransport(config, this.caps());
                    break;
                case "socketio":
                    this._transport = new Sonotone.IO.SocketIOTransport(config);
                    break;
                case "sip":
                     this._transport = new Sonotone.IO.SIPTransport(config);
                    break;
                case "remote":
                    this._transport = new Sonotone.IO.RemoteTransport(config);
                    break;
            }

            this._subscribeToTransportEvent();
        }

        return this._transport;
    },

    /**
     * Get/Create the localstream
     * @return {Object} The Sonotone.IO.LocalMedia object
     *
     * @api public
     */

    localMedia: function() {
        if(!this._localMedia) {
            this._localMedia = new Sonotone.IO.LocalMedia();
            this._subscribeToLocalStreamEvent();
        }

        return this._localMedia;
    },

    /**
     * Get/Create the remoteMedia
     * @return {Object} The Sonotone.IO.RemoteMedia object
     *
     * @api public
     */

    remoteMedia: function() {
        if(!this._remoteMedia) {
            this._remoteMedia = new Sonotone.IO.RemoteMedia();
            this._subscribeToRemoteStreamEvent();
        }

        return this._remoteMedia;
    },

    /**
     * Get the user Capabilities
     *
     * @api public
     */
    caps: function() {
        return this._capabilities.caps();
    },

    /**
     * Manage the PeerConnections
     * Get/Create a PeerConnection
     * @param {String} id The ID of the PeerConnection (= the ID or the recipient)
     *
     * @api public
     */

    peerConnections: function(id) {
        if(this._peerConnections[id] === undefined) {
            Sonotone.log("SONOTONE.IO", "PeerConnections not found, create a new one...", id);
            this._peerConnections[id] = new Sonotone.IO.PeerConnection(id, false, this._adapter, this.caps());
            this._subscribeToPeerConnectionEvent(this._peerConnections[id]);
        }

        return this._peerConnections[id];
    },

    /**
     * Send a message thu the transport
     * @param {String} msg The content to send
     *
     * @api public
     */

    sendIMMessage: function(msg, to) {
        if(this._transport) {

            var message = {
                data: {
                    type: 'im',
                    content: msg,
                    private: to ? true: false
                },
                caller: Sonotone.ID,
                callee: to || 'all'
            };

            this._transport.send(message);
        }
    },

    /**
     * Send a message thu the transport
     * @param {JSON} msg The content to send
     * @param {String} to The recipient or null for all participants
     *
     * @api public
     */

    sendMessage: function(msg, to) {
        if(this._transport) {

            var message = {
                data: {
                    type: 'data',
                    content: msg
                },
                caller: Sonotone.ID,
                callee: to || 'all'
            };
            
            this._transport.send(message);
        }
    },

    /**
     * Send a file to a remote peer using dataChannel
     * @param {Object} file The file to send
     * @param {String} to The recipient or null for all participants
     *
     * @api public
     */

    sendFile: function(file, callee) {
        var peer = null;

        if(callee) {
            peer = this.peerConnections(callee);
            peer.sendFile(file);
        }
        else {

        }
    },

    sendPeerMessage: function(msg, callee) {
        var peer = this.peerConnections("v" + callee);
        peer.sendMessage(msg);
    },

    /**
     * Add the local video stream to a Peer Connection
     * @param {String} callee The callee
     *
     * @api public
     */

    addVideoToCall: function(callee) {
        var peer = this.peerConnections("v" + callee);
        peer.attach(this.localMedia().streamVideo());
    },

    /**
     * Remove the local video stream from the peer
     * @param {String} callee The callee
     *
     * @api public
     */

    removeVideoFromCall: function(callee) {
        var peer = this.peerConnections("v" + callee);
        peer.detach(this.localMedia().streamVideo(), true);   
    },

    /**
     * Check if there is a video call with a user
     * @param {String} callee The user to check
     *
     * @api public
     */

    isVideoReceivedFrom: function(callee) {
        var peerID =  'v' + callee;
        if(peerID in this._peerConnections) {
            var peer = this._peerConnections[peerID];
            return peer.isStreamConnected();
        }
        else {
            return false;
        }
    },

    /**
     * Is Screen sharing received from
     * @param {String} callee The user to check
     *
     * @api public
     */

    isScreenReceivedFrom: function(callee) {
        var peerID =  's' + callee;
        if(peerID in this._peerConnections) {
            var peer = this._peerConnections[peerID];
            return peer.isStreamConnected();
        }
        else {
            return false;
        }
    },

    /**
     * Add data channel to a peer connection
     * @param {String} callee The callee
     * @param {String} media 'video', 'screen', 'data'
     *
     * @api public
     */

    addDataToCall: function(callee, media) {
        var m = media.substring(0,1);
        var peer = this.peerConnections(m + callee);
               
        peer.addDataChannel();

    },

    /**
     * Try to call an other peer
     * @param {String} callee The recipient ID
     * @param {String} media 'video', 'screen', 'data'
     * @param {Boolean} withDataChannel True to add data channel support to the peer (if possible)
     *
     * @api public
     */

    call: function(callee, media, withDataChannel) {

        var m = media.substring(0,1);
        var peer = this.peerConnections(m + callee, withDataChannel);
        
        switch (media) {
            case 'video':
                if(this.localMedia().isCameraCaptured()) {
                    peer.attach(this.localMedia().streamVideo());    
                }
                break;
            case 'screen':
                if(this.localMedia().isScreenCaptured()) {
                    peer.attach(this.localMedia().streamScreen());
                }
                break;
            case 'data':
                //No other thing to do
                break;
            default:
                break;

        }
        peer.createOffer(media, withDataChannel, null);
    },

    /**
     * Try to answer to call from a peer
     * @param {String} caller The recipient ID
     * @param {Boolean} doNotSendLocalVideo If true, do not share the local video (only receive the stream for the moment)
     *
     * @api public
     */

    answer: function(caller, doNotSendLocalVideo) {

        var m = this._tmpOffer.media.substring(0,1);
        var withDataChannel = this._tmpOffer.channel;
        var peer = this.peerConnections(m + caller, withDataChannel);
        var blockVideo = peer.isLocalStreamBlocked() || doNotSendLocalVideo;

        switch (this._tmpOffer.media) {
            case 'video':
                if(this.localMedia().isCameraCaptured() && !blockVideo) {
                    peer.attach(this.localMedia().streamVideo());    
                }
                break;
            case 'screen':
                break;
            case 'data':
                break;
            default:
                break;
        }

        peer.setRemoteDescription(this._adapter.RTCSessionDescription(this._tmpOffer.data));
        peer.createAnswer(this._tmpOffer.media);

    },

    /**
     * Try to broadcast a call to all peers in order to diffuse
     * the video stream to all other
     * @param {Array} recipients The list of peers to broacast
     *
     * @api public
     */

    broadcastCall: function(callees) {
        for (var i=0;i<callees.length;i++) {
            var peer = this.peerConnections(callees[i]);
            peer.createOffer(this.localMedia().isScreenCaptured());
        }
    },

    /**
     * Close Connection with a peer
     *
     * @api public
     */

    release: function(callee, media) {
        var peerID = media.substring(0,1) + callee;

        // Release the media
        if(media === 'video') {
            this._localMedia.releaseVideo();
        }
        else {
            this._localMedia.releaseScreen();
        }

        // Close the associated peerConnection
        var peer = this.peerConnections(peerID);

        peer.close();
    },

    /**
     * Subscribe to IO events
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

    setSTUNServer: function(stun) {
        Sonotone.STUN = {"iceServers": [{"url": stun}]};
    },

    setStats: function() {
        // Start stat for each peerConnection
        for (var peerID in this._peerConnections) {
            this._peerConnections[peerID].activateStats();
        }
    },

    stopStats: function() {
        // Stop stat for each peerConnection
        for (var peerID in this._peerConnections) {
            this._peerConnections[peerID].stopStats();
        }
    },

    /**
     * Mute a stream (video or screen)
     * @param {String} callee The user ID to mute
     * @param {String} media The media to mute
     *
     * @api public
     */

    mute: function(callee, media) {
        var flag = media.substring(0, 1);
        var peer = this.peerConnections(flag + callee);
        peer.createOffer(this.localMedia().isScreenCaptured(), false, {action: 'mute'});
    },

    /**
     * Unmute a stream (video or screen)
     * @param {String} callee The user to unmute
     * @param {String} media The media to unmute
     *
     * @api public
     */

    unmute: function(callee, media) {
        var flag = media.substring(0, 1);
        var peer = this.peerConnections(flag + callee);
        peer.createOffer(this.localMedia().isScreenCaptured(), false, {action: 'unmute'});      
    },

    /**
     * Subscribe to transport event
     *
     * @api private
     */

    _subscribeToTransportEvent: function() {
        if(this._transport) {

            this._transport.on('onReady', function() {
                Sonotone.log("SONOTONE.IO", "Transport successfully connected");
                this._callbacks.trigger('onTransportReady', null);
            }, this);

            this._transport.on('onMessage', function(msg) {
                Sonotone.log("SONOTONE.IO", "Received from Transport: " + msg.data.type);

                var media = "";

                switch (msg.data.type) {
                    case 'join':
                        this._callbacks.trigger('onPeerConnected', {id: msg.caller, caps: msg.data.caps});
                        break;
                     case 'already_joined':
                        this._callbacks.trigger('onPeerAlreadyConnected', {id: msg.caller, caps: msg.data.caps});
                        break;
                    case 'release':
                        this._callbacks.trigger('onPeerDisconnected', {id: msg.caller});
                        break;
                    case 'offer':
                        this._tmpOffer = msg;
                        this._callbacks.trigger('onCallOffered', {id: msg.caller, media: msg.media});
                        break;
                    case 'answer':
                        this._callbacks.trigger('onCallAnswered', {id: msg.caller, media: msg.media});
                        media = msg.media.substring(0, 1);
                        this.peerConnections(media + msg.caller).setRemoteDescription(this._adapter.RTCSessionDescription(msg.data));
                        break;
                    case 'candidate':
                        media = msg.media.substring(0, 1);
                        var peer = this.peerConnections(media + msg.caller); 
                        if(peer.answerCreated || peer.isCaller) {
                            if(!peer.isConnected) {
                                peer.addIceCandidate(msg.data);
                            }
                            else {
                                Sonotone.log("SONOTONE.IO", "Don't add this Candidate because PEERCONNECTION <" + msg.caller + "> is already connected");
                            }
                        }
                        else {
                            Sonotone.log("SONOTONE.IO", "ANSWER not yet created. Store Candidate for future usage");
                            this._tmpCandidate.push(msg.data);
                        }
                        break;
                    case 'im':
                         this._callbacks.trigger('onPeerIMMessage', {id: msg.caller, content: msg.data.content, private: msg.data.private});
                        break;
                    case 'bye':
                        this._callbacks.trigger('onCallEnded', {id: msg.caller, media: msg.media});
                        break;
                    default:
                        this._callbacks.trigger('onTransportMessage', msg);
                        break;
                }

            }, this);

            this._transport.on('onClose', function() {
                Sonotone.log("SONOTONE.IO", "Transport connection closed");
                this._callbacks.trigger('onTransportClose', null);
            }, this);  

            this._transport.on('onError', function(msg) {
                Sonotone.log("SONOTONE.IO", "Transport error:" + JSON.stringify(msg));
                this._callbacks.trigger('onTransportError', msg);
            }, this);

        }
        else {
            Sonotone.log("SONOTONE.IO", "No Transport!!!");
        }
    },

    /**
     * Subscribe to LocalStream event
     *
     * @api private
     */

    _subscribeToLocalStreamEvent: function() {

        if(this._localMedia) {

            var that = this;

            this._localMedia.on('onLocalVideoStreamStarted', function() {
                Sonotone.log("SONOTONE.IO", "Local Media successfully initialized");

            }, this);

            this._localMedia.on('onLocalVideoStreamEnded', function() {
                Sonotone.log("SONOTONE.IO", "Local Video Media stopped");

                for(var peerID in this._peerConnections) {
                    that.peerConnections(peerID).detach(that.localMedia().streamVideo());

                    //Inform other (SIG) about stopping call
                    var message = {
                        data: {
                            type: 'bye',
                        },
                        media: 'video',
                        caller: Sonotone.ID,
                        callee: peerID.substring(1)
                    };

                    that._transport.send(message);
                }

            }, this);

            this._localMedia.on('onLocalScreenStreamEnded', function() {
                Sonotone.log("SONOTONE.IO", "Local Screen Media stopped");

                for(var peerID in this._peerConnections) {
                    that.peerConnections(peerID).detach(that.localMedia().streamScreen());

                    //Inform other (SIG) about stopping call
                    var message = {
                        data: {
                            type: 'bye',
                        },
                        caller: Sonotone.ID,
                        callee: peerID.substring(1),
                        media: 'screen',
                    };

                    that._transport.send(message);
                }

            }, this);            

            this._localMedia.on('onLocalVideoStreamError', function(err) {
                Sonotone.log("SONOTONE.IO", "Error on Local Media: " + err);
            }, this);
        }
        else {
            Sonotone.log("SONOTONE.IO", "No LocalStream!!!");
        }
    },

    /**
     * Subscribe to RemoteStream event
     *
     * @api private
     */

    _subscribeToRemoteStreamEvent: function() {
        if(this._remoteMedia) {

        }
        else {
            Sonotone.log("SONOTONE.IO", "No RemoteStream!!!");
        }
    },

    _getMediaUsed: function(peer) {
        return peer.ID().substring(0,1) === 'v' ? 'video' : peer.ID().substring(0,1) === 's' ? 'screen' : 'data';
    },

    /**
     * Subscribe to PeerConnection event
     * @param {Object} peer The PeerConnection to subscribe
     */

    _subscribeToPeerConnectionEvent: function(peer) {

        // Listen to candidates
        peer.on('onICECandiateReceived', function(event) {
            Sonotone.log("SONOTONE.IO", "Send ICE Candidate received by Peer Connection <" + peer.ID() + ">");

            if(!peer.isConnected) {

                var message = {
                    data: {
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate
                    },
                    caller: Sonotone.ID,
                    callee: peer.ID().substring(1),
                    media: this._getMediaUsed(peer)
                };

                this._transport.send(message);
            }
            else {
                Sonotone.log("SONOTONE.IO", "Do not send ICE Candidate because Peer Connection <" + peer.ID() + "> is already connected");
            }

        }, this);

        // Listen to end of candidate
        peer.on('onICECandidateEnd', function() {
            if(this._tmpCandidate !== null && this._tmpCandidate.length > 0) {

                Sonotone.log("SONOTONE.IO", "Add previously stored Candidate to PeerConnection <" + peer.ID() + ">");

                for(var i=0;i<this._tmpCandidate.length;i++) {
                    this.peerConnections(peer.ID()).addIceCandidate(this._tmpCandidate[i]);
                }
                this._tmpCandidate = [];
            }
            else {
                Sonotone.log("SONOTONE.IO", "All Candidates have been added to PeerConnection <" + peer.ID() + ">");
            }
        }, this);

        // Listen to new remote stream
        peer.on('onRemoteStreamReceived', function(event) {

            Sonotone.log("SONOTONE.IO", "Create the Remote Media with this remote stream received");
            this._remoteMedia.stream(event.stream, peer.ID(), peer.media());

        }, this);

        // Listen to end of remote stream
        peer.on('onRemoteStreamEnded', function() {
            Sonotone.log("SONOTONE.IO", "Remote Stream ended");
        }, this);

        // Listen to Offer to send 
        peer.on('onSDPOfferToSend', function(event) {

            // Send this message to the remote peer
            this._transport.send(event);

        }, this);

        // Listen to Answer to send
        peer.on('onSDPAnswerToSend', function(event) {

            // Send this message to the remote peer
            this._transport.send(event);

        }, this);

        // Listen to ICE Connection state change
        peer.on('onIceConnectionStateChanged', function(state) {

            switch(state) {

                //Checking
                case "checking":
                    break;

                // Connection OK
                case "connected":
                    this.peerConnections(peer.ID()).isConnected = true;
                    this._callbacks.trigger('onCallStarted', {id: peer.ID(), media: peer.media()});

                    var pc = this.peerConnections(peer.ID()).peer();
                    var streams = null;

                    if (typeof pc.getRemoteStreams === 'function') {
                        streams = pc.getRemoteStreams();
                    }
                    else {
                        streams = pc.remoteStreams;
                    }

                    if(streams.length > 0) {
                        // Store this new remote media associated to this peer Connection
                        this._remoteMedia.stream(streams[0], peer.ID(), peer.media());
                    }
                    break;

                // Disconnected by the other peer
                case "disconnected":
                    Sonotone.log("SONOTONE.IO", "Disconnected PeerConnection <" + peer.ID() + ">");
                    this.peerConnections(peer.ID()).isConnected = false;
                    this.peerConnections(peer.ID()).close();
                    break;

                // PeerConnection closed
                case "closed":
                    Sonotone.log("SONOTONE.IO", "Closed PeerConnection <" + peer.ID() + ">");
                    this._removePeer(peer.ID());
                    break;
            }

        }, this);

        // A change has been made that need a renegotiation
        peer.on('onNegotiationNeeded', function() {
            peer.createOffer(this._getMediaUsed(peer), false, null);
        }, this);

        // Listen to Answer to send
        peer.on('onFileReceived', function(event) {

            var msg = {
                issuer: peer.ID(),
                data: event
            };

            this._callbacks.trigger('onFileReceived', msg);

        }, this);

        // Listen to peerConnection statistics
        peer.on('onPeerConnectionStats', function(event) {
            this._callbacks.trigger('onPeerConnectionStats', event);
        }, this);
    
    },

    /**
     * Remove a PeerConnection from the list of existing PeerConnections
     * @param {String} id The ID of the PeerConnection to remove
     *
     * @api private
     */

    _removePeer: function(id) {
        this._peerConnections[id] = null;
        delete this._peerConnections[id];
    }

};