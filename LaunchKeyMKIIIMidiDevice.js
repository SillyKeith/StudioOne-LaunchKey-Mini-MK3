/**
 * @Author: Sian Croser <Sian-Lee-SA>
 * @Date:   2020-05-27T21:56:33+09:30
 * @Email:  CQoute@gmail.com
 * @Filename: LaunchKeyMKIIIMidiDevice.js
 * @Last modified by:   Sian Croser <Sian-Lee-SA>
 * @Last modified time: 2020-05-28T11:05:58+09:30
 * @License: GPL-3
 */

// include SDK files from host
include_file("./resources/midiprotocol.js");
include_file("./resources/controlsurfacedevice.js");
include_file("Debug.js");
include_file("Color.js");

class ColorLEDHandler extends PreSonus.ControlHandler {
    constructor(name, status, address) {
        super();
        this.name = name;
        this.status = status;
        this.address = address;
        this.effect = 0;
        this.state = 1;
        this.color = undefined;
        this.value = 0x00;
    }

    setState(_state) {
        this.state = _state;
        this.update();
    }

    setEffect(_effect) {
        this.sendMidi(this.status, this.address, 0x00);
        this.effect = _effect;
        this.update();
    }

    sendValue(_value, _flags) {
        this.color = new Color(_value);
        this.value = this.color.midi;
        this.update();
    }

    update() {
        let midi = (this.state) ? this.value : 0x00;
        this.sendMidi(this.status | this.effect, this.address, midi);
    }
}

class ColorEffectHandler extends PreSonus.ControlHandler {
    constructor(name, handler) {
        super();
        this.name = name;
        this.handler = handler;
    }

