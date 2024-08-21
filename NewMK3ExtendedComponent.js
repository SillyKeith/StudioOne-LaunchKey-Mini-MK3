include_file("resource://com.presonus.musicdevices/sdk/controlsurfacecomponent.js");
include_file("resource://com.presonus.musicdevices/sdk/musicprotocol.js");
include_file("Color.js");

const Effect = {
    NONE: 0,
    FLASH: 1,
    PULSE: 2
};

const kPadCount = 16;
const kBankCount = 8;
const kDefaultBankColor = "#00FFFF";
const kPadFocusOnColor = "orange";
const kPadFocusOffColor = "blue";
const kSceneButtonColor = "blue";
const kSSMButtonColor = "green";  // Stop/Solo/Mute button color
const kStepeditPadColor = "#AAAA00";
const kEventeditPadColor = "#AAAA00";
const kSetupPadColor = "#0000FF";
const kBankPadColor = "#00FF00";
const kHuiPadColor = "#38FFCC";
const kLoopeditPadColor = "aqua";

const kHuiModeMonitorColor = {
    color: '#00A9FF',
    backgroundColors: ['#00454F', '#00A9FF'],
    effect: Effect.NONE
};

const kHuiModeArmColor = {
    color: '#FF4C87',
    backgroundColors: ['#202020', '#FF4C87'],
    effect: Effect.PULSE
};

const kHuiModeSoloColor = {
    color: '#FFE126',
    backgroundColors: ['#392B00', '#FFE126'],
    effect: Effect.NONE
};

const kHuiModeMuteColor = {
    color: '#874CFF',
    backgroundColors: ['#0F0030', '#874CFF'],
    effect: Effect.NONE
};

let padRepeatRates = [
    PreSonus.NoteRepeat.k4thPpq,
    PreSonus.NoteRepeat.k8thPpq,
    PreSonus.NoteRepeat.k16thPpq,
    PreSonus.NoteRepeat.k32thPpq,
    PreSonus.NoteRepeat.k4thTPpq,
    PreSonus.NoteRepeat.k8thTPpq,
    PreSonus.NoteRepeat.k16thTPpq,
    PreSonus.NoteRepeat.k32thTPpq
];

var PadWorkflow;
(function (PadWorkflow) {
    /* These 3 are for when the user is in DRUM_LAYOUT mode */
    PadWorkflow[PadWorkflow["kPlay"] = 0] = "kPlay";
    PadWorkflow[PadWorkflow["kRepeatMenu"] = 1] = "kRepeatMenu";
    PadWorkflow[PadWorkflow["kRateTrigger"] = 2] = "kRateTrigger";
    /* The below are for when the user is in SESSION_LAYOUT mode */
    PadWorkflow[PadWorkflow["kStepEdit"] = 3] = "kStepEdit";
    PadWorkflow[PadWorkflow["kEventEdit"] = 4] = "kEventEdit";
    PadWorkflow[PadWorkflow["kSetup"] = 5] = "kSetup";
    PadWorkflow[PadWorkflow["kBank"] = 6] = "kBank";
    PadWorkflow[PadWorkflow["kHui"] = 7] = "kHui";
    PadWorkflow[PadWorkflow["kLoopEdit"] = 8] = "kLoopEdit";
    PadWorkflow[PadWorkflow["kRestorePlayMode"] = 9] = "kRestorePlayMode"; // This is also used as a nullhandler for kIdle scnario
    PadWorkflow[PadWorkflow["kLastPadMode"] = 9] = "kLastPadMode";
})(PadWorkflow || (PadWorkflow = {}));

/* The DevicePadMode enum is used to determine the layout of the pads on the device
*  These modes are native to the device and almost exclusively manually engaged by the user.
*  The only exception is the Drum Layout mode which is automatically engaged by the script at startup.
*/
var DevicePadMode;
(function (DevicePadMode) {
    DevicePadMode[DevicePadMode["DRUM_LAYOUT"] = 1] = "DRUM_LAYOUT";
    DevicePadMode[DevicePadMode["SESSION_LAYOUT"] = 2] = "SESSION_LAYOUT";
    DevicePadMode[DevicePadMode["SCALE_CHORDS"] = 3] = "SCALE_CHORDS";    // unused but here for MK3 49, 61, 80
    DevicePadMode[DevicePadMode["USER_CHORDS"] = 4] = "USER_CHORDS";     // unused but here for MK3 49, 61, 80
    DevicePadMode[DevicePadMode["CUSTOM_0"] = 5] = "CUSTOM_0";
})(DevicePadMode || (DevicePadMode = {}));

