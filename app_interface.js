/* Magic Mirror
 * Module: app_interface
 *
 * By Andreas Schulz https://github.com/aschulz90
 * MIT Licensed.
 */

Module.register("app_interface",{

	connectedDeviceName : "",

	// Module config defaults.
	defaults: {
		showInfo : false
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);
		
		this.sendSocketNotification("INIT", "");
	},
	
	notificationReceived: function(notification, payload, sender) {
		
	},
	
	// Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
		
		console.log("Received notification: " + notification + " (" + JSON.stringify(payload) + ")");
		
		if(notification === "DEVICE_CONNECTED") {
			this.connectedDeviceName = payload;
		}
		else if(notification === "DEVICE_DISCONNECTED") {
			this.connectedDeviceName = "";
		}
		// copied from MMM-Remote-Control
		else if (notification === "REFRESH" ) {
            document.location.reload();
		}
		else if (notification === "RESTART") {
			setTimeout(function() {
				document.location.reload(); console.log('Delayed REFRESH');
			}, 60000);
		}
		
		this.updateDom();
	},

	// Override dom generator.
	getDom: function() {
		
		var wrapper = document.createElement("div");
		
		if(this.config.showInfo) {
			
			var message = document.createTextNode("App Interface");
			wrapper.appendChild(message);
			wrapper.appendChild(document.createElement("br"));
			
			var status = document.createTextNode("Connected Bluetooth Device: " + (this.connectedDeviceName ? this.connectedDeviceName : "None"));
			wrapper.appendChild(status);
			
			wrapper.className = "small normal";
		}

		return wrapper;
	}

});
