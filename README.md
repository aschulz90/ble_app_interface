# ble_app_interface

This is a [MagicMirror](https://github.com/MichMich/MagicMirror) module for advertising Ble-Services to modify certain aspects of the MagicMirror. Any Ble-capable device (smartphone, Raspberry Pi, etc) can connect to it and communicate with.

##Video:

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/hUUipBgShb4/0.jpg)](https://www.youtube.com/watch?v=hUUipBgShb4)

App can be found here: https://github.com/aschulz90/MagicMirrorApp

## Installation

1. Navigate into your MagicMirror's `modules` folder.
2. Clone repository with `git clone https://github.com/aschulz90/ble_app_interface.git`.
3. Run `npm install`
4. Install [persistent_config_interface](https://github.com/aschulz90/persistent_config_interface)
5. Run MagicMirror with sudo or configure your Rapsberry Pi according to [Bleno without root](https://github.com/sandeepmistry/bleno#running-without-rootsudo) (some functionality of the module requries root, but that is optional)

If you get an errormessage similiar to this one: `Module version mismatch. Expected 48, got 47.`, you need to rebuild bleno, because Electron is build against another Node version.
To do this:

1. cd into `MagicMirror/modules/ble_app_interface/node_modules/bleno`
2. run `npm rebuild --runtime=electron --target=USED_ELECTRON_VERSION --disturl=https://atom.io/download/atom-shell --abi=XX`, where `USED_ELECTRON_VERSION` is currently `1.4.7` and `XX` is the expected Node version number.

## Usage

### Config

Add this to your `config.js`

```javascript
{
    module: "ble_app_interface",
    position:"lower_third",
    config: {
      // showInfo: true
      // un-comment the above line, to show some debug information
    }
}
```

## Ble-Services

The name of the BLE-device, that you need to connect to is `MagicMirror`.

Two BLE-services are published: one for configuring the MagicMirror and one for configuring the wifi settings of the Raspberry Pi. The UUIDs of these services and their characteristics can be found below. 

**The Read-Operations of the characteristics GZIPs every response before returning it. So you need to decompress the response on the client, after reading a characteristic!**

### General MagicMirror Interface

#### Service

UUID | Description
------------ | -----------
0000280F-0000-1000-8000-00805f9b34fb | Contains characteristics for changing general MagicMirror settings and changing modules and their values.

#### Charcteristics

UUID | Description
---- | -----------
000038cd-0000-1000-8000-00805f9b34fb | Allows to read a list of currently used module names, and remove and add modules.

Operation | Usage
--- | ---
Read | Reading this characteristic returns a list of module names currently defined in the config file in JSON <br><br>**Example**: `"["alert", "updatenotification"]"`
Write | Writing to this characteristic allows to remove modules of change a modules config values.<br><br> **Example**:<br><dl><dd>- `"REMOVE||1"` removes the module at index `1` (as represented in the list read from this characteristic)</dd><dd>- `"REPLACE||0||{"module":"alert","position":"top_left"}"` replaces the config at index `0`(as represented in the list read from this characteristic) with `{"module":"alert","position":"top_left"}"` </dd></dl>

---

UUID | Description
---- | -----------
000039cd-0000-1000-8000-00805f9b34fb | Allows to read a modules complete config.

Operation | Usage
--- | ---
Read | Reading this characteristic returns the config (in JSON) of the module at the index, that was written to this characteristic before.
Write | Writing to this characteristic sets the index of the module, that gets returned when reading this characteristic.

---

UUID | Description
---- | -----------
000040cd-0000-1000-8000-00805f9b34fb | Allows to read the installed modules list and add new modules to the config.

Operation | Usage
--- | ---
Read | Reading this characteristic returns a list of name from modules, that are currently installed (not just defined in the config) in JSON.
Write | Writing to this characteristic allows to install modules by name. <br><br>**Example**<br> `"alert"` adds the alert module to the config.

---

UUID | Description
---- | -----------
000041cd-0000-1000-8000-00805f9b34fb | Allows to read MagicMirrors config values and modify them.

Operation | Usage
--- | ---
Read | Reading this characteristic returns the values defined in the config (without the module list) in JSON.
Write | Writing to this characteristic allows to change MagicMirrors config values. <br><br>**Example**<br> `"{"port":"8080", "language":"en"}"` changes the port and language in the config.

---

UUID | Description
---- | -----------
000042cd-0000-1000-8000-00805f9b34fb | Allows to execute certain commands on the MagicMirror (see [MMM-Remote-Control](https://github.com/Jopyth/MMM-Remote-Control#list-of-actions)).

Operation | Usage
--- | ---
Write | Writing to this characteristic executes the written command. <br><br>**Allowed**:<br>`SHUTDOWN`, `REBOOT`, `RESTART`, `REFRESH`, `MONITORON`, `MONITOROFF`

### Raspberry Pi Wifi Settings

#### Service

UUID | Description
------------ | -----------
0000210F-0000-1000-8000-00805f9b34fb | Contains a characteristic for getting nearby wifi networks and connecting to one.

#### Characteristic

UUID | Description
---- | -----------
000041cd-0000-1000-8000-00805f9b34fb | Allows to read nearby wifi networks and connect to one.

Operation | Usage
--- | ---
Read | Reading this characteristic returns a list of neabry wifi networks and the currently connected one in JSON. <br><br> **Example**:<br> `"{"ssid":"bla","address":"XY:12:34:56"}"`
Write | Writing to this characteristic allows to permanently connect to a wifi network. <br><br>**Example**<br> `"{"ssid":"bla", "passphrase":"123456"}"` connects the Raspberry Pi to the network `bla` and uses the passphase `123456`

## License

MIT License

Copyright (c) 2017 Andreas Schulz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
