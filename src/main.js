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
 * Is the browser audio/video compliant with WebRTC
 *
 * @api public
 */

Sonotone.isAudioVideoCompliant = false;

/**
 * Is the browser sharing compliant with WebRTC
 *
 * @api public
 */

Sonotone.isSharingCompliant = false;

/**
 * Is the browser able to view a desktop shared using WebRTC
 *
 * @api public
 */

Sonotone.isSharingViewerCompliant = false;

/**
 * Is the browser compliant with the DataChannel
 *
 * @api public
 */

Sonotone.isDataChannelCompliant = false;

/**
 * Browser detected: chrome, firefox or unknown
 *
 * @api public
 */

Sonotone.browser = "Unknown";

/**
 * Version of the browser detected: XX or Unkown
 *
 * @api public
 */

Sonotone.browserVersion = "Unknown";

/**
 * Is the protocol HTTPS used ?
 *
 * @api public
 */

Sonotone.isHTTPS = false;

/**
 *
 * WebRTC Statistics
 *
 * @api public
 */
 Sonotone.isStatsActivated = false;

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
            "DATACHANNEL": "Crimson"
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

    // Detect if HTTPS protocol is used
    Sonotone.isHTTPS = window.location.protocol === "http:" ? false : true;

    if(navigator.mozGetUserMedia && window.mozRTCPeerConnection) {
        // Firefox: Can make call but not sharing
        Sonotone.isAudioVideoCompliant = true;
        Sonotone.isSharingCompliant = false;
        Sonotone.isSharingViewerCompliant = true;
        Sonotone.isDataChannelCompliant = false;

        Sonotone.browser = "Firefox";

        Sonotone.browserVersion = parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);

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
        Sonotone.isAudioVideoCompliant = true;
       
        Sonotone.isSharingViewerCompliant = true;

        Sonotone.isSharingCompliant = true;

        Sonotone.browser = "Chrome";

        Sonotone.browserVersion = parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10);
        
        Sonotone.isDataChannelCompliant = false;

        if(Sonotone.browserVersion >= 31) {
            Sonotone.isDataChannelCompliant = true;
        }

        Sonotone.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);

        Sonotone.RTCSessionDescription = window.RTCSessionDescription;
        Sonotone.RTCIceCandidate = window.RTCIceCandidate;

        Sonotone.RTCPeerConnection = window.webkitRTCPeerConnection;

        Sonotone.constraints = {optional: [{DtlsSrtpKeyAgreement: true}]};

        // {RtpDataChannels: true }

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
    } else {
        // Others browsers: can do nothing
        Sonotone.isAudioVideoCompliant = false;
        Sonotone.isSharingCompliant = false;
        Sonotone.isSharingViewerCompliant = false;
        Sonotone.isDataChannelCompliant = false;
        Sonotone.log("SONOTONE.IO", "Started on a not compliant browser. Sorry you can't use sonotone.IO");
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