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

TouchModHandler.prototype = new PreSonus.ControlHandler();
function TouchModHandler(name, channel)
{
    this.name = name;
    this.status = 0xB0;
    this.channel = channel - 1;
    this.address = 1;

    this.lastValue = 0;
    this.counter = 0;

    this.receiveMidi = function(status, address, value)
    {
        if( status != (this.status|this.channel) || address != this.address )
            return false;

        this.counter += ( value > this.lastValue ) ? 1 : -1;
        this.lastValue = value;

        if( Math.abs(this.counter) < 10 )
            return true;

        // Divide by 10 as counter could be positive or negative
        // Giving a result of 1 or -1
        this.updateValue(this.counter / 10);

        this.counter = 0;
        return true;
    }

};

TouchPitchHandler.prototype = new PreSonus.ControlHandler();
function TouchPitchHandler(name, channel)
{
    this.name = name;
    this.status = 0xE0;
    this.channel = channel - 1;

    this.lastValue = [0, 0, 0];
    this.counter = 0;

    this.receiveMidi = function(status, address, value)
    {
        if( status != (this.status|this.channel) )
            return false;

        let combined_value = (value << 7)|address;

        // We assume the pitch whell has been released as the resolution
        // stays the same when returning
        if( address == this.lastValue[0] )
        {
            this.counter = 0;
            return true;
        }

        let dir = ( combined_value > this.lastValue[1] ) ? 1 : -1;

        if( this.lastValue[2] != dir )
            this.counter = 0;
        else
            this.counter += dir;

        this.lastValue = [address, combined_value, dir];

        if( Math.abs(this.counter) < 8 )
            return true;

        // Divide by 10 as counter could be positive or negative
        // Giving a result of 1 or -1
        this.updateValue(this.counter / 8);

        this.counter = 0;
        return true;
    }
};

TouchDoubleTapHandler.prototype = new PreSonus.ControlHandler();
function TouchDoubleTapHandler(name, channel)
{
    this.name = name;
    this.status = 0xE0;
    this.channel = channel - 1;

    this.lastAddressValue = 0x00;
    this.touchStartTime = 0;
    this.touchEndTime = 0;

    this.tapCount = 0;
    this.time = 0;

    this.onIdle = function(time)
    {
        this.time = time;
    }

    this.receiveMidi = function(status, address, value)
    {
        if( status != (this.status|this.channel) )
            return false;

        if( this.lastAddressValue == 0x00 )
        {
            if( this.time - this.touchEndTime > 250 )
                this.tapCount = 0;
            this.touchStartTime = this.time;
        }

        if( address == 0x00 )
        {
            this.touchEndTime = this.time;
            if( this.touchEndTime - this.touchStartTime < 250 )
                this.tapCount++;
            else
                this.tapCount = 0;
        }

        this.lastAddressValue = address;
        if( this.tapCount >= 2 )
        {
            this.updateValue(1);
            this.tapCount = 0;
            return true;
        }
        return false;
    }
}

class LaunchKeyMK3ExtendedMidiDevice extends PreSonus.ControlSurfaceDevice {
    constructor() {
        super();
        this.handlers = {};
        this.idleListeners = [];
    }

    enableInControlMode(bool) {
        this.sendMidi(0x9F, 0x0C, bool ? 0x7F : 0x00);
    }

    onInit(hostDevice) {
        super.onInit(hostDevice);
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

    onMidiOutConnected(state) {
        super.onMidiOutConnected(state);

        if (state) {
            this.log("Starting LaunchKey MK3 Extended");
            // Reset Pads
            this.enableInControlMode(false);
            this.enableInControlMode(true);
            this.sendMidi(PreSonus.Midi.kNoteOff | 0xBF, 0x03, 0x01);
            this.hostDevice.invalidateAll();
        }
    }

    onExit() {
        // Transmit native mode off message
        // This is required to reset the device to a state where it can be used with other software
        // The user will have to power cycle the device to use it with Studio One again
        this.sendMidi(PreSonus.Midi.kNoteOff | 0xBF, 0x03, 0x01);
        this.enableInControlMode(false);
        super.onExit();
    }
}

// factory entry called by host
function createLaunchKeyMK3BasicDeviceInstance ()
{
    return new LaunchKeyMK3BasicDevice;
}
