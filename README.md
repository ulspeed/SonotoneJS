sonotone
========

WebRTC library for easing WebRTC development


Description
===========

Sonotone is a WebRTC library that hides the client side WebRTC complexity

Sonotone allows to

- Call in Audio/Video one or several others browsers (Chrome and Firefox)

- Share your screen with several others browsers (from Chrome only)

- Share and call others browsers simultaneously

- Send file to one or several others browsers (from chrome only)

- Mute Audio/Video stream

- Get statistics (Bandwitdh, Noise detector)

Sonotone separates the Transport/SIG from the Media/PeerConnection by providing several ways to define the transport layer:

- Using a WebSocket server (like Node.js)

- Using an existing server that already provides a signaling


Documentation
=============

SonotoneJS documentation API can be found here: 

[SonotoneJS API Documentation](http://oanguenot.github.io/SonotoneJS/)


Demo
===============

Server side for the demo is based on node.js and use a WebSocket transport (See file server.js)

	// Using HTTP (limited to call)
	http://@server_address:8887

	// Using HTTPS (Full features)
	https://@server_address:8886


Compatibility
=============

Screensharing requires:
- Chrome (Not yet available in Firefox)
- HTTPS
- Chrome flag "Enable screen capture support in getUserMedia()" should be set


Continuous Integration
======================

SonotoneJS is built using Grunt.js

Unitary tests are developped using Sinon.js and Qunit

Coverage is done using Blanket


Versions
========

v0.4.6: Add the possibilities to have 2 PeerConnections per user (Screen + Video) 

v0.4.5: Add the off() method in order to remove the events subscribed. Add tests.

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
