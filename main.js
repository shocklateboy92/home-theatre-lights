// add timestamps in front of log messages
require('console-stamp')(console, '[HH:MM:ss.l]');

const RestClient = require('./rest.js');
const nodecec = require("node-cec");

const NodeCec = nodecec.NodeCec;
const CEC = nodecec.CEC;

const cec = new NodeCec();

// Exit on SIGINT
process.on('SIGINT', () => {
    if (cec) {
        cec.stop();
    }

    process.exit();
});

// Event handling
cec.once('ready', client => {
    console.log('>>> Client Ready');
    RestClient.init();
});

let lastRequestTime = Date.now();
let lastKnownStatusIsOn = false;

const MS_IN_SEC = 1000;
const SECS_IN_MIN = 60;
const MIN_TIME_THRESHOLD = 30 * MS_IN_SEC;

// When we get any packet from the TV, query its power status
// This is rate limited to MIN_TIME_THRESHOLD.
function processTvPacket() {
    const currentTime = Date.now();
    if ((currentTime - lastRequestTime) > MIN_TIME_THRESHOLD) {
        lastRequestTime = currentTime;
        
        cec.sendCommand(0xf0, CEC.Opcode.GIVE_DEVICE_POWER_STATUS);
    }
}

/**
 * When we get the power status of the TV,
 *  if: - it's not already on
 *      - its last known status wasn't already ON
 *  we send the request to dim the lights.
 */
cec.on('REPORT_POWER_STATUS', (packet, status) => {
    // LOG the current power status, for debugging
    console.log(`REPORT_POWER_STATUS: (${status}), ${JSON.stringify(packet)}`);
    for (const k in CEC.PowerStatus) {
        if (status == CEC.PowerStatus[k]) {
            console.log(`\tStatus = ${k}`);
        }
    }

    if (status === CEC.PowerStatus.ON) {
        console.log(">>> Projector is ON. Doing the thing!");

        if (lastKnownStatusIsOn) {
            console.log("Last known projector status is on. Skipping to avoid duplicate");
            return;
        }

        RestClient.dimLights();
    } else {
        lastKnownStatusIsOn = false;
    }
});


// We have a watchdog in case we miss the last packet
// from the tv, so we eventually get the correct last
// known state.
function watchdog() {
    // If we already know the projector is off, then
    // the script is already primed.
    if (!lastKnownStatusIsOn) {
        return;
    }

    // Otherwise, we pretend the TV sent a packet
    console.log("Spoofing a fake tv packet in case we missed the last one");
    processTvPacket();
}
setInterval(watchdog, 2 * SECS_IN_MIN * MS_IN_SEC);

// Custom Event handler
function hijackEmitter(emitter) {
    var oldEmitter = emitter.emit;
    emitter.emit = function() {
        var emitArgs = arguments;

        for (var k in arguments) {
            if (arguments[k].source == 0) {
                // we got a packet from tv
                const packet = arguments[k];

                // look up what's going on
                for (var o in CEC.Opcode) {
                    if (CEC.Opcode[o] == packet.opcode) {
                        console.log(`${o}: ${JSON.stringify(packet)}`);
                    }
                }

                // process it
                processTvPacket(packet);
            }
        }

        oldEmitter.apply(emitter, arguments);
    };
}
hijackEmitter(cec);

// Start client
// -m  = start in monitor-mode
// -d8 = set log level to 8 (=TRAFFIC) (-d 8)
// -br = logical address set to `recording device`
cec.start('cec-client', '-m', '-d8', 'RPI');