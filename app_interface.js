/* Magic Mirror
 * Module: app_interface
 *
 * By Andreas Schulz https://github.com/aschulz90
 * MIT Licensed.
 */

Module.register("app_interface",{

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
		
		if (notification === "DOM_OBJECTS_CREATED") {
			this.sendNotification("BLE_SERVICE_ADD", "../app_interface/AppInterfaceBleService.js", this);
		}
	},
	
	// Override socket notification handler.
	socketNotificationReceived: function(notification, payload) {
		
		console.log("Received notification: " + notification + " (" + JSON.stringify(payload) + ")");
		
		this.updateDom();
	},

	// Override dom generator.
	getDom: function() {
		
		var wrapper = document.createElement("div");
		
		if(this.config.showInfo) {
			
			var message = document.createTextNode("App Interface");
			wrapper.appendChild(message);
		}

		return wrapper;
	}

});
