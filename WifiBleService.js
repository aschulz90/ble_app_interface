var MagicMirrorBleService = require('./MagicMirrorBleService.js');
var wpa_supplicant = require('wireless-tools/wpa_supplicant');
var iwlist = require('wireless-tools/iwlist');
var wpa_cli = require('wireless-tools/wpa_cli');
var zlib = require('zlib');

// remove some attributes, to reduce the size of the generated JSON string
function removeNetworkAttributes(network) {
	delete network.mode;
	delete network.frequency;
	delete network.quality;
	delete network.noise;
};

function removeStatusAttributes(status) {
	delete status.frequency;
	delete status.mode;
	delete status.key_mgmt;
	delete status.pairwise_cipher;
	delete status.group_cipher;
	delete status.wpa_state;
};

class WifiReadCharacteristic extends MagicMirrorBleService.Characteristic{
	constructor() {
		super({
			value: undefined,

			uuid: "35cd",

			properties : ['read'],

			onReadRequest: function(offset, callback) {
				
				console.log("Wifi read request " + offset);
				
				if(!offset) {
					this.value = {};
					this.pendingCallback = callback;
					
					wpa_cli.status('wlan0', this.networkStatusCallback);
				}
				else {
					callback(this.RESULT_SUCCESS, this.value.slice(offset));
				}
			},

			descriptors: [
				new MagicMirrorBleService.Descriptor({
					uuid: '2901',
					value: 'Get information about nearby wifi networks ant the current connection status.'
				})
			]	
		});
		
		this.networkStatusCallback = this.networkStatusCallback.bind(this);
		this.scanForNetworksCallback = this.scanForNetworksCallback.bind(this);
	}
	
	networkStatusCallback(err, status) {
		if(err) {
			console.log("WifiBleService - Error while getting wifi status: " + err);
			this.pendingCallback(this.RESULT_UNLIKELY_ERROR);
			this.value = null;
			this.pendingCallback = null;
			return;
		}
		
		removeStatusAttributes(status)
		this.value.status = status;
		
		iwlist.scan('wlan0', this.scanForNetworksCallback);
	}
	
	scanForNetworksCallback(err, networks) {
		if(err) {
			console.log("WifiBleService - Error while scanning for wifis: " + err);
			this.pendingCallback(this.RESULT_UNLIKELY_ERROR);
			this.value = null;
			this.pendingCallback = null;
			return;
		}
		
		console.log("WifiBleService - Scanned Networks: " + (networks || []).length);
		
		for(var i = 0; i < networks.length; i++) {
			removeNetworkAttributes(networks[i]);
		}
		
		this.value.availableNetworks = networks;
		
		// compress, because BLE only allows 512 byte per Read, and then callback
		zlib.gzip(new Buffer(JSON.stringify(this.value)), function (_, result) {
			this.value = result;
			this.pendingCallback(this.RESULT_SUCCESS, this.value);
			this.pendingCallback = null;
		}.bind(this));
	}
}

class WifiBleService extends MagicMirrorBleService {
	
	constructor(ble_helper) {
		
		super(ble_helper);
		
		this.module_name = 'wifi_info';
		
		var self = this;
		
		this.setOptions({
			uuid: '210F',
			characteristics: [
				new WifiReadCharacteristic(), 
				
				new MagicMirrorBleService.Characteristic({
					value : undefined,
					
					uuid : "36cd",
					
					properties : ['write'],
					
					onWriteRequest: function(data, offset, withoutResponse, callback) {
						console.log('WifiBleService - WriteCharacteristic write request: ' + data + ' ' + offset + ' ' + withoutResponse);
						this.value = data.toString();
						self.sendSocketNotification("WIFI_SERVICE_NOTIFY", this.value);
						callback(this.RESULT_SUCCESS);
					},
					
					descriptors: [
						new MagicMirrorBleService.Descriptor({
							uuid: '2901',
							value: 'Connect to a new wifi network.'
						})
					]
				})
			]
		});
	}
}

module.exports = WifiBleService;