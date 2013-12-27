/**
 * IO namespace.
 * @param {String} id The ID of the user
 *
 * @namespace
 */

var IO = Sonotone.IO = function(id) {

    // Display Sonotone.IO version in logs
    Sonotone.log("SONOTONE.IO", "Running v" + Sonotone.VERSION);

    // Display Browser version
    Sonotone.log("SONOTONE.IO", "Started on " + Sonotone.browser  + " v" + Sonotone.browserVersion);

    /**
     * Sonotone ID
     *
     * @api public
     */

    Sonotone.ID = id;

    /**
     * Transport to use
     *
     * @api private
     */

    this._transport = null;

    /**
     * Local stream
     *
     * @api private
     */

    this._localMedia = new Sonotone.IO.LocalMedia();

    /**
     * Remote stream
     *
     * @api private
     */

    this._remoteMedia = new Sonotone.IO.RemoteMedia();

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
                    this._transport = new Sonotone.IO.WebSocketTransport(config);
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
     * Manage the PeerConnections
     * Get/Create a PeerConnection
     * @param {String} id The ID of the PeerConnection (= the ID or the recipient)
     * @param {Object} caps The remote peer capabilities
     *
     * @api public
     */

    peerConnections: function(id, caps) {
        if(this._peerConnections[id] === undefined) {
            this._peerConnections[id] = new Sonotone.IO.PeerConnection(id, caps);
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

    sendChatMessage: function(msg) {
        if(this._transport) {

            var message = {
                data: {
                    type: 'chat',
                    content: msg
                },
                caller: Sonotone.ID,
                callee: 'all'
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

    /**
     * Try to call an other peer
     * @param {String} callee The recipient ID
     * @param {Boolean} hasRemoteDataChannel True if the remote peer can use Data-Channel
     *
     * @api public
     */

    call: function(callee, hasRemoteDataChannel) {
        var peer = this.peerConnections(callee, hasRemoteDataChannel);
        peer.attach(this.localMedia().streamVideo());
        peer.createOffer(this.localMedia().isScreenCaptured());
    },

    /**
     * Try to answer a call from an other peer
     * @param {String} caller The caller ID
     * @param {Boolean} hasRemoteDataChannel True if the remote peer can use Data-Channel
     *
     * @api public
     */

     answer: function(caller, hasRemoteDataChannel) {
        var peer = this.peerConnections(caller, hasRemoteDataChannel);
        peer.attach(this.localMedia().streamVideo());
        peer.setRemoteDescription(new Sonotone.RTCSessionDescription(this._tmpOffer));
        peer.createAnswer();
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
            peer.attach(this.localMedia().streamVideo());
            peer.createOffer(this.localMedia().isScreenCaptured());
        }
    },

    /**
     * Release the call
     * 
     * @api public
     */

    releaseCall: function() {
        this.localMedia().release();
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

    setSTUNServer: function(stun) {
        Sonotone.STUN = {"iceServers": [{"url": stun}]};
    },

    capabilities: function() {
        return {
            canViewVideo: Sonotone.isAudioVideoCompliant,
            canShareVideo: Sonotone.isAudioVideoCompliant,
            canViewScreen: Sonotone.isSharingViewerCompliant,
            canShareScreen: Sonotone.isSharingCompliant && Sonotone.isHTTPS,
            canShareData: Sonotone.isDataChannelCompliant
        };
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
            }, this);

            this._transport.on('onMessage', function(msg) {
                Sonotone.log("SONOTONE.IO", "Received from Transport: " + msg.data.type);

                switch (msg.data.type) {
                    case 'join':
                        this._callbacks.trigger('onPeerConnected', {id: msg.caller, caps: msg.data.caps});
                        break;
                     case 'already_joined':
                        this._callbacks.trigger('onPeerAlreadyConnected', {id: msg.caller, caps: msg.data.caps});
                        break;
                    case 'release':
                        this._callbacks.trigger('onPeerDisconnected', msg.caller);
                        //this._removePeer(msg.caller);
                        break;
                    case 'offer':
                        this._tmpOffer = msg.data;
                        this._callbacks.trigger('onCallOffered', msg.caller);
                        break;
                    case 'answer':
                        this._callbacks.trigger('onCallAnswered', msg.caller);
                        this.peerConnections(msg.caller).setRemoteDescription(new Sonotone.RTCSessionDescription(msg.data));
                        break;
                    case 'candidate':
                        if(this.peerConnections(msg.caller).answerCreated || this.peerConnections(msg.caller).isCaller) {
                            if(!this.peerConnections(msg.caller).isConnected) {
                                this.peerConnections(msg.caller).addIceCandidate(msg.data);
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
                    case 'chat':
                         this._callbacks.trigger('onPeerChat', {id: msg.caller, content: msg.data.content});
                        break;
                    case 'bye':
                        this._callbacks.trigger('onCallEnded', msg.caller);
                        break;
                }

            }, this);

            this._transport.on('onClose', function() {
                Sonotone.log("SONOTONE.IO", "Transport connection closed");
            }, this);  

            this._transport.on('onError', function(msg) {
                Sonotone.log("SONOTONE.IO", "Transport error:" + JSON.stringify(msg));
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
                Sonotone.log("SONOTONE.IO", "Local Media stopped");

                for(var peerID in this._peerConnections) {
                    that.peerConnections(peerID).detach(that.localMedia().stream());

                    //Inform other (SIG) about stopping call
                    that.sendMessage(
                        {
                            data: {
                                type: 'bye',
                            },
                            caller: Sonotone.ID,
                            callee: that.peerConnections(peerID).ID()
                        }
                    );

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
                    callee: peer.ID()
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

            this._remoteMedia.stream(event.stream, peer.ID());

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
                    this._callbacks.trigger('onCallStarted', peer.ID());

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
                        this._remoteMedia.stream(streams[0], peer.ID());
                    }
                    break;

                // Disconnected by the other peer
                case "disconnected":
                    this.peerConnections(peer.ID()).isConnected = false;
                    this.peerConnections(peer.ID()).close();
                    break;

                // PeerConnection closed
                case "closed":
                    this._removePeer(peer.ID());
                    break;
            }

        }, this);

         // Listen to Answer to send
        peer.on('onFileReceived', function(event) {

            console.log("io");

            var msg = {
                issuer: peer.ID(),
                data: event
            };

            this._callbacks.trigger('onFileReceived', msg);

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