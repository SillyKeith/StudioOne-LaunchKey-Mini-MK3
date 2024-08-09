include_file("resource://com.presonus.musicdevices/sdk/midiprotocol.js");
include_file("resource://com.presonus.musicdevices/sdk/controlsurfacedevice.js");
// include_file("Color.js");
include_file("MK3CommonUtil.js");

const kPadCount = 16;

/**
 * Class representing a Color LED Handler.
 * @extends PreSonus.ControlHandler
 */
class ColorLEDHandler extends PreSonus.ControlHandler {
    /**
     * Create a ColorLEDHandler.
     * @param {string} name - The name of the handler.
     * @param {number} id - The address of the MIDI message.
     * @param {number} status - The status byte for MIDI messages and controls the state of the LED.
     */
    constructor(name, id, status) {
        super();
        /**
         * @property {string} name - The name of the handler.
         */
        this.sendValue = function (value, flags) {
            let color = ColorUtil.fromValue(value);
            this.sendMidi(this.status | 1, this.id, color.r);
            this.sendMidi(this.status | 2, this.id, color.g * 0.8);
            this.sendMidi(this.status | 3, this.id, color.b * 0.7);
        };
        
        this.name = name;
        /**
         * @property {number} status - The status byte for MIDI messages.
         */
        this.status = status;
        /**
         * @property {number} id - The address of the MIDI message.
         */
        this.id = id;
        /**
         * @property {number} effect - The effect value.
         */
        this.effect = 0;
        /**
         * @property {number} state - The state of the handler.
         */
        this.state = 1;
        /**
         * @property {string} color - The color in hex format.
         * @default "#000000"
         */
        this.color = "#800080";  // Default color is black
        /**
         * @property {number} value - The value to send in MIDI messages.
         */
        this.value = 0x00;
        /**
         * @property {number} channel - The MIDI channel.
         * @default 10
         */
        this.channel = 10;
        /**
         * @property {boolean} debugLog - Flag to enable or disable debug logging.
         */
        this.debugLog = true;
    }
}

/* class ColorEffectHandler extends PreSonus.ControlHandler {
    constructor(name, handler) {
        super();
        this.name = name;
        this.handler = handler;
    }
    
    sendValue = function (value, flags) {
        this.handler.setEffect(value);
    };

    setEffect(_effect) {
        this.sendMidi(this.status, this.address, 0x00);
        this.effect = _effect;
        this.update();
    }
    update() {
        let midi = (this.state) ? this.value : 0x00;
        this.sendMidi(this.status | this.effect, this.address, midi);
    }
} 

class ColorStateHandler extends PreSonus.ControlHandler {
    constructor(name, handler) {
        super();
        this.name = name;
        this.handler = handler;
        this.handler.setState(0);
    }

    sendValue(value, flags) {
        this.handler.setState(value);
    }
}

 class ColorChannelHandler extends PreSonus.ControlHandler {
    constructor(name, channel, handler) {
        super();
        this.name = name;
        this.handler = handler;
        this.channel = channel;
    }

    sendValue(value, flags) {
        this.handler.setChannel(value);
    }
}

class MonoLEDHandler extends PreSonus.ControlHandler {
    constructor(name, address) {
        super();
        this.name = name;
        this.address = address;
        this.debugLog = true;
    }

    sendValue(_value, _flags) {
        this.value = _value;
        this.log(`MonoLEDHandler: Sending MIDI: 0xBF, ${this.address}, ${this.value}`);
        this.sendMidi(0xBF, this.address, this.value);
    }
} 

class ButtonHandler extends PreSonus.ControlHandler {
    constructor(name, status, address) {
        super();
        this.name = name;
        this.status = status;
        this.address = address;
    }
} 

 class ButtonHoldHandler extends PreSonus.ControlHandler {
    constructor(name, status, address) {
        super();
        this.name = name;
        this.status = status;
        this.address = address;
        this.altControl = null;

        this.timeout = 500;
        this.activeTime = 0;
        this.isPressed = false;
        this.isHeld = false;
    }

    onIdle(time) {
        if (!this.isPressed || this.isHeld)
            return;

        if (!this.activeTime)
            this.activeTime = time;

        if (time > this.activeTime + this.timeout) {
            this.updateValue(1);
            this.isHeld = true;
        }
    }

    bindControlHandler(control) {
        this.altControl = control;
    }

    reset() {
        this.isPressed = false;
        this.isHeld = false;
        this.activeTime = 0;
    }

    receiveMidi(status, address, value) {
        if (status != this.status || address != this.address)
            return false;

        // If the button press is release before reaching the timeout
        // then return false to allow another handler to handle the midi event
        if (!value && !this.isHeld) {
            this.altControl.updateValue(1);
            this.altControl.updateValue(0);
            this.reset();
            return true;
        }

        // Button value of 0 will be a release
        if (!value) {
            if (this.isHeld)
                this.updateValue(0);
            else
                this.altControl.updateValue(0);
            this.reset();
        } else {
            this.isPressed = true;
        }

        return true;
    }
} */

