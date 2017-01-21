var bleno = require('bleno');
var UuidUtil = require('./node_modules/bleno/lib/uuid-util.js');

class MagicMirrorBleService extends bleno.PrimaryService {	
	
	constructor(ble_helper) {
		// call super constructor without parameter to intialize this object
		super({});
		console.log("Creating MagicMirrorBleService with: " + ble_helper);
		this.service_node_helper = ble_helper;
		this.module_name = 'ble_app_interface';
	}
	
	setOptions(options) {
		this.uuid = UuidUtil.removeDashes(options.uuid);
		this.characteristics = options.characteristics || [];
	}
	
	sendSocketNotification(notification, payload) {
		this.service_node_helper.io.of(this.module_name).emit(notification, payload);
	}
}

module.exports = MagicMirrorBleService;
module.exports.Descriptor = bleno.Descriptor;
module.exports.Characteristic = bleno.Characteristic;