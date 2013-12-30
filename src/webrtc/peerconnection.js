/**
 * PeerConnection namespace.
 * @param {String} id The peerConnection ID to user
 * @param {Boolean} hasRemoteDataChannel True if the remote peer can use Data Channel
 * @namespace
 */

var PeerConnection = Sonotone.IO.PeerConnection = function(id, hasRemoteDataChannel) {

    Sonotone.log("PEERCONNECTION", "Create new Peer Connection <" + id + ">");

    this._id = id || new Date().getTime();

    this.isCaller = false;

    this.raw = null;

    this.answerCreated = false;

    this.isConnected = false;

    this.statID = '';

    if(Sonotone.enableSTUN) {
        Sonotone.log("PEERCONNECTION", "Use STUN Server", Sonotone.STUN);
        this._peer = new Sonotone.RTCPeerConnection(Sonotone.STUN, Sonotone.constraints);
    }
    else {
        Sonotone.log("PEERCONNECTION", "No STUN server used");
        this._peer = new Sonotone.RTCPeerConnection(null, Sonotone.constraints);   
    }

    this._dataChannel = new Sonotone.IO.DataChannel(id, hasRemoteDataChannel, this._peer);

    this._subscribeToDataChannelEvents();

    Sonotone.log("PEERCONNECTION", "PeerConnection created", this._peer);

    this._callbacks = new Sonotone.IO.Events();

    var that = this;

    // Chrome - Firefox
    this._peer.onicecandidate = function(event) {
        if (event.candidate) {
            Sonotone.log("PEERCONNECTION", "Send local ICE CANDIDATE to PEER CONNECTION <" + that._id + ">");
            that._callbacks.trigger('onICECandiateReceived', event);
        } else {
            Sonotone.log("PEERCONNECTION", "No more local candidate to PEER CONNECTION <" + that._id + ">");
            that._callbacks.trigger("onICECandidateEnd", event);
        }
    };

    // Chrome - Firefox
    this._peer.onaddstream = function(event) {
        Sonotone.log("PEERCONNECTION", "Remote stream added from PEER CONNECTION <" + that._id + ">");
        that._callbacks.trigger('onRemoteStreamReceived', event);
    };

    // Chrome - Firefox
    this._peer.onremovestream = function(event) {
        Sonotone.log("PEERCONNECTION", "Remote stream removed from PEER CONNECTION <" + that._id + ">");
        that._callbacks.trigger('onRemoteStreamEnded', event);  
    };

    // Chrome only
    this._peer.oniceconnectionstatechange = function(event) {
        var state = event.target.iceConnectionState;
        Sonotone.log("PEERCONNECTION", "On Ice Connection state changes to " + state + " for PEER CONNECTION <" + that._id + ">", event);
        that._callbacks.trigger('onIceConnectionStateChanged', state);
    };

    // Chrome only
    this._peer.onnegotiationneeded = function(event) {
        Sonotone.log("PEERCONNECTION", "On negotiation needed for PEER CONNECTION <" + that._id + ">", event);
        that._callbacks.trigger('onNegotiationNeeded', event);
    };

    // Chrome only
    this._peer.onsignalingstatechange = function(event) {
        var signalingState = "";
        if(event.target) {
            signalingState = event.target.signalingState;
        }
        else if(event.currentTarget) {
            signalingState = event.currentTarget.signalingState;
        }
        else {
            signalingState = event;
        }
        Sonotone.log("PEERCONNECTION", "On signaling state changes to " + signalingState + " for PEER CONNECTION <" + that._id + ">", event);
        that._callbacks.trigger('onSignalingStateChanged', signalingState);  
    };

    // Firefox only
    this._peer.onclosedconnection = function(event) {
        Sonotone.log("PEERCONNECTION", "Connection closed for PEER CONNECTION <" + that._id + ">", event);
        that._callbacks.trigger('onClosedConnection', null);  
    };

    // Firefox only
    this._peer.onconnection = function(event) {
        Sonotone.log("PEERCONNECTION", "Connection opened for PEER CONNECTION <" + that._id + ">", event);
        that._callbacks.trigger('onConnection', null);  
    };

    // Firefox only
    this._peer.onopen = function(event) {
        Sonotone.log("PEERCONNECTION", "On Open for PEER CONNECTION <" + that._id + ">", event);
        that._callbacks.trigger('onOpen', null);  
    };

    this._peerReady = true;
};

