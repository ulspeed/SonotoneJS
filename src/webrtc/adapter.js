/**
 * Adapter
 * For keeping API compatibility between Chrome and Firefox
 * Compliant since:
 * Chrome 28+
 * Firefox 22+
 *
 * @namespace
 */

var Adapter = Sonotone.IO.Adapter = function() {

	this._isFirefox = false;
	this._isChrome = false;

	if(navigator.mozGetUserMedia && window.mozRTCPeerConnection) {
		this._isFirefox = true;
	}
	else if (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection) {
		this._isChrome = true;
	}

};

/**
 * Adapter interface.
 *
 */

Adapter.prototype = {

	getUserMedia: function(constraints, callback, errCallback, context) {

		if(this._isChrome) {
			return navigator.webkitGetUserMedia.bind(navigator).call(context, constraints, callback, errCallback);
		}
		else if(this._isFirefox) {
			return navigator.mozGetUserMedia.bind(navigator).call(context, constraints, callback, errCallback, context);
		}
	},

	attachToMedia: function(element, stream) {
		if(this._isChrome) {
			if (typeof element.srcObject !== 'undefined') {
                element.srcObject = stream;
            } else if (typeof element.mozSrcObject !== 'undefined') {
                element.mozSrcObject = stream;
            } else if (typeof element.src !== 'undefined') {
                element.src = window.URL.createObjectURL(stream);
            }
		}
		else if(this._isFirefox) {
			element.mozSrcObject = stream;
            element.play();
		}
		return element;	
	},

	RTCPeerConnection: function (stun, constraints) {
		if(this._isChrome) {
			return new window.webkitRTCPeerConnection(stun, constraints);
		} else if (this._isFirefox) {
			return new window.mozRTCPeerConnection(stun, constraints);
		}
	},

	RTCSessionDescription: function (sdp) {
		if(this._isChrome) {
			return new window.RTCSessionDescription(sdp);
		} else if (this._isFirefox) {
			return new window.mozRTCSessionDescription(sdp);
		}	
	},

	RTCIceCandidate: function (candidate) {
		if(this._isChrome) {
			return new window.RTCIceCandidate(candidate);
		} else if (this._isFirefox) {
			return new window.mozRTCIceCandidate(candidate);
		}	
	},

	RTCPeerConnectionConstraints: function() {
		if(this._isChrome) {
			return {
				optional: [
					{
						//DtlsSrtpKeyAgreement: true
					}
				]
			};
		} else if (this._isFirefox) {
			return {
				optional: [
					{
						RtpDataChannels: true
					}
				]
			};
		}	
	}




};