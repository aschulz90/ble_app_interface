/* Magic Mirror
 * Module: ble_service
 *
 * By Andreas Schulz https://github.com/aschulz90
 * MIT Licensed.
 */
var NodeHelper = require('node_helper');

module.exports = NodeHelper.create({

	start: function () {
		console.log(this.name + ' helper started ...');
		
		
	},
  
	socketNotificationReceived: function(notification, payload) {
		if(notification === "INIT") {
			console.log('Notification INIT in app_interface received');
			return;
		}
    }
});