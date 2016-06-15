"use strict";

/*
*
*   BEWARE! 
*   Broadcast address in samsung_discovery.js is currently hardcoded
*   This is because netmask node js module isn't loaded by Homey
*
*/

module.exports.init = function(devices_data, callback) {
    Homey.log("init in driver.js started");

    // when the driver starts, Homey rebooted. Initialize all previously paired devices.
    devices_data.forEach(initDevice);

    // let Homey know the driver is ready
    callback();
};

module.exports.capabilities = {

	// "measure_temperature", "target_temperature", "thermostat_mode"
    measure_temperature: {
        get: function(device_data, callback) {
            //var device = devices[device_data.id];	
            callback(null, null);
        }
    },

    target_temperature: {
        set: function(device_data, temperature, callback) {
            var device = devices[device_data.id];
//            Homey.log("get meter_power "+ device.last_meter_power);
            callback(null, null);
        }
    },

    thermostat_mode: {
        set: function(device_data, callback) {
            //var device = devices[device_data.id];
            callback(null, null);
        }
    }
};

module.exports.renamed = function( device_data, new_name ) {
    Homey.log(devices[device_data.id].name + ' has been renamed to ' + new_name);
    devices[device_data.id].name = new_name;
//    Homey.log(devices[device_data.id].name);
  }

module.exports.deleted = function(device_data, callback) {
    Homey.log('Deleting ' + device_data.id);
    // clearInterval(intervalId[device_data.id]); //end polling of device for readings
    delete devices[device_data.id];
};

/**
 * Pair
 */
module.exports.pair = function (socket) {

    socket.on("discovery", function (settings, callback) {

/*
        var Wunderground = require('wundergroundnode');
        var wunderground;
        wunderground = new Wunderground(key);
*/
        var samsungAPI = require('samsung-airconditioner').API;
        var samsungairco;
        samsungairco = new samsungAPI();
        samsungairco.on('discover', function(aircon) {
        	callback(null, aircon)
        }).on('error', function(err) {
            console.log('discovery error: ' + err.message);
            callback(true, null);
        });
    })

    socket.on("authenticate", function (aircon, callback) {

        aircon.get_token(function(err, token) {
            if (!err) return console.log('login error: ' + err.message);
            callback(null, token);
            // remember token for next time!
        }).on('waiting', function() {
            console.log('please power on the device within the next 30 seconds');
        }).on('end', function() {
            console.log('aircon disconnected');
            callback(true, null)
        }).on('err', function(err) {
            console.log('aircon error: ' + err.message);
            callback(true, null)
        });

    });

	socket.on("validate_device", function (aircon, callback) {

		// Timeout for when connection fails
		var timeout = setTimeout(function () {
			callback(true, null);
		}, 10000);

	    aircon.login(token, function(err) {
	        if (err) return console.log('login error: ' + err.message);

            // Get temperature
            aircon.get_temperature(function(err, celcius) {
                if (!err && celcius) {
                    // Clear error callback
			        clearTimeout(timeout);
                } else {
                    callback(true, null);
                }
            });
	    });

		// Establish connection to client
		client.connect().then(function () {
			return [client.status(), client.pressure()];
		}).spread(function () {

			// Clear error callback
			clearTimeout(timeout);

			// Create id
			settings.id = new Buffer(settings.serialNumber + settings.accessKey).toString('base64');

			// Return settings
			callback(null, settings);
		}).catch(function () {

			// Request could not be made
			callback(true, null);
		});
	});

	// Add device to homey
	socket.on("add_device", function (device) {

		// Store client globally
		addOrUpdateClient(
			NefitEasyClient({
				serialNumber: device.data.serialNumber,
				accessKey: device.data.accessKey,
				password: device.data.password
			})
		);
	});
};

function initDevice(device_data) {

    Homey.log("entering initDevice");

	devices[device_data.id] = {
		id         : device_data.id,
		name       : device_data.name,
		smileIp    : device_data.smileIp,
		smileId    : device_data.smileId,
		last_meter_gas                    : 0,    //"meter_gas" (m3)
		last_measure_power                : 0,    //"measure_power" (W)
		last_meter_power                  : 0,    //"meter_power" (kWh)
		last_meter_power_peak             : 0,    //"meter_power_peak" (kWh) capability to be added
		last_meter_power_offpeak          : 0,    //"meter_power_offpeak" (kWh) capability to be added
		last_meter_power_peak_produced    : 0,    //"meter_power_peak_produced" (kWh) capability to be added
		last_meter_power_offpeak_produced : 0,    //"meter_power_offpeak_produced" (kWh) capability to be added
		last_measure_power_produced       : 0,    // "measure_power_produced" (W) capability to be added
		last_interval_timestamp           : "",   // e.g. "2016-05-31T17:45:00+02:00" timestamp of 5 minutes interval reading
    };

	//start polling device for readings every 10 seconds
    /* intervalId[device_data.id] = setInterval(function () {
      checkProduction(devices[device_data.id], function(response){
          //reserved for callback
        })
      }, 10000);
	  */
}