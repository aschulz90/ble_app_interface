var MagicMirrorBleService = require('../ble_service/MagicMirrorBleService.js');
var zlib = require('zlib');
var path = require("path");
var app = require("./../../js/app.js");

class AppInterfaceBleService extends MagicMirrorBleService {
	
	constructor(ble_helper) {
		
		super(ble_helper);
		
		this.module_name = 'app_interface';
		var self = this;
		
		var bleCharacteristics = [];
		
		var config = app.configInterface.getConfig();
		var moduleMap = {};
		var characteristicUuid = "ff00";
		
		for (var i = 0; i < config.modules.length; i++) {
			var module = config.modules[i];
			moduleMap[module.module] = characteristicUuid;
			
			console.log("Add module characteristic: " + module.module + " with UUID " + characteristicUuid);
		  
			var characteristic = new MagicMirrorBleService.Characteristic({
				value: undefined,

				uuid: characteristicUuid,

				properties : ['read', 'write'],
				
				onReadRequest: function(offset, callback) {
					
					console.log("Module read request " + this._module.module + " " + offset);
					
					if(!this.value) {
						this.value = new Buffer(JSON.stringify(this._module));
					}
					
					if(!offset) {
						console.log("Read config: " + JSON.stringify(JSON.parse(this.value.toString()), null, '\t'));
						callback(this.RESULT_SUCCESS, this.value);
					}
					else {
						callback(this.RESULT_SUCCESS, this.value.slice(offset));
					}
				},
				
				onWriteRequest: function(data, offset, withoutResponse, callback) {
					console.log('AppInterfaceBleService - WriteCharacteristic write request: ' + data + ' ' + offset + ' ' + withoutResponse);
					app.configInterface.replaceModuleConfig(this._index, data.toString());
					this.value = data;
					callback(this.RESULT_SUCCESS);
				},

				descriptors: [
					new MagicMirrorBleService.Descriptor({
						uuid: '2901',
						value: 'Read the config from the module ' + module.module + '.'
					})
				]	
			});
			
			characteristic._module = module;
			characteristic._index = i;
			bleCharacteristics.push(characteristic);
			
			characteristicUuid = new Number(parseInt(characteristicUuid, 16) + 1).toString(16);
		}
		
		bleCharacteristics.push(new MagicMirrorBleService.Characteristic({
			value: new Buffer(JSON.stringify(moduleMap)),

			uuid: "38cd",

			properties : ['read'],

			descriptors: [
				new MagicMirrorBleService.Descriptor({
					uuid: '2901',
					value: 'Read the current modules.'
				})
			]	
		})); 
		
		this.setOptions({
			uuid: '280F',
			characteristics: bleCharacteristics
		});
	}
}

module.exports = AppInterfaceBleService;