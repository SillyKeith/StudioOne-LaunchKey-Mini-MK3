// Used for: LaunchKey MK3 Basic Midi Device.  USB Launchkey Mini MK3 MIDI (port 1)

include_file("resource://com.presonus.musicdevices/sdk/midiprotocol.js");
include_file("resource://com.presonus.musicdevices/sdk/controlsurfacedevice.js");

class TouchModHandler extends PreSonus.ControlHandler {
    constructor(name, channel) {
        super();
        this.name = name;
        this.status = 0xB0;
        this.channel = channel - 1;
        this.address = 1;

        this.lastValue = 0;
        this.counter = 0;
    }

    receiveMidi(status, address, value) {
        if (status != (this.status | this.channel) || address != this.address)
            return false;

        this.counter += (value > this.lastValue) ? 1 : -1;
        this.lastValue = value;

        if (Math.abs(this.counter) < 10)
            return true;

        // Divide by 10 as counter could be positive or negative
        // Giving a result of 1 or -1
        this.updateValue(this.counter / 10);

        this.counter = 0;
        return true;
    }
}

class TouchPitchHandler extends PreSonus.ControlHandler {
    constructor(name, channel) {
        super();
        this.name = name;
        this.status = 0xE0;
        this.channel = channel - 1;
        this.lastValue = [0, 0, 0];
        this.counter = 0;
    }

    receiveMidi(status, address, value) {
        if (status != (this.status | this.channel))
            return false;

        let combined_value = (value << 7) | address;

        // We assume the pitch wheel has been released as the resolution
        // stays the same when returning
        if (address == this.lastValue[0]) {
            this.counter = 0;
            return true;
        }

        let dir = (combined_value > this.lastValue[1]) ? 1 : -1;

        if (this.lastValue[2] != dir)
            this.counter = 0;
        else
            this.counter += dir;

        this.lastValue = [address, combined_value, dir];

        if (Math.abs(this.counter) < 8)
            return true;

        // Divide by 8 as counter could be positive or negative
        // Giving a result of 1 or -1
        this.updateValue(this.counter / 8);

        this.counter = 0;
        return true;
    }
}

class TouchDoubleTapHandler extends PreSonus.ControlHandler {
    constructor(name, channel) {
        super();
        this.name = name;
        this.status = 0xE0;
        this.channel = channel - 1;

        this.lastAddressValue = 0x00;
        this.touchStartTime = 0;
        this.touchEndTime = 0;

        this.tapCount = 0;
        this.time = 0;
    }

    onIdle(time) {
        this.time = time;
    }

    receiveMidi(status, address, value) {
        if (status != (this.status | this.channel))
            return false;

        if (this.lastAddressValue == 0x00) {
            if (this.time - this.touchEndTime > 250)
                this.tapCount = 0;
            this.touchStartTime = this.time;
        }

        if (address == 0x00) {
            this.touchEndTime = this.time;
            if (this.touchEndTime - this.touchStartTime < 250)
                this.tapCount++;
            else
                this.tapCount = 0;
        }

        this.lastAddressValue = address;
        if (this.tapCount >= 2) {
            this.updateValue(1);
            this.tapCount = 0;
            return true;
        }
        return false;
    }
}

class MK3BasicDevice extends PreSonus.ControlSurfaceDevice {
    onInit(hostDevice) {
        super.onInit(hostDevice);
        this.debugLog = true;
        this.log("Oninit:  Keith MK3 Basic Midi Device");
    }

    createHandler(name, attributes) {
        // Create a handler for the given name and attributes
        let className = attributes.getAttribute("class");
        let address = attributes.getAttribute("address");
        let ch = parseInt(attributes.getAttribute("channel"));
        let handler = null;
        if (!handler)
            return false;
        switch (className) {
            case "TouchModHandler":
                handler = new TouchModHandler(name, ch);
                this.log(`Created TouchModHandler: handler.name: ${handler.name}`);
                break;
            case "TouchPitchHandler":
                handler = new TouchPitchHandler(name, ch);
                this.log(`Created TouchPitchHandler: handler.name: ${handler.name}`);
                break;
            case "TouchDoubleTapHandler":
                handler = new TouchDoubleTapHandler(name, ch);
                this.log(`Created TouchDoubleTapHandler: handler.name: ${handler.name}`);
                this.idleListeners.push(handler);
                break;
        }
        this.handlers[name] = handler;
        this.addReceiveHandler(handler);
        return true;
    }


    onMidiOutConnected(state) {
        super.onMidiOutConnected(state);
        if (state) {
            this.log("Starting Keith MK3 Basic Midi Device");
            this.sendMidi(0xBF, 0x03, 0x01); // Set LaunchKey MK3 Pad mode to Drum Layout mode
            //this.sendMidi(PreSonus.Midi.kNoteOff | 15, 0x00, 0x7F);
            this.hostDevice.invalidateAll();
        }
    }

    onExit() {
        this.sendMidi(0xBF, 0x03, 0x01); // Set LaunchKey MK3 Pad mode to Drum Layout mode
        this.sendMidi(PreSonus.Midi.kNoteOff | 15, 0x00, 0x00);
        super.onExit();
    }
}

// factory entry called by host
function createMK3BasicMidiDeviceInstance() {
    return new MK3BasicDevice();
}