/**
 * PeerConnection interface.
 *
 */

PeerConnection.prototype = {

    /**
     * ID of the Peer Connection
     *
     * @api public
     */

    ID: function(id) {
        if(id !== undefined) {
            this._id = id;
        }
        return this._id;
    },

    /**
     * Attach a stream to the Peer Connection
     * @param {Object} stream the Stream to attach
     *
     * @api public
     */

    attach: function(stream) {
        Sonotone.log("PEERCONNECTION", "Attach a stream to the Peer Connection <" + this._id + ">");
        if(stream) {
            this._peer.addStream(stream);
        }
        else {
            Sonotone.log("PEERCONNECTION", "No stream to add");
        }
    },

    /**
     * ID of the PeerConnection
     * @param {Object} stream The stream to detach
     *
     * @api public
     */

    detach: function(stream) {
        if(stream) {
            Sonotone.log("PEERCONNECTION", "Detach a stream to the Peer Connection <" + this._id + ">");
            this._peer.removeStream(stream);
            this.close();
        }
        else {
            Sonotone.log("PEERCONNECTION", "No stream to remove");
        }
    },

    /**
     * Is the Peer Connection ready (= always ???)
     *
     * @api public
     */

    ready: function() {
        return this._peerReady;
    },

    /**
     * Store the SDP into the Local Description of the peer
     * @param {Objet} SDP The JSON SDP message
     *
     * @api public
     */

    setLocalDescription: function(SDP) {
        Sonotone.log("PEERCONNECTION", "Store the SDP parameters to the local description");
        this._peer.setLocalDescription(SDP);
    },

    /**
     * Store the SDP into the Remote Description of the peer
     * @param {Objet} SDP The JSON SDP message
     *
     * @api public
     */

    setRemoteDescription: function(SDP) {
        Sonotone.log("PEERCONNECTION", "Store the SDP parameters to the remote description");
        this._peer.setRemoteDescription(SDP);
    },

    /**
     * Create an offer to one or several peers
     * @param {Boolean} isScreencaptured True if the screen has captured
     * @param {Object} fct The action to do on the peerConnection SDP
     *
     * @api public
     */ 

    createOffer: function(screenCaptured, fct) {

        var sdpConstraints = {
            'mandatory': {
                'OfferToReceiveAudio': screenCaptured ? false : true,
                'OfferToReceiveVideo': screenCaptured ? false : true 
            }
        };

        this.isCaller = true;

        var offerConstraints = {"optional": [], "mandatory": {}};

        var constraints = Sonotone.mergeConstraints(offerConstraints, sdpConstraints);

        Sonotone.log("PEERCONNECTION", "Create the SDP offer", constraints);

        var that = this;
    
        this._peer.createOffer(function(offerSDP) {

            if(fct) {
                switch (fct.action) {
                    case 'mute':
                        offerSDP = that.muteSDP(offerSDP, fct.audio, fct.video);
                        break;
                    case 'unmute':
                        offerSDP = that.unmuteSDP(offerSDP, fct.audio, fct.video);
                        break;
                    default:
                        break;
                }
            }
            
            //offerSDP.sdp = preferOpus(offerSDP.sdp);
            that.setLocalDescription(offerSDP);
            
            Sonotone.log("PEERCONNECTION", "Send this SDP OFFER to the remote peer <" + that._id + ">");

            var event = {
                data: offerSDP,
                caller: Sonotone.ID,
                callee: that._id
            };

            that._callbacks.trigger('onSDPOfferToSend', event);

        }, function(error) {
            Sonotone.log("PEERCONNECTION", "Fail to create Offer", error);
        }, constraints);
    },

    /**
     * Create an SDP answer message
     */

    createAnswer: function() {

        var sdpConstraints = {
            'mandatory': {
                'OfferToReceiveAudio': true,
                'OfferToReceiveVideo': true 
            }
        };
                    
        var that = this;

        this.isCaller = false;
                    
        this._peer.createAnswer(function(answerSDP) {
            //answerSDP.sdp = preferOpus(answerSDP.sdp);
            that.setLocalDescription(answerSDP);
                      
            Sonotone.log("PEERCONNECTION", "Send this SDP answer to the remote peer <" + that._id + ">");

            var event = {
                data: answerSDP,
                caller: Sonotone.ID,
                callee: that._id
            };

            that._callbacks.trigger('onSDPAnswerToSend', event);

        }, function(error) {
            Sonotone.log("PEERCONNECTION", "Fail to create Answer", error);
        }, sdpConstraints);

        this.answerCreated = true;

    },

    /**
     * Add an ICE candidate to the PeerConnection
     * @param {Object} ICEcandidate The candidate to add
     *
     * @api public
     */

    addIceCandidate: function(ICEcandidate)  {
        Sonotone.log("PEERCONNECTION", "Add ICE CANDIDATE to the PEER CONNECTION <" + this._id + ">");
        var candidate = new Sonotone.RTCIceCandidate({sdpMLineIndex:ICEcandidate.label, candidate:ICEcandidate.candidate, id: ICEcandidate.sdpMid});
        this._peer.addIceCandidate(candidate);
    },  

    /**
     * Subscribe to peer events
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
     * Get the PeerConnection 
     *
     * @api public
     */

    peer: function() {
        return this._peer;
    },

    /**
     * Close the peerConnection
     *
     * @api public
     */

    close: function() {
        Sonotone.log("PEERCONNECTION", "Close the PeerConnection <" + this._id + ">");
        this._peer.close();
    },

    /**
     * Send data using the Data Channel
     * @param {Object} data The data to send
     *
     * @api public
     */

    sendFile: function(file) {
        this._dataChannel.sendFile(file);
    },

    

    /**
     * Activate the stats for the peerConnection
     *
     * @api public
     */

    activateStats: function() {
            
        Sonotone.log("PEERCONNECTION", "Activate stat for PeerConnection <" + this._id + ">");

        var that = this;

        this.bytesPrevUp = 0;
        this.timestampPrevUp = 0;
        this.bytesPrevDown = 0;
        this.timestampPrevDown = 0;
        this.bytesRateUp = 0;
        this.bytesRateDown = 0;

        this.statID = setInterval(function() {

            that._peer.getStats(function(raw) {

                // Augumentation of stats entries with utility functions.
                // The augumented entry does what the stats entry does, but adds
                // utility functions.
                function AugumentedStatsResponse(response) {
                  this.response = response;
                  this.addressPairMap = [];
                }

                AugumentedStatsResponse.prototype.collectAddressPairs = function(componentId) {
                    if (!this.addressPairMap[componentId]) {
                        this.addressPairMap[componentId] = [];
                        for (var i = 0; i < this.response.result().length; ++i) {
                            var res = this.response.result()[i];
                            if (res.type ==='googCandidatePair' && res.stat('googChannelId') === componentId) {
                                this.addressPairMap[componentId].push(res);
                            }
                        }
                    }
                    return this.addressPairMap[componentId];
                };

                AugumentedStatsResponse.prototype.result = function() {
                    return this.response.result();
                };

                // The indexed getter isn't easy to prototype.
                AugumentedStatsResponse.prototype.get = function(key) {
                    return this.response[key];
                };

                var stats = new AugumentedStatsResponse(raw);

                var results = stats.result();
                var bytesNow = 0;
                var mic=0, speaker=0;

                for (var j = 0; j < results.length; ++j) {
                    var res = results[j];

                    console.log("TYPE", res.type, res);

                    // Bandwidth
                    var timestamp = res.timestamp.getTime() / 1000;
                    if (res.type === 'ssrc') {

                        if(res.stat('bytesReceived')) {
                            bytesNow = res.stat('bytesReceived');
                            
                            if (that.timestampPrevDown > 0 && that.timestampPrevDown < timestamp) {
                                that.bytesRateDown = Math.round((Math.abs(bytesNow - that.bytesPrevDown) / Math.abs(timestamp - that.timestampPrevDown)) / 1024 * 8);
                                console.log("DOWN", bytesNow, that.bytesPrevDown, timestamp, that.timestampPrevDown);
                            }
                            if(that.timestampPrevDown < timestamp) {
                                that.timestampPrevDown = timestamp;
                                that.bytesPrevDown = bytesNow;    
                            }
                            
                        }
                        else {
                            bytesNow = res.stat('bytesSent');
                            
                            if (that.timestampPrevUp > 0 && that.timestampPrevUp < timestamp) {
                                that.bytesRateUp = Math.round((Math.abs(bytesNow - that.bytesPrevUp) / Math.abs(timestamp - that.timestampPrevUp)) / 1024 * 8);
                                console.log("UP", bytesNow, that.bytesPrevUp, timestamp, that.timestampPrevUp);
                            }
                            if(that.timestampUp < timestamp) {
                                that.timestampPrevUp = timestamp;
                                that.bytesPrevUp = bytesNow;
                            }
                        }
                    }

                    // ActivityDetection
                    var obj = res.remote;
                    if (obj) {
                        var nspk = 0.0;
                        var nmic = 0.0;
                        
                        if (obj.stat('audioInputLevel')) {
                            nmic = obj.stat('audioInputLevel');
                        }
                        if (nmic > 0.0) {
                            mic = Math.floor(Math.max((Math.LOG2E * Math.log(nmic) - 4.0), 0.0));
                        }
                        if (obj.stat('audioOutputLevel')) {
                            nspk = obj.stat('audioOutputLevel');
                        }
                        if (nspk > 0.0) {
                            speaker = Math.floor(Math.max((Math.LOG2E * Math.log(nspk) - 4.0), 0.0));
                        }
                    }

                    /*
                        if (res.names) {
                            var names = res.names();
                            for (var i = 0; i < names.length; ++i) {
                                console.log("GET " + names[i] + " VALUE " + res.stat(names[i]));
                            }
                        }
                    */
                }

                var e = {
                    peerId: that._id,
                    bytesRateUp: that.bytesRateUp,
                    bytesRateDown: that.bytesRateDown,
                    micro: mic,
                    speaker: speaker
                };

                that._callbacks.trigger('onPeerConnectionStats', e);
                //console.log("GET STATS " + i, res);
                
            });

        }, 1000);
    },

    stopStats: function() {
        Sonotone.log("PEERCONNECTION", "Stop stat for PeerConnection <" + this._id + ">");
        clearInterval(this.statID);
    },

    muteSDP: function(sd, muteAudio, muteVideo) {
        Sonotone.log("PEERCONNECTION", "Mute PeerConnection <" + this._id + ">");

        // Split SDP into lines
        var sdpLines = sd.sdp.split('\r\n');
        var replaceVideo = false;
        var replaceAudio = false;
        var l = sdpLines.length;
        
        if(muteVideo) {
            for(var i=0; i<l; i++) {
            
                if(sdpLines[i].search('m=video') !== -1) {
                    replaceVideo = true;
                    continue;
                }

                if(replaceVideo) {
                    if(sdpLines[i].search('a=sendrecv') !== -1) {
                        sdpLines[i] = 'a=recvonly';
                        break;
                    }
                }
            }
        }

        if(muteAudio) {
            for(var j=0; j<l; j++) {
            
                if(sdpLines[j].search('m=audio') !== -1) {
                    replaceAudio = true;
                    continue;
                }

                if(replaceAudio) {
                    if(sdpLines[j].search('a=sendrecv') !== -1) {
                        sdpLines[j] = 'a=recvonly';
                        break;
                    }
                }
            }
        }

        // Reconstruct SDP
        sd.sdp = sdpLines.join('\r\n');
        return sd;

    },

    unmuteSDP: function(sd, unmuteAudio, unmuteVideo) {
        Sonotone.log("PEERCONNECTION", "Unmute PeerConnection <" + this._id + ">");

        // Split SDP into lines
        var sdpLines = sd.sdp.split('\r\n');
        var replaceVideo = false;
        var replaceAudio = false;
        var l = sdpLines.length;

        if(unmuteVideo) {
            for(var i=0; i<l; i++) {
            
                if(sdpLines[i].search('m=video') !== -1) {
                    replaceVideo = true;
                    continue;
                }

                if(replaceVideo) {
                    if(sdpLines[i].search('a=recvonly') !== -1) {
                        sdpLines[i] = 'a=sendrecv';
                        break;
                    }
                }
            }
        }

        if(unmuteAudio) {
            for(var j=0; j<l; j++) {
            
                if(sdpLines[j].search('m=audio') !== -1) {
                    replaceAudio = true;
                    continue;
                }

                if(replaceAudio) {
                    if(sdpLines[j].search('a=recvonly') !== -1) {
                        sdpLines[j] = 'a=sendrecv';
                        break;
                    }
                }
            }
        }

        // Reconstruct SDP
        sd.sdp = sdpLines.join('\r\n');
        return sd;
    },

    /**
     * Subscribe to datachannel events
     *
     * @api private
     */

    _subscribeToDataChannelEvents: function() {
        var that = this;

        this._dataChannel.on('onFileReceived', function(file) {
            that._callbacks.trigger('onFileReceived', file);
        }, this);
    },

};