var MagicMirrorBleService = require('./MagicMirrorBleService.js');
var zlib = require('zlib');
var path = require("path");
var app = require("./../../js/app.js");

function getInstalledModules() {
	var srcdir = __dirname + "/../";
	var fs = require('fs');
	
	var names = fs.readdirSync(srcdir);
	var modules = {};
	
	modules.custom = names.filter(function(name) {
		return fs.statSync(path.join(srcdir, name)).isDirectory() && name != "default" && name != "node_modules";
	});
	
	modules.default = require("./../default/defaultmodules.js");
	
	console.log("Installed modules: " + JSON.stringify(modules,null,'\t'));
	return modules;
}

class AppInterfaceBleService extends MagicMirrorBleService {
	
	constructor(ble_helper) {
		
		super(ble_helper);
		
		this.module_name = 'app_interface';
		var self = this;
		
		var bleCharacteristics = [];
		
		var config = app.persistentConfigInterface.getConfig();
		var moduleList = [];
		
		for (var i = 0; i < config.modules.length; i++) {
			var module = config.modules[i];
			moduleList.push(module.module);
		}
		
		bleCharacteristics.push(new MagicMirrorBleService.Characteristic({
			"value": undefined,

			"uuid": "38cd",

			"properties": ['read', 'write'],
			
			"onReadRequest": function(offset, callback) {
				
				console.log("AppInterfaceBleService - Characteristic 38cd read request: " + offset);
				
				this.value = new Buffer(JSON.stringify(moduleList));
				
				if(!offset) {
					console.log("Read module list: " + JSON.stringify(JSON.parse(this.value.toString()), null, '\t'));
					callback(this.RESULT_SUCCESS, this.value);
				}
				else {
					callback(this.RESULT_SUCCESS, this.value.slice(offset));
				}
			},
			
			"onWriteRequest": function(data, offset, withoutResponse, callback) {
				console.log('AppInterfaceBleService - Characteristic 38cd write request: ' + data + ' ' + offset + ' ' + withoutResponse);
				
				var parameter = data.toString().split('||');
				
				if(parameter.length < 2) {
					callback(this.RESULT_UNLIKELY_ERROR);
				}
				else {
					if(parameter[0] === "REPLACE" && !isNaN(new Number(parameter[1]))) {
						
						app.persistentConfigInterface.replaceModuleConfig(new Number(parameter[1]), parameter[2]);
						
						callback(this.RESULT_SUCCESS);
						return;
					}
					else if(parameter[0] === "REMOVE") {
						
						var index = new Number(parameter[1]);
						
						app.persistentConfigInterface.removeModuleConfig(index);
						moduleList.splice(index, 1);
						config.modules.splice(index, 1);
						
						callback(this.RESULT_SUCCESS);
						return;
					}
					
					callback(this.RESULT_UNLIKELY_ERROR);
				}
			},

			"descriptors": [
				new MagicMirrorBleService.Descriptor({
					"uuid": '2901',
					"value": 'Read the current modules and their values.'
				})
			]
		}));
		
		bleCharacteristics.push(new MagicMirrorBleService.Characteristic({
			"value": undefined,

			"uuid": "39cd",

			"properties": ['read', 'write'],
			
			"onReadRequest": function(offset, callback) {
				
				console.log("AppInterfaceBleService - Characteristic 39cd read request: " + offset);
				
				if(!this.value) {
					callback(this.RESULT_UNLIKELY_ERROR);
					return;
				}
				
				if(!offset) {
					console.log("Read module: " + this.value.toString());
					callback(this.RESULT_SUCCESS, this.value);
				}
				else {
					callback(this.RESULT_SUCCESS, this.value.slice(offset));
				}
			},
			
			"onWriteRequest": function(data, offset, withoutResponse, callback) {
				console.log('AppInterfaceBleService - Characteristic 39cd write request: ' + data + ' ' + offset + ' ' + withoutResponse);
				
				var index = new Number(data.toString());
				
				if(isNaN(index)) {
					callback(this.RESULT_UNLIKELY_ERROR);
				}
				else {
					console.log("Set Value to " + JSON.stringify(config.modules[index], null,'\t'));
					this.value = new Buffer(JSON.stringify(config.modules[index]));
					callback(this.RESULT_SUCCESS);
				}
			},

			"descriptors": [
				new MagicMirrorBleService.Descriptor({
					"uuid": '2901',
					"value": 'Read the current modules and their values.'
				})
			]
		}));
		
		bleCharacteristics.push(new MagicMirrorBleService.Characteristic({
			"value": undefined,

			"uuid": "40cd",

			"properties" : ['write', 'read'],
			
			"onReadRequest": function(offset, callback) {
				
				console.log("AppInterfaceBleService - Characteristic 40cd read request: " + offset);
				
				if(!offset) {
					this.value = new Buffer(JSON.stringify(getInstalledModules()));
					console.log("Read default module list: " + this.value.toString());
					callback(this.RESULT_SUCCESS, this.value);
				}
				else {
					callback(this.RESULT_SUCCESS, this.value.slice(offset));
				}
			},
			
			"onWriteRequest": function(data, offset, withoutResponse, callback) {
				console.log('AppInterfaceBleService - Characteristic 40cd write request: ' + data + ' ' + offset + ' ' + withoutResponse);
				app.persistentConfigInterface.addModuleConfig(data.toString());
				var module = JSON.parse(data.toString());
				config.modules.push(module);
				moduleList.push(module.module);
				callback(this.RESULT_SUCCESS);
			},

			"descriptors": [
				new MagicMirrorBleService.Descriptor({
					"uuid": '2901',
					"value": 'Add modules'
				})
			]	
		}));
		
		this.setOptions({
			"uuid": '280F',
			"characteristics": bleCharacteristics
		});
	}
}

module.exports = AppInterfaceBleService;