class MK3MidiDevice extends PreSonus.ControlSurfaceDevice {
// A Note On event enters DAW mode or enables the respective feature, 
// while a Note Off event exits DAW mode or disables the respective feature.
// When the DAW or DAW-like software recognizes the Launchkey [MK3] and connects to it,
// it should first enter DAW mode (send 9Fh 0Ch 7Fh), and then, if necessary, 
// enable the features needed.
// When the DAW or DAW-like software exits, it should exit from DAW mode on the 
// Launchkey [MK3] (send 9Fh 0Ch 00h) to return it to Standalone (MIDI) mode.
    enableInControlMode(bool) {
        this.sendMidi(0x9F, 0x0C, bool ? 0x7F : 0x00);
    }
    
    onInit(hostDevice) {  // hostDevice is used vs hostComponent 
        super.onInit(hostDevice);
        this.debugLog = true;
        this.log("MK3MidiDevice onInit");
    }
    onExit() {
        this.sendMidi(0xBF, 0x03, 0x01); // reset Pad mode to Drum Layout
        this.enableInControlMode(false); // Exit DAW mode
        super.onExit();
    }

    createHandler(name, attributes) {
        let className = attributes.getAttribute("class");
        let address = attributes.getAttribute("address");
        let status = attributes.getAttribute("status");
        //let channel = attributes.getAttribute("channel");
        let handler = null;
        //this.log(`Creating handler: ${className} for: ${name} with address: ${address} and status: ${status}`);
        if (className == "PadColorLEDHandler") {
            handler = new ColorLEDHandler(name, address, PreSonus.Midi.kNoteOn);
            this.log(`Creating PadColorLEDHandler for: ${name} with address: ${address} and status: ${status}`);
        }
        if (!handler)
            return false;
        
        // this.handlers[name] = handler;
        this.addHandler(handler);
        return true;
    }
        // this.log(`statusChannel: ${statusChannel}`);

            /* <Control name="pad[1]" type="trigger" options="receive">
                <MidiMessage status="NoteTrigger" address="#29" options="through" />
            </Control>
            <Control name="padLED[1]" type="rgb" options="transmit fastupdate"> 
                <Handler class="ColorLEDHandler" status="#9A" address="#29" />
            </Control>
            <Control name="padChannel[1]" options="transmit fastupdate"> 
                <Handler class="ColorChannelHandler" channel="10"/>
            </Control>
            <Control name="padEffect[1]" options="transmit fastupdate"> 
                <Handler class="ColorEffectHandler" />
            </Control>
            <Control name="padState[1]" options="transmit fastupdate"> 
                <Handler class="ColorStateHandler" />
            </Control> */

        /* switch (attributes.getAttribute("class")) {
            case "ColorLEDHandler":
                this.log(`Creating ColorLEDHandler for ${name} with address ${address} and status ${statusChannel}`);
                handler = new ColorLEDHandler(name, status, address, id);
                break;
            case "ColorEffectHandler":
                // The effect handler is a special handler that is used to set the effect of the pad LED
                // We associate the effect handler with the padLED name so that we can set the effect of the pad LED
                this.log(`Creating ColorEffectHandler for ${name} with address ${address} and status ${statusChannel}`);
                handler = new ColorEffectHandler(name, this.handlers[name.replace("Effect", "LED")]);
                break;
            case "ColorStatetHandler":
                // The effect handler is a special handler that is used to set the effect of the pad LED
                // We associate the effect handler with the padLED name so that we can set the effect of the pad LED
                this.log(`Creating ColorStatetHandler for ${name}`);
                handler = new ColorStateHandler(name, this.handlers[name.replace("State", "LED")]);
                break;
            case "ColorChannelHandler":
                // The effect handler is a special handler that is used to set the effect of the pad LED
                // We associate the effect handler with the padLED name so that we can set the effect of the pad LED
                this.log(`Creating ColorChannelHandler for ${name} with channel ${statusChannel}`);
                handler = new ColorChannelHandler(name, statusChannel, this.handlers[name.replace("Channel", "LED")]);
                break;
        }*/

    onMidiOutConnected(state) {
        super.onMidiOutConnected(state);
        if (state) {
            this.log("Device connected: MK3MidiDevice onMidiOutConnected");
            // Reset Pads
            // This is required to reset the pads to their default state on startup
            this.enableInControlMode(false); // Exit DAW mode
            this.enableInControlMode(true); // Enter DAW mode
            this.log(`Finished resetting and sending DAW mode signal`);
            this.sendMidi(0xBF, 0x03, 0x01); // set Pad mode to Drum Layout
            this.sendMidi(0xBF, 0x09, 0x03); // set Pot mode to Pan
            // this.sendMidi(0xBF, 0x0A, 0x01); // set Fader mode to Volume (Launchkey 49, 61 and 88 only).
            this.hostDevice.invalidateAll();
        }
    }
}
// factory entry called by host
function createMK3MidiDeviceInstance ()
{
    return new MK3MidiDevice;
}