    sendValue(_value, _flags) {
        this.handler.setEffect(_value);
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

class MonoLEDHandler extends PreSonus.ControlHandler {
    constructor(name, address) {
        super();
        this.name = name;
        this.address = address;
    }

    sendValue(_value, _flags) {
        this.value = _value;
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
}

class LaunchKeyMK3ExtendedMidiDevice extends PreSonus.ControlSurfaceDevice {
    constructor() {
        super();
        this.handlers = {};
        this.idleListeners = [];
    }
    // Per the Launchky MK3 Programmer's Reference Manual (https://fael-downloads-prod.focusrite.com/customer/prod/downloads/launchkey_mk3_programmer_s_reference_guide_v1_en.pdf),
    // the device must be set to InControl mode to enable the extended features. This is done by sending a MIDI message
    //
    //  The following MIDI events are used to set DAW mode:
    //      • Channel 16, Note 0Ch (12): DAW mode enable/disable.
    //      • Channel 16, Note 0Bh (11): Continuous control Touch event enable/disable.
    //      • Channel 16, Note 0Ah (10): Continuous control Pot Pickup enable/disable.
    // By default, upon entry to DAW mode, Continuous control Touch events are disabled, and Continuous control Pot Pickup is disabled.
    //
    // A Note On event enters DAW mode or enables the respective feature, while a Note Off event exits DAW mode or disables the respective feature.
    // When the DAW or DAW-like software recognizes the Launchkey [MK3] and connects to it, it should first enter DAW mode (send 9Fh 0Ch 7Fh), and then, if necessary, enable the features needed.
    //
    // When the DAW or DAW-like software exits, it should exit from DAW mode on the Launchkey [MK3] (send 9Fh 0Ch 00h) to return it to Standalone (MIDI) mode.
    //
    // DAW mode on: send 9Fh 0Ch 7Fh
    // DAW mode off: send 9Fh 0Ch 00h   -> returns to Midi Mode
    //    
    // bool will toggle on or off DAW mode based on current state of the device.
    // ?? is this required for the LaunchKey MK3? 
    enableInControlMode(bool) {
       this.sendMidi(0x9F, 0x0C, bool ? 0x7F : 0x00);
    }

    onInit(hostDevice) {
        super.onInit(hostDevice);
        this.debugLog = true;
    }

    createHandler(name, attributes) {
        const getAttr = (name) => {
            let attr = attributes.getAttribute(name);
            if (!attr) return null;
            
            if (typeof attr === 'string') return parseInt(attr.replace('#', '0x'));
            return attr;
        };

        let handler = null;
        switch (attributes.getAttribute("class")) {
            case "ColorLEDHandler":
                handler = new ColorLEDHandler(name, getAttr('status'), getAttr('address'));
                break;
            case "ColorEffectHandler":
                handler = new ColorEffectHandler(name, this.handlers[name.replace('Effect', 'LED')]);
                break;
            case "ColorStateHandler":
                handler = new ColorStateHandler(name, this.handlers[name.replace('State', 'LED')]);
                break;
            case "MonoLEDHandler":
                handler = new MonoLEDHandler(name, getAttr('address'));
                break;
            case "ButtonHoldHandler":
                handler = new ButtonHoldHandler(name, getAttr('status'), getAttr('address'));
                this.idleListeners.push(handler);
                this.addReceiveHandler(handler);
                break;
            case "ButtonHandler":
                handler = new ButtonHandler(name, getAttr('status'), getAttr('address'));
                let bind = attributes.getAttribute('bind');
                this.handlers[bind].bindControlHandler(handler);
                break;
        }

        if (!handler) return false;

        this.handlers[name] = handler;
        this.addHandler(handler);

        return true;
    }

    onIdle(time) {
        for (let i = 0; i < this.idleListeners.length; i++) {
            this.idleListeners[i].onIdle(time);
        }
    }
    
    //** Called by host when MIDI output is connected or disconnected. *//
    onMidiOutConnected(state) {
        super.onMidiOutConnected(state);

        if (state) {
            this.log("Starting LaunchKey MK3 Extended");
            // Reset Pads
            // This is required to diable the Launchkey's PAD mode by sending a Note Off message to 
            // Pad modes
            // Pad mode changes are reported or can be changed by the following MIDI event:
            //      • Channel 16 (MIDI status: BFh, [decimal 191] ), Control Change 03h (3)
            // The Pad modes are mapped to the following values:
            //      • 00h (0): Custom Mode 0
            //      • 01h (1): Drum layout
            //      • 02h (2): Session layout
            //      • 03h (3): Scale Chords
            //      • 04h (4): User Chords
            //      • 05h (5): Custom Mode 0
            //      • 06h (6): Custom Mode 1
            //      • 07h (7): Custom Mode 2
            //      • 08h (8): Custom Mode 3
            //      • 09h (9): Device Select
            //      • 0Ah (10): Navigation
            //
            this.enableInControlMode(false);
            this.enableInControlMode(true);
            this.sendMidi(PreSonus.Midi.kNoteOff | 0xBF, 0x03, 0x01);
            //this.sendMidi(PreSonus.Midi.kNoteOn | 15, 0x0C, 0x7F);  // DAW mode on, there's no need to set POT/PAD/DRUM mode too.
            this.hostDevice.invalidateAll();
        } else {
            this.log("Stopping LaunchKey MK3 Extended");
            this.sendMidi(PreSonus.Midi.kNoteOff | 15, 0x0C, 0x00);
        }
    }
    
    //** Called by host when device is being destroyed. *//
    onExit() {
        // Transmit native mode off message to reset back to Midi Mode
        // This is required to return the device to its default state
        // Documentation states that the following MIDI events are used to exit DAW mode: 9f 0C 00
        // Added "PreSonus.Midi.kNoteOff |" to the sendMidi call
        this.sendMidi(PreSonus.Midi.kNoteOff | 0xBF, 0x03, 0x01);
        this.enableInControlMode(false);
        this.log("Exiting LaunchKey MK3 Extended from LaunchKeyMK3ExtendedMidiDevice.js");
        //this.sendMidi(PreSonus.Midi.kNoteOff | 15, 0x0C, 0x00);  // DAW mode off
        super.onExit();
    }
}

// factory entry called by host
function createLaunchKeyMK3ExtendedDeviceInstance ()
{
    return new LaunchKeyMK3ExtendedMidiDevice;
}
