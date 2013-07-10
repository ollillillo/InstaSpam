// this file defines the extra javascript
// functions needed to :
// * trigger a file browser 
// * send files to PHP on your webserver
// * post images to a facebook user's photostream

var access_token = "ccd102092f4e27c282ed53a8302440cc";

XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
    function byteValue(x) {
        return x.charCodeAt(0) & 0xff;
    }
    var ords = Array.prototype.map.call(datastr, byteValue);
    var ui8a = new Uint8Array(ords);
    this.send(ui8a.buffer);
}

// sets up facebook
window.fbAsyncInit = function() {
    // init the FB JS SDK
    FB.init({
    // you must change the appId to the one you are given 
    // in your facebook account or it won't work! 
	appId      : '196152377211185',                        // App ID from the app dashboard
//	channelUrl : '', // Channel file for x-domain comms
	status     : true,                                 // Check Facebook Login status
	xfbml      : true                                  // Look for social plugins on the page
    });
    // Additional initialization code such as adding Event Listeners goes here

};

// Load the SDK asynchronously
(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/all.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


// this function is called by jquery
// when the document loads
$(document).ready(function(){
	// find an element with the id 'yada' and 
	// set up a function to call when that element gets 
	// clicked
	// yada is in 'index.html'
	// and we do this because mobile safari
	// has some restrictions about what we are allowed to trigger
	// programatically 
    $("#yada").click(function(){// when they click it
		fbLogin(function(){ // call fbLogin and tell it to call
	    	postToFB(); // this when it is ready!
		});
    });
});

// login to facebook
// this calls the fb api method 'login'
// which will popup a fb login window 
function fbLogin(callback){
    console.log("Logging in!");
    FB.login(function(response) {// do the following once login happens
    console.log("in the login callback!");
 	if (response.authResponse) {// check what happened
	    console.log("FB login worked!");
	    access_token =  FB.getAuthResponse()['accessToken'];// we'll need the access token later
            callback();
	} else {
	 	 alert("user login problem! check your app is not in sandbox mode");
	     console.log('User cancelled login or did not fully authorize.');
        }
    });
}


// grab image data from the canvas
// and send it to a NodeJS script
// which can save it to disk as an image
// since we can't write files directly from javascript...
function postToNode(){
    // from http://www.re-cycledair.com/html-5-canvas-saving-to-a-file-with-php
    // pull image data from Processing's canvas
    var imgDataURL = document.getElementById(getProcessingSketchId()).toDataURL();
	// send it to server side Node JS Javascript
    //THIS DOES NOT WORK.    
    $.post("/uploads", 
	 imgDataURL 
    , function(data) {
	// when we've sent it, pop up some messages
	alert("Image sent to server, and server responsed with : "+data);
	console.log("Server upload responded: "+data);
	postToFB(data);
    });
}

// here we use the facebook api to 
// post an image to the current fb user's photo 
// stream (look on the photos page of your profile...)
function postToFB(){
    console.log("posting to fb!");  
    //    fbLogin(function(){
    console.log("Logged into facebook!");
    // logi
    var data = document.getElementById(getProcessingSketchId()).toDataURL();
    var encodedPng = data.substring(data.indexOf(',') + 1, data.length);
    var decodedPng = Base64Binary.decode(encodedPng);
    FB.getLoginStatus(function(response) {
	  if (response.status === "connected") {	
		postImageToFacebook(response.authResponse.accessToken, "InstaSpam", "image/png", decodedPng, "Generated with InstaSpam");
	  } else if (response.status === "not_authorized") {
		 FB.login(function(response) {
			postImageToFacebook(response.authResponse.accessToken, "InstaSpam", "image/png", decodedPng, "Generated with InstaSpam");
		 }, {scope: "publish_stream"});
	  } else {
		 FB.login(function(response)  { 
			postImageToFacebook(response.authResponse.accessToken, "InstaSpam", "image/png", decodedPng, "");
		 }, {scope: "publish_stream"});
	  }
	 });
}    

function postImageToFacebook( authToken, filename, mimeType, imageData, message )
{
    // this is the multipart/form-data boundary we'll use
    var boundary = '----ThisIsTheBoundary1234567890';   
    // let's encode our image file, which is contained in the var
    var formData = '--' + boundary + '\r\n'
    formData += 'Content-Disposition: form-data; name="source"; filename="' + filename + '"\r\n';
    formData += 'Content-Type: ' + mimeType + '\r\n\r\n';
    for ( var i = 0; i < imageData.length; ++i )
    {
        formData += String.fromCharCode( imageData[ i ] & 0xff );
    }
    formData += '\r\n';
    formData += '--' + boundary + '\r\n';
    formData += 'Content-Disposition: form-data; name="message"\r\n\r\n';
    formData += message + '\r\n'
    formData += '--' + boundary + '--\r\n';
    
    var xhr = new XMLHttpRequest();
    xhr.open( 'POST', 'https://graph.facebook.com/me/photos?access_token=' + authToken, true );
    xhr.onload = xhr.onerror = function() {
        console.log( xhr.responseText );
    };
    xhr.setRequestHeader( "Content-Type", "multipart/form-data; boundary=" + boundary );
    xhr.sendAsBinary( formData );
};

// this function fires when the user selects a file.
// It uses a javascript FileReader object
// to read the file from the file system
// then it sends the data to Processing
// thanks: http://www.html5rocks.com/en/tutorials/file/dndfiles/
function fireOnFileSelect(evt){
    var f = evt.target.files[0]; // FileList object
    // Only process image files.
    if (!f.type.match('image.*')) {
	console.log("Not an image file, ignoring!");
	return;
    }
    var reader = new FileReader();
    
    // Closure to capture the file information.
    reader.onload = (function(theFile) {
        return function(e) {
	    var proc;
	    // get access to the Processing sketch as an addressable
	    // object called 'proc';
	    proc = Processing.getInstanceById(getProcessingSketchId());
	    // call a function in the Processing sketch:
	    // sending it the image data
	    proc.setImage(e.target.result);
	};
    })(f);
    
    // Read in the image file as a data URL.
    reader.readAsDataURL(f);
}

function setupFileListener(){
    document.getElementById('file').addEventListener('change', fireOnFileSelect, false);
}

function selectFile(){
    document.getElementById("file").click();
    console.log(document.getElementById("file"));
}


