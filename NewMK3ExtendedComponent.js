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
        this.debugLog = true;
        this.activeMusicInputID = PadSectionID.kNone;
        this.currentPadMode = DevicePadMode.DRUM_LAYOUT; // We init to DRUM_LAYOUT on connect in onMidiOutConnected
        this.currentPotMode = DevicePotMode.PAN; // We init to PAN on connect in onMidiOutConnected
    }
    getRateTriggerState(name) {
        for (let i = 0; i < this.padSectionConfigs.length; i++) {
            let config = this.padSectionConfigs[i];
            if (config.name == name)
                return config.rateTriggerActive;
        }
        return false;
    }
    setRateTriggerState(name, state) {
        for (let i = 0; i < this.padSectionConfigs.length; i++) {
            let config = this.padSectionConfigs[i];
            if (config.name == name)
                config.rateTriggerActive = state;
        }
        return false;
    }
    getHandlerIndexByName(name, role) {
        for (let i = 0; i < this.padSectionConfigs.length; i++) {
            let config = this.padSectionConfigs[i];
            if (config.name == name)
                return config.roles.indexOf(role);
        }
        return -1;
    }
    getHandlerIndexByElement(element, role) {
        for (let i = 0; i < this.padSectionConfigs.length; i++) {
            let config = this.padSectionConfigs[i];
            if (config.element == element)
                return config.roles.indexOf(role);
        }
        return -1;
    }
    log(msg) {
        if (this.debugLog)
            this.parent.log("MK3.PadSectionManager:" + msg);
    }
    setupKeyboardModeSettings(c, supportKeyboardLayout) {
        c.setPadColoringSupported(true);
        for (let i = 0; i < PadSectionConfig.kPadSnapColors.length; i++)
            c.addPadPaletteColor(PadSectionConfig.kPadSnapColors[i]);
        let kbSettings = c.keyboardModeSettings;
        let colors = PadSectionConfig.kKeyboardModeColors;
        kbSettings.whiteKeyColor = colors[0];
        kbSettings.blackKeyColor = colors[1];
        kbSettings.octave0Color = colors[2];
        kbSettings.octave1Color = colors[3];
        kbSettings.octave2Color = colors[4];
        kbSettings.octave3Color = colors[5];
        kbSettings.octaveShiftEnabled = false;
        kbSettings.supportKeyboardLayout = supportKeyboardLayout;
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
        const kXmlElements = [
            PadSectionID.kDrumMode,
            PadSectionID.kSessionMode
        ];
        for (let i = 0; i < kXmlElements.length; i++) {
            let name = kXmlElements[i];
            let element = root.find(name);
            if (!element)
                return;
            let component = element.component;
            if (!component)
                return;
            switch (name) {
                case PadSectionID.kDrumMode:
                    {
                        let config = new PadSectionElementConfig(name, element);
                        config.roles = [
                            PreSonus.PadSectionRole.kMusicInput,
                            PreSonus.PadSectionRole.kIdle,
                            PreSonus.PadSectionRole.kRateTrigger
                        ];
                        this.setupKeyboardModeSettings(component, true);
                        this.addHandlers(component, config.roles);
                        this.padSectionConfigs.push(config);
                        break;
                    }
                case PadSectionID.kSessionMode:
                    {
                        let config = new PadSectionElementConfig(name, element);
                        config.roles = [
                            PreSonus.PadSectionRole.kMusicInput,
                            PreSonus.PadSectionRole.kIdle,
                            PreSonus.PadSectionRole.kRateTrigger
                        ];
                        this.setupKeyboardModeSettings(component, false);
                        this.addHandlers(component, config.roles);
                        this.padSectionConfigs.push(config);
                        break;
                    }
                case PadSectionID.kDualStep:
                    {
                        let config = new PadSectionElementConfig(name, element);
                        config.roles = [
                            PreSonus.PadSectionRole.kStepEdit,
                            PreSonus.PadSectionRole.kStepFocus,
                            PreSonus.PadSectionRole.kIdle
                        ];
                        this.setupKeyboardModeSettings(component, false);
                        this.addHandlers(component, config.roles);
                        this.padSectionConfigs.push(config);
                        break;
                    }
            }
        }
    }
    addHandlers(padSectionComponent, roles) {
        let handlerIndex = 0;
        for (let roleIndex = 0; roleIndex < roles.length; roleIndex++) {
            let role = roles[roleIndex];
            switch (role) {
                case PreSonus.PadSectionRole.kMusicInput:
                    {
                        padSectionComponent.addHandlerForRole(role);
                        let handler = padSectionComponent.getHandler(handlerIndex);
                        this.configureMusicInputHandler(handler);
                        handlerIndex++;
                        break;
                    }
                case PreSonus.PadSectionRole.kStepEdit:
                case PreSonus.PadSectionRole.kStepFocus:
                    {
                        padSectionComponent.addHandlerForRole(role);
                        handlerIndex++;
                        break;
                    }
                case PreSonus.PadSectionRole.kIdle:
                    {
                        padSectionComponent.addNullHandler();
                        handlerIndex++;
                        break;
                    }
                case PreSonus.PadSectionRole.kRateTrigger:
                    {
                        padSectionComponent.addHandlerForRole(role);
                        padSectionComponent.getHandler(handlerIndex).setPadColor(kRateTriggerColor);
                        for (let i = 0; i < padRepeatRates.length; i++)
                            padSectionComponent.setPadRate(i, padRepeatRates[i]);
                        handlerIndex++;
                        break;
                    }
                default:
                    break;
            }
        }
    }
    configureMusicInputHandler(handler) {
        if (!handler)
            return;
        handler.setDisplayMode(PreSonus.MusicPadDisplayMode.kBrightColors);
        handler.setPadColor(PadSectionConfig.kDefaultBankColor);
        for (let i = 0; i < PadSectionConfig.kBankCount; i++)
            handler.setBankColor(i, PadSectionConfig.kBankColors[i]);
    }
    getPadSectionElement(name) {
        for (let i = 0; i < this.padSectionConfigs.length; i++) {
            let config = this.padSectionConfigs[i];
            if (config.name == name)
                return config.element;
        }
        return null;
    }
    getActiveMusicInputPadSectionElement() {
        return this.getPadSectionElement(this.activeMusicInputID);
    }
    init() {
        let pse = this.getPadSectionElement(PadSectionID.kDrumMode);
        this.activate(pse, PreSonus.PadSectionRole.kMusicInput);
        pse.component.setCurrentOctave(PadSectionConfig.kDefaultOctave);
        pse.component.setKeyboardModeLayout(PadLayoutID.kKeyboard);
        this.activeMusicInputID = PadSectionID.kDrumMode;
        pse = this.getPadSectionElement(PadSectionID.kSessionMode);
        this.deactivate(pse);
    }
    setWorkflow(workflow) {
        if (workflow == PadWorkflow.kSequencing) {
            this.deactivate(this.getPadSectionElement(PadSectionID.kDrumMode));
            this.activate(this.getPadSectionElement(PadSectionID.kSessionMode), PreSonus.PadSectionRole.kMusicInput);
            this.activeMusicInputID = PadSectionID.kSessionMode;
        }
        else if (workflow == PadWorkflow.kStepControl) {
            this.deactivate(this.getPadSectionElement(PadSectionID.kDrumMode));
            this.activate(this.getPadSectionElement(PadSectionID.kSessionMode), PreSonus.PadSectionRole.kMusicInput);
            this.activeMusicInputID = PadSectionID.kSessionMode;
        }
        else if (workflow == PadWorkflow.kKeyboardPlay) {
            this.deactivate(this.getPadSectionElement(PadSectionID.kSessionMode));
            this.activate(this.getPadSectionElement(PadSectionID.kDrumMode), PreSonus.PadSectionRole.kMusicInput);
            this.activeMusicInputID = PadSectionID.kDrumMode;
        }
    }
    enableRateTriggerMode(state) {
        if (state) {
            if (this.getRateTriggerState(this.activeMusicInputID))
                return;
            let pse = this.getPadSectionElement(this.activeMusicInputID);
            let handlerIndex = this.getHandlerIndexByName(this.activeMusicInputID, PreSonus.PadSectionRole.kRateTrigger);
            pse.component.setActiveHandler(handlerIndex);
            this.setRateTriggerState(this.activeMusicInputID, true);
        }
        else {
            if (!this.getRateTriggerState(this.activeMusicInputID))
                return;
            let pse = this.getPadSectionElement(this.activeMusicInputID);
            let handlerIndex = this.getHandlerIndexByName(this.activeMusicInputID, PreSonus.PadSectionRole.kMusicInput);
            pse.component.setActiveHandler(handlerIndex);
            this.setRateTriggerState(this.activeMusicInputID, false);
        }
    }
    configureMusicInputPads(modification, value) {
        let musicInputElements = [PadSectionID.kDrumMode]; // Only DrumMode is musicinput
        for (let i = 0; i < musicInputElements.length; i++) {
            let elementName = musicInputElements[i];
            let c = this.getPadSectionElement(elementName).component;
            switch (modification) {
                case PadConfiguration.kScale:
                    c.setScale(value);
                    break;
                case PadConfiguration.kOctave:
                    c.setCurrentOctave(value);
                    break;
                case PadConfiguration.kRootOffset:
                    c.setRootOffset(value);
                    break;
                case PadConfiguration.kRange:
                    c.setPadOffset(value);
                    break;
                case PadConfiguration.kAccentColor:
                    c.setAccentColor(value);
                    break;
                case PadConfiguration.kLayout:
                    c.setKeyboardModeLayout(value);
                    break;
                case PadConfiguration.kFullVelocity:
                    c.setFullVelocityMode(value);
                    break;
                case PadConfiguration.kPadFocus:
                    {
                        let handlerIndex = this.getHandlerIndexByName(elementName, PreSonus.PadSectionRole.kMusicInput);
                        let musicInputHandler = c.getHandler(handlerIndex);
                        musicInputHandler.setFocusPadWhenPressed(value);
                    }
                    break;
                default:
                    break;
            }
        }
    }
    adviseHostSignals(observer) {
        for (let i = 0; i < this.padSectionConfigs.length; i++) {
            let config = this.padSectionConfigs[i];
            Host.Signals.advise(config.element.component, observer);
        }
    }
    unadviseHostSignals(observer) {
        for (let i = 0; i < this.padSectionConfigs.length; i++) {
            let config = this.padSectionConfigs[i];
            Host.Signals.unadvise(config.element.component, observer);
        }
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
        this.padWorkflowParam = paramList.addInteger(PadWorkflow.kMin, PadWorkflow.kMax, "padWorkflow");
        this.padWorkflowParam.setValue(PadWorkflow.kKeyboardPlay);

    }
}