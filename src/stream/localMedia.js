/**
 * LocalMedia namespace.
 *
 * @namespace
 */

var LocalMedia = Sonotone.IO.LocalMedia = function(caps, adapter) {
    Sonotone.log("LOCALMEDIA", "LocalMedia initialized");

    this._requestUserMediaPending = false;
    this._callbacks = new Sonotone.IO.Events();

    this._streamVideo = null;
    this._streamScreen = null;

    this._isScreenCaptured = false;
    this._isCameraCaptured = false;

    this._caps = caps;

    this._adapter = adapter;
};

/**
 * LocalMedia interface.
 *
 */

LocalMedia.prototype = {

    /**
     * Get the media constraints
     *
     * @api private
     */

    _getMediaConstraints: function(constraints) {
        
        var mediaConstraints = {
            audio: false
        };

        if ('audio' in constraints) {
            mediaConstraints.audio = constraints.audio;
        }

        if ('video' in constraints) {

            // Add th video constraints if needed
            mediaConstraints.video = {
                mandatory: {
                    maxWidth: 320,
                    maxHeight: 240
                }, 
                optional: []
            };

            if ('format' in constraints) {

                switch (constraints.format) {
                    case 'qvga':
                        mediaConstraints.video.mandatory = {
                            maxWidth: 320,
                            maxHeight: 240
                        };
                        break;
                    case 'qvga_16:9':
                        mediaConstraints.video.mandatory = {
                            maxWidth: 320,
                            maxHeight: 180
                        };
                        break;
                    case 'vga':
                        mediaConstraints.video.mandatory = {
                            maxWidth: 640,
                            maxHeight: 480
                        };
                        break;
                    case 'vga_16:9':
                        mediaConstraints.video.mandatory = {
                            maxWidth: 640,
                            maxHeight: 360
                        };
                        break;
                    case 'cam':
                        mediaConstraints.video.mandatory = {
                            maxWidth: 960,
                            maxHeight: 720
                        };
                        break;
                    case 'hd':
                        mediaConstraints.video.mandatory = {
                            maxWidth: 1280,
                            maxHeight: 720
                        };
                        break;
                    default:
                        mediaConstraints.video.mandatory = {
                            maxWidth: 320,
                            maxHeight: 240
                        };
                        break;
                }
            }
        }

        return mediaConstraints;
    },

    /**
     * Start accessing to the local Media
     * @param {Object} constraints The audio/Video constraints
     *
     * @api public
     */

    acquire: function(constraints) {
        if(!this._requestUserMediaPending && this._caps.canDoAudioVideoCall) {

            var that = this;

            var mediaConstraints = this._getMediaConstraints(constraints);

            Sonotone.log("LOCALMEDIA", "Requested access to local media - Camera....", constraints);

            if(constraints.audio && constraints.video) {
                Sonotone.log("LOCALMEDIA", "Ask for audio and video media", mediaConstraints);
            }
            else if(constraints.audio) {
                Sonotone.log("LOCALMEDIA", "Ask for audio only", mediaConstraints);
                //if(this._caps.browser === "firefox") {
                    //mediaConstraints.video = false;
                //}
            }
            else if(constraints.video) {
                Sonotone.log("LOCALMEDIA", "Ask for video only", mediaConstraints);
                //if(this._caps.browser === "firefox") {
                    //mediaConstraints.audio = false;
                //}
            }
            else {
                Sonotone.log("LOCALMEDIA", "Ask for no media", mediaConstraints);
                 //if(this._caps.browser === "firefox") {
                    //mediaConstraints.audio = false;
                    //mediaConstraints.video = false;
                //}
            }

            this._requestUserMediaPending = true;

            this._adapter.getUserMedia(mediaConstraints, function(_stream) {
                Sonotone.log("LOCALMEDIA", "User has granted access to local media - Camera");              
                that._streamVideo = _stream;
                that._requestUserMediaPending = false;
                that._subscribeToStreamEvent(that._streamVideo);
                that._isCameraCaptured = true;
                that._callbacks.trigger('onLocalVideoStreamStarted', {media: 'video', stream: that._streamVideo});
            }, function(_error) {
                Sonotone.log("LOCALMEDIA", "Failed to get access to local media", _error);   
                that._requestUserMediaPending = false;
                that._isCameraCaptured = false;
                that._callbacks.trigger('onLocalVideoStreamError', {code: 1, message:"", name: "PERMISSION_DENIED"});
            }, this);
        }  
        else {
            if(!this._caps.canDoAudioVideoCall) {
                Sonotone.log("LOCALMEDIA", "Browser not compliant for Audio/Video Communication");  
                this._callbacks.trigger('onLocalVideoStreamError', {code: 2, message:"", name: "BROWSER_NOT_COMPLIANT"});
            }
            else {
                Sonotone.log("LOCALMEDIA", "Aquire already in progress...");  
            }
        } 
    },

    /**
     * Release the Local Media (both 2 streams)
     *
     * @api public
     */

    release: function() {
        // Release the Screen capture if exists
        this.releaseScreen();

        // Release the video capture if exists
        this.releaseVideo();
    },

    /**
     * Release Screen stream on local Media
     *
     * @api public
     */

    releaseScreen: function() {
         if(this._isScreenCaptured) {
            Sonotone.log("LOCALMEDIA", "Stop local media - Screen stream...");
            this._streamScreen.stop();
        }
    },

    /**
     * Release Screen stream on local Media
     *
     * @api public
     */

    releaseVideo: function() {
         if(this._isCameraCaptured) {
            Sonotone.log("LOCALMEDIA", "Stop local media - Video stream...");
            this._streamVideo.stop();
        }
    },

    /**
     * Share the screen to an other peer
     *
     * @api public
     */

    acquireScreen: function(constraints) {

        // Screen sharing seems to work only using HTTPS
        if(this._caps.canDoScreenSharing && this._caps.startedWithHTTPS) {
            var that = this;

            var maxWidth = screen.width;
            var maxHeight = screen.height;

            if(constraints) {
                if('width' in constraints) {
                    maxWidth = constraints.width;
                }
                if('height' in constraints) {
                    maxHeight = constraints.height;
                }
            }

            var video_constraints = {
                mandatory: { 
                    chromeMediaSource: 'screen',
                    maxWidth: maxWidth,
                    maxHeight: maxHeight
                },
                optional: []
            };

            Sonotone.log("LOCALMEDIA", "Ask for screen media", video_constraints);

            this._adapter.getUserMedia({
                video: video_constraints
            }, function(_stream) {
                Sonotone.log("LOCALMEDIA", "User has granted access to local media - Screen");              
                that._streamScreen = _stream;
                that._requestUserMediaPending = false;
                that._isScreenCaptured = true;
                that._subscribeToStreamEvent(that._streamScreen);
                that._callbacks.trigger('onLocalScreenStreamStarted', {media:'screen', stream: that._streamScreen});
            }, function(_erroronstreaming) {
                that._isScreenCaptured = false;
                Sonotone.log("LOCALMEDIA", "Failed to get access to local media - Screen", _erroronstreaming);   
                that._requestUserMediaPending = false;
                that._callbacks.trigger('onLocalScreenStreamError', {code: 1, message:"", name: "PERMISSION_DENIED"});
            }, this);
        }
        else {
            if(!this._caps.startedWithHTTPS) {
                Sonotone.log("LOCALMEDIA", "Protocol should be HTTPS");  
                this._callbacks.trigger('onLocalScreenStreamError', {code: 3, message:"", name: "PROTOCOL_ERROR"});
                
            }
            else {
                Sonotone.log("LOCALMEDIA", "Browser not compliant for Desktop/Application sharing");  
                this._callbacks.trigger('onLocalScreenStreamError', {code: 2, message:"", name: "BROWSER_NOT_COMPLIANT"});    
            }
        }
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
     * Trigger event
     * For testing purpose
     *
     * @api public
     */
    trigger: function(eventName, args) {
        this._callbacks.trigger(name, args);
    },

    /**
     * Attach the Local video stream to a <video> or <canvas> element
     *
     * @api public
     */

    renderVideoStream: function(HTMLMediaElement) {
        Sonotone.log("LOCALMEDIA", "Render the local stream - Video"); 
        if(this._streamVideo) {
            return this._adapter.attachToMedia(HTMLMediaElement, this._streamVideo);    
        }
        else {
            return null;
        }
    },

     /**
     * Attach the Local screen stream to a <video> or <canvas> element
     *
     * @api public
     */

    renderScreenStream: function(HTMLMediaElement) {
        Sonotone.log("LOCALMEDIA", "Render the local stream - Screen");
        if(this._streamScreen) {
            return this._adapter.attachToMedia(HTMLMediaElement, this._streamScreen);    
        }
        else {
            return null;
        }
    },

    /**
     * Get the Local Video Stream
     *
     * @api public
     */

    streamVideo: function(streamVideo) {
        if(streamVideo) {
            this._streamVideo = streamVideo;
            this._isCameraCaptured = true;
        }
        return this._streamVideo;
    },

    /**
     * Get the Local Video Stream
     *
     * @api public
     */

    streamScreen: function(streamScreen) {
        if(streamScreen) {
            this._streamScreen = streamScreen;
            this._isScreenCaptured = true;
        }
        return this._streamScreen;
    },

    /**
     * Is a screen stream captured and ready to be sent
     *
     * @api public
     */

    isScreenCaptured: function() {
        return this._isScreenCaptured;
    },

    /**
     * Is a camera stream captured and ready to be sent
     *
     * @api public
     */

    isCameraCaptured: function() {
        return this._isCameraCaptured;
    },


    /**
     * Get or set the capabilities
     * For testing purpose
     */
    caps: function(caps) {
        if(caps) {
            this._caps = caps;
        }
        return this._caps;
    },

    /**
     * Subscribe to stream events
     *
     * @api private
     */

    _subscribeToStreamEvent: function(stream) {

        var that = this;

        stream.onended = function(e) {

            var s = e.currentTarget;

            Sonotone.log("LOCALMEDIA", "A local track has ended", s.id);

            if(that._streamVideo) {
                if(s.id === that._streamVideo.id) {
                    // It concerns the camera
                    Sonotone.log("LOCALMEDIA", "Local Video Stream has ended");
                    that._callbacks.trigger('onLocalVideoStreamEnded');
                    that._streamVideo = null;
                    that._isCameraCaptured = false;
                }
                else {
                    Sonotone.log("LOCALMEDIA", "Unknow ended stream");
                }    
            }
            if (that._streamScreen) {
                if(s.id === that._streamScreen.id) {
                    // It concerns the screen
                    Sonotone.log("LOCALMEDIA", "Local Screen Stream has ended");
                    that._callbacks.trigger('onLocalScreenStreamEnded');
                    that._streamScreen = null;
                    that._isScreenCaptured = false;
                }
                else {
                    Sonotone.log("LOCALMEDIA", "Unknow ended stream");
                }
            }
        };

        stream.onaddtrack = function() {
            Sonotone.log("LOCALMEDIA", "New track added to LocalStream"); 
        };

        stream.onremovetrack = function() {
            Sonotone.log("LOCALMEDIA", "Track removed from LocalStream"); 
        };
    }
};