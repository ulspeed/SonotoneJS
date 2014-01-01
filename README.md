sonotone
========

WebRTC library for easing WebRTC development


Description
===========

Sonotone is a WebRTC library that hides the client side WebRTC complexity

Sonotone allows to

- Call one or several others browsers (Chrome and Firefox)

- Share your screen several others browsers (from Chrome only)

- Send file to one or several others browsers (from chrome only)

Sonotone separates the Transport/SIG from the Media/PeerConnection by providing several ways to define the transport layer:

- Using a WebSocket server (like Node.js)

- Using an existing server that already provides a signaling


Documentation
=============

SonotoneJS documentation API can be found here: 
[a link](http://oanguenot.github.io/SonotoneJS/)


Demo
===============

Server side for the demo is based on node.js and use a WebSocket transport (See file server.js)

1/ Install dependencies and start the server

	// Install dependencies
	npm install

	// Start the server
	node server

2/ Start the demo

	// Using HTTP (One-to-one call or call broadcasting)
	http://@server_address:8887

	// Using HTTPS (One-to-one screensharing or screen broadcasting)
	https://@server_address:8886

How to use Sonotone
===================

1/ Initialize your Sonotone

	// Create a new sonotone  
	var id= 'your user id';  
	var sono = new Sonotone.IO(id);  

	// Check if your browser is compliant for audio/video call
	if(Sonotone.isAudioVideoCompliant) {
		...
	}

	// Check if your browser is compliant for Desktop/Application sharing
	if(Sonotone.isSharingCompliant) {
		...
	}

	// Check if your are in HTTPS
	if(Sonotone.isHTTPS) {
		...
	}	

2/ Define and connect your transport

	// Define a WebSocket transport (eg: using Node.js)  
	sono.transport('websocket', {host: '<your_host>', port: '<your_port>'}).connect(); 

	//Or define your own transport
	sono.transport('remote', {
		sendCallback: <your_function_that_send_to_your_server>
		context: this
	}).connect(); 

3/ Listen to others peers

	sono.on('onPeerConnected', <your_callback_here>, this);
	sono.on('onPeerAlreadyConnected', <your_callback_here>, this);  
    sono.on('onPeerDisconnected', <your_callback_here>, this);  

4/ Accessing to your camera

	//When local stream is acquired
	sono.localMedia().on('onLocalStreamStarted', onLocalStreamStarted, this);
    
    // When local stream is released
    sono.localMedia().on('onLocalStreamEnded', onLocalStreamEnded, this);

    //When there is an error accessing to the camera
	sono.localMedia().on('onLocalStreamError', onLocalStreamError, this);

	// Try to access to your media
	// Format can be: 'qvga', 'qvga_16:9', 'vga', 'vga_16:9', 'cam', 'hd'
	sono.localMedia().acquire({
		audio:true, 
		video:true, 
		format: 'qvga_16:9'
	});

	// Display your local stream to your HTML Element
	function onLocalStreamStarted() {
		sono.localMedia().renderStream(document.getElementById('localVideo'));
	};

	// Reset your HTML Element
	function onLocalStreamEnded() {
        document.getElementById('localVideo').src = '';
    };

    // On Error on local stream
	function onLocalStreamError() {
        // Code 1: error from GetUserMedia
        // Code 2: Browser not compliant
    };

5/ Listen to remote

	// When remote stream is received
	sono.remoteMedia().on('onRemoteStreamStarted', onRemoteStreamStarted, this);
    
    // When remote stream is released
    sono.remoteMedia().on('onRemoteStreamEnded', onRemoteStreamEnded, this);

	// Display remote stream to your HTML Element
	function onRemoteStreamStarted(stream) {
        sono.remoteMedia().renderStream(document.getElementById('remoteVideo'));
    };

	// Reset your HTML Element
    function onRemoteStreamEnded() {
        document.getElementById('remoteVideo').src = '';
    }; 

6/ Call someone

	// Detect if remote accept your call
	sono.on('onCallAnswered', onCallAnswered, this);

	// Detect if connection is successfull (remote see the video/screen)
	sono.on('onCallStarted', onCallStarted, this);

	// userID has been received when listening to 'onPeerConnected' event
	sono.call(userID);

7/ Answer to a call

	// Listen to an incoming call
	sono.on('onCallOffered', onCallOffered, this);

	// Detect if connection is successfull (remote see the video/screen)
	sono.on('onCallStarted', onCallStarted, this);

	// Answer to the call
	function onCallReceived(fromID) {
        sono.answer(fromID);
    };

8/ Share your screen

	//When screen stream is acquired
	sono.localMedia().on('onLocalStreamStarted', onLocalStreamStarted, this);
    
    // When screen stream is released
    sono.localMedia().on('onLocalStreamEnded', onLocalStreamEnded, this);

    //When there is an error accessing to the screen
	sono.localMedia().on('onLocalStreamError', onLocalStreamError, this);

	// Start the screen capture
	sono.localMedia().acquireScreen();

	// Once Ok, you can call someone to share your screen with
	function onLocalStreamStarted() {
		sono.call(userID);
	};

	// On Error on local stream
	function onLocalStreamError() {
        // Code 1: Error from GetUserMedia
        // Code 2: Browser not compliant
        // Code 3: Not in HTTPS
    };

9/ Broadcast your video / screen

	// Once local video or screen is acquired
	sono.broadcastCall();


Others
======

By default, there is no log added to the console. To activate logs, you have to add the following command:

	Sonotone.debug = true;

Screensharing requires:
- Chrome (Not yet available in Firefox)
- HTTPS
- Chrome flag "Enable screen capture support in getUserMedia()" should be set


Versions
========

v0.4.5: Add the off() method in order to remove the events subscribed.
v0.4.4: Fix some issues with the demo
v0.4.3: DataChannel: Wait for ACK before sending the next part of the file
v0.4.1: Use chunk of 64ko to send files
v0.4.0: Introducing DataChannel

v0.3.4: Fix major issues on events subscriptions. Multi-party call supported.
v0.3.3: Manage multiple media streams (for conference). This first version limits to one remoteStream per peerConnection.
v0.3.2: Send events to application when transport is connected, on error or closed. New event for detecting already connected peers.
v0.3.1: Answer with audio/video if exists
v0.3.0: Update for Firefox 24

v0.2.9: Fix a lot of bugs around Firefox/Chrome interop
v0.2.5: Don't add/Send ICE Candidate when peer is already connected
v0.2.4: Fix RemoteTransport issue. Add new events when remote peer answers call and when call is established
v0.2.3: Fire events on when browser is not compliant and when not in HTTPS (for sharing)
v0.2.2: Detect when MediaStream end (Subscribe to MediaStream events)
v0.2.1: Allow to change the Local Stream quality
v0.2.0: Broadcast call (alpha version)

v0.1.2: Add the Remote Transport
v0.1.1: Add the possibility to share your screen to a remote peer (First version is limited to share your screen or share your video)
v0.1.0: Full example for single audio/video call between 2 browsers (Chrome/Firefox) using a Web Socket Transport