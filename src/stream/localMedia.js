/**
 * LocalMedia namespace.
 *
 * @namespace
 */

var LocalMedia = Sonotone.IO.LocalMedia = function() {
    Sonotone.log("LOCALMEDIA", "LocalMedia initialized");

    this._requestUserMediaPending = false;
    this._callbacks = new Sonotone.IO.Events();

    this._streamVideo = null;
    this._streamScreen = null;

    this._mediaReady = false;

    this._isScreenCaptured = false;
    this._isCameraCaptured = false;

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
                    maxHeight: 180
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
                    case 'cam':
                        mediaConstraints.video.mandatory = {
                            maxWidth: 960,
                            maxHeight: 720
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
        if(!this._requestUserMediaPending && Sonotone.isAudioVideoCompliant) {

            var that = this;

            var mediaConstraints = this._getMediaConstraints(constraints);

            Sonotone.log("LOCALMEDIA", "Requested access to local media - Camera....", constraints);

            if(constraints.audio && constraints.video) {
                Sonotone.log("LOCALMEDIA", "Ask for audio and video media", mediaConstraints);
            }
            else if(constraints.audio) {
                Sonotone.log("LOCALMEDIA", "Ask for audio only", mediaConstraints);
                if(Sonotone.browser === "firefox") {
                    //mediaConstraints.video = false;
                }
            }
            else if(constraints.video) {
                Sonotone.log("LOCALMEDIA", "Ask for video only", mediaConstraints);
                if(Sonotone.browser === "firefox") {
                    //mediaConstraints.audio = false;
                }
            }
            else {
                Sonotone.log("LOCALMEDIA", "Ask for no media", mediaConstraints);
                 if(Sonotone.browser === "firefox") {
                    //mediaConstraints.audio = false;
                    //mediaConstraints.video = false;
                }
            }

            this._requestUserMediaPending = true;

            Sonotone.getUserMedia(mediaConstraints, function(_stream) {
                Sonotone.log("LOCALMEDIA", "User has granted access to local media - Camera");              
                that._streamVideo = _stream;
                that._requestUserMediaPending = false;
                that._mediaReady = true;
                that._subscribeToStreamEvent(that._streamVideo);
                that._isCameraCaptured = true;
                that._callbacks.trigger('onLocalVideoStreamStarted', that._streamVideo);
            }, function(_error) {
                Sonotone.log("LOCALMEDIA", "Failed to get access to local media", _error);   
                that._requestUserMediaPending = false;
                that._isCameraCaptured = false;
                that._mediaReady = false;
                that._callbacks.trigger('onLocalVideoStreamError', {code: 1, message:"", name: "PERMISSION_DENIED"});
            });
        }  
        else {
            if(!Sonotone.isAudioVideoCompliant) {
                Sonotone.log("LOCALMEDIA", "Browser not compliant for Audio/Video Communication");  
                this._callbacks.trigger('onLocalVideoStreamError', {code: 2, message:"", name: "BROWSER_NOT_COMPLIANT"});
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
         if(this._mediaReady && this._isScreenCaptured) {
            Sonotone.log("LOCALMEDIA", "Stop local media - Screen stream...");
            this._streamScreen.stop();
            this._callbacks.trigger('onLocalScreenStreamEnded', this._streamScreen);
        }
    },

    /**
     * Release Screen stream on local Media
     *
     * @api public
     */

    releaseVideo: function() {
         if(this._mediaReady && this._isVideoCaptured) {
            Sonotone.log("LOCALMEDIA", "Stop local media - Video stream...");
            this._streamVideo.stop();
            this._callbacks.trigger('onLocalVideoStreamEnded', this._streamScreen);
        }
    },

    /**
     * Share the screen to an other peer
     *
     * @api public
     */

    acquireScreen: function(constraints) {

        // Screen sharing seems to work only using HTTPS
        if(Sonotone.isSharingCompliant && Sonotone.isHTTPS) {
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

            Sonotone.getUserMedia({
                video: video_constraints
            }, function(_stream) {
                Sonotone.log("LOCALMEDIA", "User has granted access to local media - Screen");              
                that._streamScreen = _stream;
                that._requestUserMediaPending = false;
                that._mediaReady = true;
                that._isScreenCaptured = true;
                that._subscribeToStreamEvent(that._streamScreen);
                that._callbacks.trigger('onLocalScreenStreamStarted', that._streamScreen);
            }, function(_erroronstreaming) {
                that._isScreenCaptured = false;
                Sonotone.log("LOCALMEDIA", "Failed to get access to local media - Screen", _erroronstreaming);   
                that._requestUserMediaPending = false;
                that._mediaReady = false;
                that._callbacks.trigger('onLocalScreenStreamError', {code: 1, message:"", name: "PERMISSION_DENIED"});
            });
        }
        else {
            if(!Sonotone.isSharingCompliant) {
                Sonotone.log("LOCALMEDIA", "Browser not compliant for Desktop/Application sharing");  
                this._callbacks.trigger('onLocalScreenStreamError', {code: 2, message:"", name: "BROWSER_NOT_COMPLIANT"});
            }
            else if (!Sonotone.isHTTPS) {
                Sonotone.log("LOCALMEDIA", "Protocol should be HTTPS");  
                this._callbacks.trigger('onLocalScreenStreamError', {code: 3, message:"", name: "PROTOCOL_ERROR"});
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
     * Attach the Local video stream to a <video> or <canvas> element
     *
     * @api public
     */

    renderVideoStream: function(HTMLMediaElement) {
        Sonotone.log("LOCALMEDIA", "Render the local stream - Video"); 
        Sonotone.attachToMedia(HTMLMediaElement, this._streamVideo);
    },

     /**
     * Attach the Local screen stream to a <video> or <canvas> element
     *
     * @api public
     */

    renderScreenStream: function(HTMLMediaElement) {
        Sonotone.log("LOCALMEDIA", "Render the local stream - Screen"); 
        Sonotone.attachToMedia(HTMLMediaElement, this._streamScreen);
    },

    /**
     * Is the Local Media ready (= captured from the camera)
     *
     * @api public
     */

    ready: function() {
        return this._mediaReady;
    },

    /**
     * Get the Local Video Stream
     *
     * @api public
     */

    streamVideo: function() {
        return this._streamVideo;
    },

    /**
     * Get the Local Video Stream
     *
     * @api public
     */

    streamScreen: function() {
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
     * Subscribe to stream events
     *
     * @api private
     */

    _subscribeToStreamEvent: function(stream) {

        var that = this;

        stream.onended = function() {
            Sonotone.log("LOCALMEDIA", "Local Stream has ended"); 
            //TODO
            //Perahps we have to remove the MediaTrack that ended
            that._callbacks.trigger('onLocalStreamEnded', that._stream);
        };

        stream.onaddtrack = function() {
            Sonotone.log("LOCALMEDIA", "New track added to LocalStream"); 
        };

        stream.onremovetrack = function() {
            Sonotone.log("LOCALMEDIA", "Track removed from LocalStream"); 
        };
    }
};