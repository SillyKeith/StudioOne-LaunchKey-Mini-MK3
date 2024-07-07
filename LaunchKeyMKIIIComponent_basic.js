/**
 * @Author: Sian Croser <Sian-Lee-SA>
 * @Date:   2020-05-27T21:56:33+09:30
 * @Email:  CQoute@gmail.com
 * @Filename: LaunchKeyMKIIIComponent.js
 * @Last modified by:   Keith Kepler <SillyKeith>
 * @Last modified time: 2024-05-27T21:56:33+09:30
 * @License: GPL-3
 */
// include SDK files from host
// include_file("resource://com.presonus.musicdevices/sdk/controlsurfacecomponent.js");
// include_file("resource://com.presonus.musicdevices/sdk/controlsurfacedevice.js");
include_file("./resources/controlsurfacecomponent.js");
include_file("./resources/controlsurfacedevice.js");
include_file("Debug.js");
include_file("Modes.js");

class LaunchKeyMK3BasicComponent extends PreSonus.ControlSurfaceComponent {
    onInit(hostComponent) {
        super.onInit(hostComponent);
        this.debugLog = true;
        this.interfaces = [Host.Interfaces.IObserver, Host.Interfaces.IParamObserver];

        this.model = hostComponent.model;

        let paramList = hostComponent.paramList;
        this.shiftModifier = paramList.addParam("shiftModifier");
        this.sceneHold = paramList.addParam("sceneHold");

        this.modes = new Modes(hostComponent);
        Host.Signals.advise("LaunchkeyMK3", this);
        this.log("LaunchKeyMK3BasicComponent initialized");
        //this.log("interface: " + this.interfaces + " paramList: " + paramList + " modes: " + this.modes + " model: " + this.model); 
    }

    /**
     * Handle the paramChanged event.
     * @param {object} param - The changed parameter.
     */
    paramChanged(param) {
        // Implementation needed if there's specific logic for paramChanged
    }

    /**
     * Handle the onSelectPressed event.
     * @param {boolean} state - The state of the select button.
     */
    onSelectPressed(state) {
        let commandName = this.shiftModifier.value ? "Cancel" : "Enter";
        Host.GUI.Commands.deferCommand("Navigation", commandName);
    }

    /**
     * Handle the notify event.
     * @param {object} subject - The subject of the notification.
     * @param {object} msg - The notification message.
     */
    notify(subject, msg) {
        let msgName = msg.getArg(0).name; // Added variable for msg.getArg(0).name
        let msgArg = msg.getArg(0).value; // Added variable for msg.getArg(0).value
        if (msg.id == 'paramChanged') {
            if (this[msgName])
                this[msgName].setValue(msgArg, true);
            else if (this.modes.params[msgName])
                this.modes.params[msgName].setValue(msgArg, true);
            else {
                // Handle unknown parameter
                this.log("Unknown parameter received " + subject + "msgName: " + this[msgName] + "msgArg: " + this[msgArg]);
            }
        } else {
            // Handle unknown notification
            this.log("Unknown non-parameter change event received " + subject + "msgName: " + this[msgName] + "msgArg: " + this[msgArg]);
        }
    }
}

// factory entry called by host
function createLaunchKeyMK3BasicComponentInstance()
{
    return new LaunchKeyMK3BasicComponent;
}
