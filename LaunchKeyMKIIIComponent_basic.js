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
        this.log("notify function" + subject + ': ' + msg.id);
        if (msg.id == 'paramChanged') {
            if (this[msg.getArg(0).name])
                this[msg.getArg(0).name].setValue(msg.getArg(0).value, true);
            else if (this.modes.params[msg.getArg(0).name])
                this.modes.params[msg.getArg(0).name].setValue(msg.getArg(0).value, true);
            else {
                // Handle unknown parameter
            }
        } else {
            // Handle unknown notification
        }
    }
}

// factory entry called by host
function createLaunchKeyMK3BasicComponentInstance()
{
    return new LaunchKeyMK3BasicComponent;
}
