include_file("resource://com.presonus.musicdevices/sdk/controlsurfacecomponent.js");
include_file("resource://com.presonus.musicdevices/sdk/controlsurfacedevice.js");
include_file("resource://com.presonus.musicdevices/sdk/musicprotocol.js");


class MK3BasicComponent extends PreSonus.ControlSurfaceComponent {
    onInit(hostComponent) {
        super.onInit(hostComponent);
        this.debugLog = true;
        this.model = hostComponent.model;
        let root = this.model.root;
        let paramList = hostComponent.paramList;
        this.shiftModifier = paramList.addParam("shiftModifier");
        this.sceneHold = paramList.addParam("sceneHold");
        this.log(`MK3BasicComponent onInit: ${this}`);
        
        Host.Signals.advise("MK3", this);  // Register "MK3" for "this" notifications?
        PreSonus.HostUtils.enableEditorNotifications (this, true);
        this.log("MK3BasicComponent notifications enabled/initialized");

        // Log the entire paramList object

        // Log the keys of paramList
        this.log(`MK3BasicComponent paramList keys: ${Object.keys(paramList)}`);
    }

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
        if(!subject || !msg)
            return;
        const arg0 = msg.getArg(0);
        if (arg0 !== null) {
            this.log(`Basic Component Notify: msgID:${msg.id} msgName:${arg0.name}`);
        } else {
            this.log(`Basic Component Notify: msgID:${msg.id}`);
        }
        if (msg.id == 'paramChanged') {
            if (this[msg.getArg(0).name])
                this[msg.getArg(0).name].setValue(msg.getArg(0).value, true);
        }
    }
}

// factory entry called by host
function createMK3BasicComponentInstance()
{
    return new MK3BasicComponent;
}
