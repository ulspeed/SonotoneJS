module("Test for Chrome", {

	setup: function() {
		
		this.caps = {
			browser: "chrome",
			browserVersion: 31,
			canDoAudioVideoCall: true,
			canDoScreenSharing: true,
			canViewScreenSharing: true,
			canUseDataChannel: true,
			startedWithHTTPS: false
		};
	}
});

test("Test that there is no stream by default", function () {

	var localMedia = new Sonotone.IO.LocalMedia(this.caps);    

    equal(localMedia.streamVideo(), null, "No default video stream");
    equal(localMedia.streamScreen(), null, "No default screen stream");
    equal(localMedia.isCameraCaptured(), false, "No camera stream captured");
    equal(localMedia.isScreenCaptured(), false, "No screen stream captured");
    equal(localMedia.caps(), this.caps, "Caps passed are ok");
});


test("Test that aquire call the OK callback", function () {
    
	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, 'getUserMedia', function(c, callback, errcallback, context) {
		callback.call(this, {});
	});

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spy = sinon.spy();

    localMedia.on('onLocalVideoStreamStarted', spy, this);

    localMedia.acquire({video:true, audio: true, format:'cam'});

    ok(spy.called, "Callback is called");
    equal(spy.args.length, 1, "Callback is called with the stream");
    equal(typeof spy.args[0], 'object', "Callback is called with the stream");

});

