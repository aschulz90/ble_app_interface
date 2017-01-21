/* Magic Mirror
 * Module: ble_app_interface
 *
 * By Andreas Schulz https://github.com/aschulz90
 * MIT Licensed.
 */
var NodeHelper = require('node_helper');
var bleno = require('bleno');

module.exports = NodeHelper.create({

	services: [],
	serviceClasses: ["./AppInterfaceBleService", "./WifiBleService.js"],

	start: function () {
		console.log(this.name + ' helper started ...');
		
		// Once bleno starts, begin advertising our BLE address
		bleno.on('stateChange', function(state) {
			console.log('State change: ' + state);
			if (state === 'poweredOn') {
				bleno.startAdvertising('MagicMirror',['12ab']);
			} else {
				bleno.stopAdvertising();
			}
		}.bind(this));

		// Notify the console that we've accepted a connection
		bleno.on('accept', function(clientAddress) {
			console.log("Accepted connection from address: " + clientAddress);
			this.sendSocketNotification("DEVICE_CONNECTED", clientAddress);
		}.bind(this));
		 
		// Notify the console that we have disconnected from a client
		bleno.on('disconnect', function(clientAddress) {
			console.log("Disconnected from address: " + clientAddress);
			this.sendSocketNotification("DEVICE_DISCONNECTED", clientAddress);
		}.bind(this));

		// When we begin advertising, create a new service and characteristic
		bleno.on('advertisingStart', function(error) {
			if (error) {
				console.log("Advertising start error:" + error);
			} else {
				console.log("Advertising start success " + this.services);
				
				for(var i = 0; i < this.serviceClasses.length; i++) {
					var serviceClass = require(this.serviceClasses[i]);
					this.services.push(new serviceClass(this));
				}
				
				bleno.setServices(this.services);
			}
		}.bind(this));
	},
  
	socketNotificationReceived: function(notification, payload) {
		if(notification === "INIT") {
			console.log('Notification INIT in ble_app_interface received');
			return;
		}
    }
});