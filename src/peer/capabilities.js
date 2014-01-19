/**
 * Config namespace.
 * 
 * @namespace
 */

var Capabilities = Sonotone.IO.Capabilities = function() {
	this._browser = 'unknown';
	this._browserVersion = 'unknown';
	this._audioVideoEnabled = false;
	this._sharingEnabled = false;
	this._sharingViewerEnabled = false;
	this._dataChannelEnabled = false;
	this._HTTPSEnabled = window.location.protocol === "http:" ? false : true;

	if(navigator.mozGetUserMedia && window.mozRTCPeerConnection) {
		// Firefox: Can make call but not sharing
        this._browser = "Firefox";
        this._browserVersion = parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);
        this._audioVideoEnabled = true;
        this._sharingEnabled = false;
        this._sharingViewerEnabled = true;
        this._dataChannelEnabled = true;
	}
	else if (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection) {
        // Chrome: can make call or Sharing
        this._browser = "Chrome";
        this._browserVersion = parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10);
        this._audioVideoEnabled = true;
        this._sharingViewerEnabled = true;
        this._sharingEnabled = this._HTTPSEnabled;
        if(this._browserVersion >= 31) {
            this._dataChannelEnabled = true;
        }
	}

	// Display Browser version
    Sonotone.log("CAPABILITIES", "Started on " + this._browser  + " v" + this._browserVersion);

};

/**
 * Capabilities interface.
 *
 */

Capabilities.prototype = {

	/**
	 * Get the Capabilities of the user
	 *
	 * api public
	 */

	caps: function() {
		return {
			browser: this._browser,
			browserVersion: this._browserVersion,
			canDoAudioVideoCall: this._audioVideoEnabled,
			canDoScreenSharing: this._sharingEnabled,
			canViewScreenSharing: this._sharingViewerEnabled,
			canUseDataChannel: this._dataChannelEnabled,
			startedWithHTTPS: this._HTTPSEnabled
		};		
	}
};