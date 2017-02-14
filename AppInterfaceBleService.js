const MagicMirrorBleService = require('./MagicMirrorBleService.js');
const zlib = require('zlib');
const path = require("path");
const app = require("./../../js/app.js");
const exec = require("child_process").exec;
const simpleGit = require("simple-git");

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

function installModule(url, callback) {
	var self = this;

	simpleGit(path.resolve(__dirname + "/..")).clone(url, path.basename(url), function(error, result) {
		if (error) {
			console.log(error);
			callback(error);
		} else {
			var workDir = path.resolve(__dirname + "/../" + path.basename(url));
			exec("npm install", {cwd: workDir, timeout: 120000}, function(error, stdout, stderr)
			{
				if (error) {
					console.log(error);
					callback(error);
				} else {
					// success part
					callback();
				}
			});
		}
	});
}

function getMirrorSettings() {
	var config = app.persistentConfigInterface.getConfig();
	var settings = {};
	if(config.port) {
		settings.port = config.port;
	}
	if(config.address) {
		settings.address = config.address;
	}
	if(config.ipWhitelist) {
		settings.ipWhitelist = config.ipWhitelist;
	}
	if(config.zoom) {
		settings.zoom = config.zoom;
	}
	if(config.language) {
		settings.language = config.language;
	}
	if(config.timeFormat) {
		settings.timeFormat = config.timeFormat;
	}
	if(config.units) {
		settings.units = config.units;
	}
	if(config.electronOptions) {
		settings.electronOptions = config.electronOptions;
	}
	return settings;
}

class AppInterfaceBleService extends MagicMirrorBleService {
	
	constructor(ble_helper) {
		
		super(ble_helper);
		
		this.module_name = 'ble_app_interface';
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
				
				if(!offset) {
					console.log("Read module list: " + JSON.stringify(moduleList, null, '\t'));
					// compress, because BLE only allows 512 byte per Read, and then callback
					zlib.gzip(new Buffer(JSON.stringify(moduleList)), function (_, result) {
						this.value = result;
						callback(this.RESULT_SUCCESS, this.value);
					}.bind(this));
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
					"value": 'Read the current module list and remove and add modules.'
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
					var config = app.persistentConfigInterface.getConfig();
					console.log("Set Value to " + JSON.stringify(config.modules[index], null,'\t'));
					// compress, because BLE only allows 512 byte per Read, and then callback
					zlib.gzip(new Buffer(JSON.stringify(config.modules[index])), function (_, result) {
						this.value = result;
						callback(this.RESULT_SUCCESS);
					}.bind(this));
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
					console.log("Read default module list: " + JSON.stringify(getInstalledModules(),null,'\t'));
					// compress, because BLE only allows 512 byte per Read, and then callback
					zlib.gzip(new Buffer(JSON.stringify(getInstalledModules())), function (_, result) {
						this.value = result;
						callback(this.RESULT_SUCCESS, this.value);
					}.bind(this));
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
		
		bleCharacteristics.push(new MagicMirrorBleService.Characteristic({
			"value": undefined,

			"uuid": "41cd",

			"properties" : ['write', 'read'],
			
			"onReadRequest": function(offset, callback) {
				
				console.log("AppInterfaceBleService - Characteristic 41cd read request: " + offset);
				
				if(!offset) {
					var settings = getMirrorSettings();
					console.log("Read magic mirror settings: " + JSON.stringify(settings,null,'\t'));
					// compress, because BLE only allows 512 byte per Read, and then callback
					zlib.gzip(new Buffer(JSON.stringify(settings)), function (_, result) {
						this.value = result;
						callback(this.RESULT_SUCCESS, this.value);
					}.bind(this));
				}
				else {
					callback(this.RESULT_SUCCESS, this.value.slice(offset));
				}
			},
			
			"onWriteRequest": function(data, offset, withoutResponse, callback) {
				console.log('AppInterfaceBleService - Characteristic 40cd write request: ' + data + ' ' + offset + ' ' + withoutResponse);
				app.persistentConfigInterface.replaceConfigValues(data.toString());
				callback(this.RESULT_SUCCESS);
			},

			"descriptors": [
				new MagicMirrorBleService.Descriptor({
					"uuid": '2901',
					"value": 'Change MM config values'
				})
			]	
		}));
		
		bleCharacteristics.push(new MagicMirrorBleService.Characteristic({
			"value": undefined,

			"uuid": "42cd",

			"properties" : ['write'],
			
			"onWriteRequest": function(data, offset, withoutResponse, callback) {
				console.log("Execute query: " + data.toString());
				if(self.executeQuery(data.toString())) {
					callback(this.RESULT_SUCCESS);
				}
				else {
					callback(this.RESULT_UNLIKELY_ERROR);
				}
			},

			"descriptors": [
				new MagicMirrorBleService.Descriptor({
					"uuid": '2901',
					"value": 'Execute Queries'
				})
			]	
		}));
		
		bleCharacteristics.push(new MagicMirrorBleService.Characteristic({
			"value": undefined,

			"uuid": "43cd",

			"properties" : ['write'],
			
			"onWriteRequest": function(data, offset, withoutResponse, callback) {
				console.log("Install module: " + data.toString());
				installModule(data.toString(), function(error) {
					callback(error ? this.RESULT_UNLIKELY_ERROR : this.RESULT_SUCCESS);
				}.bind(this));
			},

			"descriptors": [
				new MagicMirrorBleService.Descriptor({
					"uuid": '2901',
					"value": 'Install modules'
				})
			]	
		}));
		
		this.setOptions({
			"uuid": '280F',
			"characteristics": bleCharacteristics
		});
	}
	
	//*** copied from MMM-Remote-Control
	executeQuery(query) {
		var opts = {timeout: 8000};
		
		function checkForExecError(error, stdout, stderr) {
			console.log(stdout);
			console.log(stderr);
			if (error) {
				console.log(error);
			}
		}
		
		if (query === "SHUTDOWN")
		{
			console.log("SHUTDOWN");
			exec("sudo shutdown -h now", opts, function(error, stdout, stderr){ checkForExecError(error, stdout, stderr); });
			return true;
		}
		else if (query === "REBOOT")
		{
			console.log("REBOOT");
			exec("sudo shutdown -r now", opts, function(error, stdout, stderr){ checkForExecError(error, stdout, stderr); });
			return true;
		}
		else if (query === "RESTART")
		{
			console.log("RESTART");
			exec("pm2 restart mm", opts, function(error, stdout, stderr){
				this.sendSocketNotification("RESTART");
				checkForExecError(error, stdout, stderr);
			});
			return true;
		}
		else if (query === "REFRESH")
		{
			console.log("REFRESH");
			this.sendSocketNotification("REFRESH");
			return true;
		}
		else if (query === "MONITORON")
		{
			console.log("MONITORON");
			exec("tvservice --preferred && sudo chvt 6 && sudo chvt 7", opts, function(error, stdout, stderr){ checkForExecError(error, stdout, stderr); });
			return true;
		}
		else if (query === "MONITOROFF")
		{
			console.log("MONITOROFF");
			exec("tvservice -o", opts, function(error, stdout, stderr){ checkForExecError(error, stdout, stderr); });
			return true;
		}
	}
}

module.exports = AppInterfaceBleService;