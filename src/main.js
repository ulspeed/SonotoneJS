var root = this;

 /**
 * Sonotone namespace.
 *
 * @namespace
 */

var Sonotone;

//Export module
if (typeof exports !== 'undefined') {
    Sonotone = exports;
} else {
    Sonotone = root.Sonotone = {};
}

/**
 * Version
 * 
 * @api public
 */

Sonotone.VERSION = '0.4.3';

/**
 * ID
 *
 * @api public
 */

Sonotone.ID = new Date().getTime();

/**
 * Debug
 * True to display debug logs
 *
 * @api public
 */

Sonotone.debug = false;

/**
 * Activate or not STUN
 * enableSTUN = false when using in an internal LAN
 * enableSTUN = true otherwise
 */

Sonotone.enableSTUN = true;

/**
 * Logger
 *
 * @api private
 */

Sonotone.log = function(cat, msg, arg) {

    if(Sonotone.debug) {

        var color = {
            "SONOTONE.IO": "orange",
            "LOCALMEDIA": "blue",
            "TRANSPORT": 'green',
            "PEERCONNECTION": 'Maroon',
            "REMOTEMEDIA": "MediumPurple",
            "TODO": "cyan",
            "DATACHANNEL": "Crimson",
            "CAPABILITIES": "black"
        };

        var time = new Date();

        if(arg !== undefined) {
            console.log("%c|'O~O'| " + time.toLocaleTimeString() + ":" + time.getMilliseconds() + " [" + cat + "] - " + msg + " | %O", "color:" + color[cat], arg);
        }
        else {
         console.log("%c|'O~O'| " + time.toLocaleTimeString() + ":" + time.getMilliseconds() + " [" + cat + "] - " + msg, "color:" + color[cat]);   
        }
    }
};

/**
 * Adapter function for Mozilla and Chrome
 *
 * Chrome 28+
 * Firefox 22+
 */

Sonotone.adapter = function() {

    if(navigator.mozGetUserMedia && window.mozRTCPeerConnection) {
        // Firefox
        Sonotone.getUserMedia = navigator.mozGetUserMedia.bind(navigator); 

        Sonotone.RTCPeerConnection = window.mozRTCPeerConnection; 

        Sonotone.RTCSessionDescription = window.mozRTCSessionDescription;
        Sonotone.RTCIceCandidate = window.mozRTCIceCandidate;

        Sonotone.constraints = {optional: [{RtpDataChannels: true}]};

        Sonotone.attachToMedia = function(element, stream) {
            element.mozSrcObject = stream;
            element.play();
        };

        Sonotone.STUN = {"iceServers": [{"url": "stun:stun.services.mozilla.com"}]};

    }
    else if (navigator.webkitGetUserMedia && window.webkitRTCPeerConnection) {
        // Chrome: can make call or Sharing
        Sonotone.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);

        Sonotone.RTCSessionDescription = window.RTCSessionDescription;
        Sonotone.RTCIceCandidate = window.RTCIceCandidate;

        Sonotone.RTCPeerConnection = window.webkitRTCPeerConnection;

        Sonotone.constraints = {optional: [{DtlsSrtpKeyAgreement: true}]};

        Sonotone.attachToMedia = function(element, stream) {
            if (typeof element.srcObject !== 'undefined') {
                element.srcObject = stream;
            } else if (typeof element.mozSrcObject !== 'undefined') {
                element.mozSrcObject = stream;
            } else if (typeof element.src !== 'undefined') {
                element.src = window.URL.createObjectURL(stream);
            } else {
                Sonotone.log("SONOTONE.IO", "Error attaching stream to HTML Element");
            }
        };

        Sonotone.STUN = {
            iceServers: [
                {
                    url: "stun:stun.l.google.com:19302"
                }
            ]
        };
    }
};

/**
* Merge media constraints
*
* @api private
*/

Sonotone.mergeConstraints = function(cons1, cons2) {
    var merged = cons1;
    for (var name in cons2.mandatory) {
      merged.mandatory[name] = cons2.mandatory[name];
    }
    merged.optional.concat(cons2.optional);
    return merged;
};

// Call the adapter
Sonotone.adapter();