/* The DevicePotMode enum is used to determine what mode the pots are in. */
var DevicePotMode;
(function (DevicePotMode) {
    DevicePotMode[DevicePotMode["VOLUME"] = 1] = "VOLUME";
    DevicePotMode[DevicePotMode["DEVICE"] = 2] = "DEVICE";
    DevicePotMode[DevicePotMode["PAN"] = 3] = "PAN";
    DevicePotMode[DevicePotMode["SEND_A"] = 4] = "SEND_A";
    DevicePotMode[DevicePotMode["SEND_B"] = 5] = "SEND_B";
    DevicePotMode[DevicePotMode["CUSTOM_0"] = 6] = "CUSTOM_0";  // added this to remove error when selecting custom as 6 is returned, not 0
})(DevicePotMode || (DevicePotMode = {}));

/* The DeviceModes object combines both DevicePadMode and DevicePotMode. 
* Example usage:
*   DeviceModes.setPadMode(DevicePadMode.DRUM_LAYOUT);
*   DeviceModes.setPotMode(DevicePotMode.VOLUME);
*
*   console.log(DeviceModes.getPadMode()); // Output: 1
*   console.log(DeviceModes.getPotMode()); // Output: 1
*/
var DeviceModes = (function () {
    var currentPadMode = null;
    var currentPotMode = null;

    return {
        setPadMode: function (mode) {
            if (DevicePadMode[mode] !== undefined) {
                currentPadMode = mode;
            } else {
                throw new Error("Unsupported DevicePadMode");
            }
        },
        getPadMode: function () {
            return currentPadMode;
        },
        setPotMode: function (mode) {
            if (DevicePotMode[mode] !== undefined) {
                currentPotMode = mode;
            } else {
                throw new Error("Unsupported DevicePotMode");
            }
        },
        getPotMode: function () {
            return currentPotMode;
        }
    };
})();

class PadSectionElementConfig {
    constructor(name, element) {
        this.name = name;
        this.element = element;
        this.roles = [];
        this.rateTriggerActive = false;
    }
}

class PadSectionManager {
    constructor(parent) {
        this.padSectionConfigs = [];
        this.parent = parent;
        this.debugLog = false;
        this.currentPadMode = DevicePadMode.DRUM_LAYOUT; // We init to DRUM_LAYOUT on connect in onMidiOutConnected
        this.currentPotMode = DevicePotMode.PAN; // We init to PAN on connect in onMidiOutConnected
    }

    activate(element, role) {
        let handlerIndex = this.getHandlerIndexByElement(element, role);
        element.component.setActiveHandler(handlerIndex);
    }
    deactivate(element) {
        element.component.clearPadPressedState();
        let handlerIndex = this.getHandlerIndexByElement(element, PreSonus.PadSectionRole.kIdle);
        element.component.setActiveHandler(handlerIndex);
    }

    add(root) {
        this.padSectionConfigs.push(new PadSectionElementConfig("PadSection", root));
    }

    log(msg) {
        if (this.debugLog)
            this.parent.log("MK3.PadSectionManager:" + msg);
    }
}

class MK3ExtendedComponent extends PreSonus.ControlSurfaceComponent {
    onInit(hostComponent) {
        super.onInit(hostComponent);
        this.debugLog = false;
        let paramList = hostComponent.paramList;
        this.shiftModifierParam = paramList.addParam("shiftModifier");
        let root = this.hostComponent.model.root;
        this.pageConfigProvider = new PageConfigProvider();
        this.padSectionManager = new PadSectionManager(this);
        this.padSectionManager.add(root);
        this.padSectionManager.init();

    }
}