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
const MS_IN_SEC = 1000;
const MIN_TIME_THRESHOLD = 30 * MS_IN_SEC;

function processTvPacket(packet) {
    const currentTime = Date.now();
    if ((currentTime - lastRequestTime) > MIN_TIME_THRESHOLD) {
        lastRequestTime = currentTime;
        
        cec.sendCommand(0xf0, CEC.Opcode.GIVE_DEVICE_POWER_STATUS);
    }
}

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
        RestClient.dimLights();
    }
});

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