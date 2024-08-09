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
//include_file("./resources/midiprotocol.js");
//include_file("./resources/controlsurfacedevice.js");
include_file("resource://com.presonus.musicdevices/sdk/controlsurfacedevice.js");
include_file("resource://com.presonus.musicdevices/sdk/midiprotocol.js");
//include_file("Debug.js");
include_file("Color.js");

class ColorLEDHandler extends PreSonus.ControlHandler {
    constructor(name, status, address) {
        super();
        this.name = name;
        this.status = status;
        this.address = address;
        this.effect = 0;
        this.state = 0;
        this.color = new Color(0);  // Default color is black
        this.value = 0;
        this.debugLog = true;
    }

    setState(_state) {
        //this.log(`setState received: ${_state}`);
        if (this.state !== _state) { // Added a check to update only if the state has changed.
            this.state = _state;
            this.update();
        }
    }

    setEffect(_effect) {
        //this.log(`setEffect received: ${_effect}`);
        if (this.effect !== _effect) { // Added a check to update only if the effect has changed.
            this.effect = _effect; // moved the sendMidi call to the update method for fewer calls.
            this.update();
        }
    }

    sendValue(_value, _flags) {
        //this.log(`sendValue received: ${_value}`);
        if (!this.color.equals(new Color(_value))) { // added a .equals method to the Color class
            const newColor = new Color(_value);
            this.log(`Setting color: ${newColor}`);
            this.color = newColor;
            this.value = this.color.midi;
            this.update();
        }
    }

    update() {
        const midi = this.state ? this.value : 0x00;
        this.log(`Sending MIDI: ${this.status | this.effect}, ${this.address}, ${midi}`);
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
        this.debugLog = true;
    }

    sendValue(_value, _flags) {
        this.value = (_value === undefined) ? 0 : _value; // Added a undefined check to set the value to 0 if undefined.
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
}

class LaunchKeyMK3ExtendedMidiDevice extends PreSonus.ControlSurfaceDevice {
    constructor() {
        super();
        this.handlers = {};
        this.idleListeners = [];
        this.debugLog = true;  // Set to true to enable debug logging
    }

    enableInControlMode(bool) {
        this.sendMidi(0x9F, 0x0C, bool ? 0x7F : 0x00);
    }

    onInit(hostDevice) {
        super.onInit(hostDevice);
        this.log(`Inside onInit Midi Extended`);
        
        // Log what methods and properties are available on the host device
        //const presonusComponent = this.hostDevice;
        //this.log(`Component Type: ${presonusComponent.constructor.name}`);
        //this.log(`Component Properties: ${JSON.stringify(presonusComponent, null, 2)}`);
        //this.log(`Component Prototype Methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(presonusComponent))}`);

        // Inspect each prototype method
        //const prototypeMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(presonusComponent));
        //prototypeMethods.forEach(method => {
        //    if (typeof presonusComponent[method] === 'function') {
        //        this.log(`Method: ${method}`);
        //        try {
        //            this.log(`Method Details: ${presonusComponent[method].toString()}`);
        //        } catch (e) {
        //            this.log(`Method Details: [native code]`);
        //        }
        //    }
        //});
    }

    createHandler(name, attributes) {
        //this.log(`Inside createHandler Midi Extended`);
        const getAttr = (name) => {
            let attr = attributes.getAttribute(name);
            if (!attr) return null;
            //this.log(`We might modify an attribute if we find #- name:${name} attr:${attr}`);
            if (typeof attr === 'string') return parseInt(attr.replace('#', '0x'));
            return attr;
        };

        let handler = null;
        switch (attributes.getAttribute("class")) {
            case "ColorLEDHandler":
                handler = new ColorLEDHandler(name, getAttr('status'), getAttr('address'));
                //this.log(`Creating ColorLEDHandler: ${name} Class: ${attributes.getAttribute("class")} handler.name: ${handler.name} handler.status: ${handler.status} handler.address: ${handler.address}`);
                break;
            case "ColorEffectHandler":
                handler = new ColorEffectHandler(name, this.handlers[name.replace('Effect', 'LED')]);
                //this.log(`Creating ColorEffectHandler: ${name} Class: ${attributes.getAttribute("class")} handler.name: ${handler.name} handler.handler: ${handler.handler}`);
                break;
            case "ColorStateHandler":
                handler = new ColorStateHandler(name, this.handlers[name.replace('State', 'LED')]);
                //this.log(`Creating ColorStateHandler: ${name} Class: ${attributes.getAttribute("class")} handler.name: ${handler.name} handler.handler: ${handler.handler}`);
                break;
            case "MonoLEDHandler":
                handler = new MonoLEDHandler(name, getAttr('address'));
                //this.log(`Creating MonoLEDHandler: ${name} Class: ${attributes.getAttribute("class")} handler.name: ${handler.name} handler.address: ${handler.address}`);
                break;
            case "ButtonHoldHandler":
                handler = new ButtonHoldHandler(name, getAttr('status'), getAttr('address'));
                //this.log(`Creating ButtonHoldHandler: ${name} Class: ${attributes.getAttribute("class")} handler.name: ${handler.name} handler.status: ${handler.status} handler.address: ${handler.address}`);                
                this.idleListeners.push(handler);
                this.addReceiveHandler(handler);
                break;
            case "ButtonHandler":
                handler = new ButtonHandler(name, getAttr('status'), getAttr('address'));
                //this.log(`Creating ButtonHandler: ${name} Class: ${attributes.getAttribute("class")} handler.name: ${handler.name} handler.status: ${handler.status} handler.address: ${handler.address}`);
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

    onMidiOutConnected(state) {
        super.onMidiOutConnected(state);

        if (state) {
            this.log("Starting LaunchKey MK3 Extended");
            // Reset Pads
            // This is required to reset the pads to their default state
            this.enableInControlMode(false);
            this.enableInControlMode(true);
            this.sendMidi(PreSonus.Midi.kNoteOff | 0xBF, 0x03, 0x01);
            this.hostDevice.invalidateAll();
        }
    }

    onExit() {
        // Transmit native mode off message
        // This is required to return the device to its default state
        // Added "PreSonus.Midi.kNoteOff |" to the sendMidi call
        this.sendMidi(PreSonus.Midi.kNoteOff | 0xBF, 0x03, 0x01);
        this.enableInControlMode(false);
        super.onExit();
    }
}

// factory entry called by host
function createLaunchKeyMK3ExtendedDeviceInstance ()
{
    return new LaunchKeyMK3ExtendedMidiDevice;
}
