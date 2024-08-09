include_file("resource://com.presonus.musicdevices/sdk/controlsurfacedevice.js");
include_file("resource://com.presonus.musicdevices/sdk/controlsurfacecomponent.js");
include_file("resource://com.presonus.musicdevices/sdk/musicprotocol.js");
//include_file("resource://com.presonus.musicdevices/sdk/midiprotocol.js");
include_file("Color.js");
include_file("MK3CommonUtil.js");

const kPadCount = 16;
const kBankCount = 8;

// Pot modes
// Pot mode changes are reported or can be changed by the following MIDI event:
//      • Channel 16 (MIDI status: BFh, 191), Control Change 09h (9)
//  The Pot modes are mapped to the following values:
//      • 00h (0): Custom Mode 0
//      • 01h (1): Volume
//      • 02h (2): Device
//      • 03h (3): Pan
//      • 04h (4): Send-A
//      • 05h (5): Send-B
//      • 06h (6): Custom Mode 0
//      • 07h (7): Custom Mode 1
//      • 08h (8): Custom Mode 2
//      • 09h (9): Custom Mode 3
var DevicePotMode;
(function (DevicePotMode) {
    DevicePotMode[DevicePotMode["custom"] = 0] = "custom";
    DevicePotMode[DevicePotMode["volume"] = 1] = "volume";
    DevicePotMode[DevicePotMode["device"] = 2] = "device";
    DevicePotMode[DevicePotMode["pan"] = 3] = "pan";
    DevicePotMode[DevicePotMode["sendA"] = 4] = "sendA";
    DevicePotMode[DevicePotMode["sendB"] = 5] = "sendB";
    DevicePotMode[DevicePotMode["kModeMin"] =0] = "kModeMin";
    DevicePotMode[DevicePotMode["kModeMax"] = 5] = "kModeMax";
})(DevicePotMode || (DevicePotMode = {}));

// Pad modes
// Pad mode changes are reported or can be changed by the following MIDI event:
//      • Channel 16 (MIDI status: BFh, 191), Control Change 03h (3)
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

// These are the modes for the drum pads and defined in the surface.xml file


//      <define name="$DEVICE_PAD_CUSTOM" value="0"/>
//      <define name="$DEVICE_PAD_DRUM_LAYOUT" value="1" />
//      <define name="$DEVICE_PAD_SESSION_LAYOUT" value="2" />
//      <define name="$DEVICE_PAD_SCALE_CHORDS" value="3"/>
//      <define name="$DEVICE_PAD_USER_CHORDS" value="4"/>
//      <define name="$DEVICE_PAD_CUSTOM_MODE0" value="5" />

const DevicePadMode = {};
    (function (DevicePadMode) {
        DevicePadMode[DevicePadMode["kCustomMode"] = 0] = "kCustomMode";
        DevicePadMode[DevicePadMode["kDrumMode"] = 1] = "kDrumMode";
        DevicePadMode[DevicePadMode["kSessionMode"] = 2] = "kSessionMode";
        DevicePadMode[DevicePadMode["kScaleChords"] = 3] = "kScaleChords";
        DevicePadMode[DevicePadMode["kUserChords"] = 4] = "kUserChords";
        DevicePadMode[DevicePadMode["kCustomMode0"] = 5] = "kCustomMode0";
        // DevicePadMode[DevicePadMode["kCustomMode1"] = 6] = "kCustomMode1";
        // DevicePadMode[DevicePadMode["kCustomMode2"] = 7] = "kCustomMode2";
        // DevicePadMode[DevicePadMode["kCustomMode3"] = 8] = "kCustomMode3";
        // DevicePadMode[DevicePadMode["kDeviceSelect"] = 9] = "kDeviceSelect";
        // DevicePadMode[DevicePadMode["kNavigation"] = 10] = "kNavigation";
        DevicePadMode[DevicePadMode["kModeMin"] = 1] = "kModeMin";
        DevicePadMode[DevicePadMode["kModeMax"] = 5] = "kModeMax";
        DevicePadMode[DevicePadMode["kPadDefaultMode"] = 1] = "kPadDefaultMode";
})(DevicePadMode);

const SessionMode = {};
(function (SessionMode) {
    SessionMode[SessionMode["kPlayMode"] = 0] = "kPlayMode";
    SessionMode[SessionMode["kSetupMode"] = 1] = "kSetupMode";
    SessionMode[SessionMode["kLoopEditMode"] = 2] = "kLoopEditMode";
    SessionMode[SessionMode["kEventEditMode"] = 3] = "kEventEditMode";
    SessionMode[SessionMode["kInstrumentEditMode"] = 4] = "kInstrumentEditMode";
    SessionMode[SessionMode["kBankMenuMode"] = 5] = "kBankMenuMode";
    SessionMode[SessionMode["kRepeatMenuMode"] = 6] = "kRepeatMenuMode";
    SessionMode[SessionMode["kPitchMenuMode"] = 7] = "kPitchMenuMode";
    SessionMode[SessionMode["kRateTriggerMode"] = 8] = "kRateTriggerMode";
    SessionMode[SessionMode["kStepEditMode"] = 9] = "kStepEditMode";
    SessionMode[SessionMode["kRestorePlayMode"] = 10] = "kRestorePlayMode";
    SessionMode[SessionMode["kLastPadMode"] = 10] = "kLastPadMode";
})(SessionMode);

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
const kDefaultBankColor = "#002CFF";
const kPadCommandColor = "yellow";
const kRateTriggerColor = "orange";
const kRepeatMenuColor = "blue";
const kPadFocusOnColor = "orange";
const kPadFocusOffColor = "blue";
const kSelectButtonColor = "blue";
const kPlayButtonColor = "green";
const kLoopButtonColor = "aqua";
let bankColors = [
    "#0020FF",
    "lime",
    "yellow",
    "purple",
    "orangered",
    "cyan",
    "crimson",
    "#FF7210"
];

let padSnapColors = [
    "red",
    "orangered",
    "yellow",
    "greenyellow",
    "green",
    "blue",
    "aqua",
    "magenta",
    "darkviolet",
    "gray"
];
let keyboardModeColors = [
    "orange",
    "aqua",
    "#FF3200",
    "#DD640C",
    "purple",
    "red"
];

const monoColor = {
    OFF: 0x00,
    HALF: 0x3F,
    ON: 0x7F
};

const kDefaultBank = 0;
const kDefaultOctave = 3;
class MK3Component extends PreSonus.ControlSurfaceComponent {
    onInit(hostComponent) {
        super.onInit(hostComponent);
        this.debugLog = true;
        this.log("MK3Component onInit");
        this.model = hostComponent.model;  
        let root = this.model.root;

        let paramList = hostComponent.paramList;

        const presonusComponent = root;
        this.log(`const root = this.hostComponent  Type: ${presonusComponent.constructor.name}`);
        this.log(`const root = this.hostComponent  Properties: ${JSON.stringify(presonusComponent, null, 2)}`);
        this.log(`const root = this.hostComponent  Prototype Methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(presonusComponent))}`);
        this.log(`Number of keys in presonusComponent = root: ${Object.keys(paramList).length}`);
        
        // Iterate over each key in paramList
        Object.keys(paramList).forEach(key => {
            this.log(`Key: ${key}, Value: ${JSON.stringify(paramList[key], null, 2)}`);
        });
        // Log elements found in root
        this.log("Elements found in root:");
        Object.keys(root).forEach(key => {
            this.log(`Key: ${key}, Value: ${JSON.stringify(root[key], null, 2)}`);
        });
        
        // Inspect each prototype method
        const prototypeMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(presonusComponent));
        prototypeMethods.forEach(method => {
            if (typeof presonusComponent[method] === 'function') {
                this.log(`Method: ${method}`);
                try {
                    this.log(`Method Details: ${presonusComponent[method].toString()}`);
                } catch (e) {
                    this.log(`Method Details: [native code]`);
                }
            }
        });
        
        this.pagingComponent = hostComponent.find(PreSonus.ComponentID.kPaging);
        this.log(`pagingComponent: ${this.pagingComponent}`);
        
        // Elements initialization. This is looking inside the surface.xml file for the elements
        //      <PadSection name="PadSectionElement" rows="2" roles="musicinput">
        // initially only Drum Layout mode is supported
        this.padSessionSection = root.find("PadSessionSectionElement");
        this.log(`padSessionSection: ${this.padSessionSection}`);
        
        
        this.devicePadMode = paramList.addInteger(0, SessionMode.kLastPadMode, "devicePadMode");
        
        this.padFocusMode = paramList.addParam("padFocusMode");
        this.bankMenu = paramList.addInteger(0, kBankCount - 1, "bankMenu");

        this.updateBankMenuColor();
        paramList.addColor("padFocusOnColor").fromString(kPadFocusOnColor);
        paramList.addColor("padFocusOffColor").fromString(kPadFocusOffColor);
        paramList.addColor("selectButtonColor").fromString(kSelectButtonColor);
        paramList.addColor("playButtonColor").fromString(kPlayButtonColor);
        paramList.addColor("loopButtonColor").fromString(kLoopButtonColor);
        paramList.addColor("whiteColor").fromString("white");
        paramList.addColor("buttonOffColor").fromString("#262626");

        let c = this.padSessionSection.component;

            this.log(`padSessionSection component: ${c}`);

        c.setPadColoringSupported(true);
        for (let i = 0; i < padSnapColors.length; i++)
            c.addPadPaletteColor(padSnapColors[i]);
        this.lastTrackEditorType = PreSonus.HostUtils.kEditorTypeNone;

        this.log(`Calling setupPadSectionHandlers`);
        
        this.setupPadSectionHandlers(c);
        
        this.log(`Setting Active Handler for SessionMode.kPlayMode`);
        
        c.setActiveHandler(SessionMode.kPlayMode);

        this.padFocusMode.setValue(1, true);
        this.lastTrackEditorType = PreSonus.HostUtils.kEditorTypeNone;
        // PreSonus.HostUtils.enableEditorNotifications (this, true);
        PreSonus.HostUtils.enableEngineEditNotifications(this, true);
        Host.Signals.advise(c, this);
        
        this.log(`Host.Signals.advise(c, this) has been called`);
        
        this.bankMenu.setValue(kDefaultBank, true);

        this.renderDrumMode();
        this.updatePadMode();
    }
    onExit() {
        let c = this.padSessionSection.component;
        this.log(`Inside onExit - c: ${c}`);
        Host.Signals.unadvise(c, this);
        PreSonus.HostUtils.enableEngineEditNotifications(this, false);
        super.onExit();
    }
    // object details logging
    logObjectDetails(obj, indent = '') {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                let value = obj[key];
                this.log(`${indent}${key}: ${typeof value}`);
                if (typeof value === 'object' && value !== null) {
                    this.logObjectDetails(value, indent + '  ');
                }
            }
        }
    }
    onTrackEditorChangedNotify(editor) {  // onTrackEditorChangedNotify from SDK
        let editorType = PreSonus.HostUtils.kEditorTypeNone;
        if (editor) {
            let mode = this.getPadMode();  
            let editorType = PreSonus.HostUtils.getEditorType(editor);
            this.lastTrackEditorType = editorType;
            if (editorType == PreSonus.HostUtils.kEditorTypeMusic)
                this.setPadMode(SessionMode.kDrumMode);
            else
            this.restorePlayMode();
        }
    }

    setupPadSectionHandlers(c) {
        this.log(`Inside setupPadSectionHandlers`);
        for (let mode = 0; mode < SessionMode.kLastPadMode; mode++) {
            this.log(`Inside for loop - mode: ${mode} DevicePadMode: ${SessionMode.mode}`);
            switch (mode) {
                case SessionMode.kPlayMode: 
                {
                    c.addHandlerForRole(PreSonus.PadSectionRole.kMusicInput);
                    let musicInputHandler = c.getHandler(mode);
                    this.log(`CASE: SessionMode.kPlayMode - musicInputHandler: ${musicInputHandler}`);
                    musicInputHandler.setDisplayMode(PreSonus.MusicPadDisplayMode.kBrightColors);
                    musicInputHandler.setPadColor(kDefaultBankColor);
                    for (let i = 0; i <kBankCount; i++)
                        musicInputHandler.setBankColor(i, bankColors[i]);
                }
                break;
                default:
                {
                    this.log(`CASE: Default - addNullHandler for mode: ${mode}`);
                    c.addNullHandler();
                }
                    break;
            }
        }
    }
    getPadMode() { 
        this.log("getPadMode: " + this.devicePadMode.value);
        return this.devicePadMode.value; 
    }
    setPadMode(mode) {
        this.log("setPadMode: " + mode);
        this.devicePadMode.setValue(mode, true);
    }


    notify(subject, msg) {
        this.log(`Notify: msgID:${msg.id} msgName:${msg.getArg(0).name} msgValue:${msg.getArg(0).value}`);
        if (msg.id == PreSonus.HostUtils.kTrackEditorChanged) {
            this.log(`Notify: TrackEditorChanged msg.getarg(0).name: ${msg.getArg(0).name}`);
            this.onTrackEditorChangedNotify(msg.getArg(0));
        }
        else if (msg.id == PreSonus.PadSection.kCurrentBankChanged){
            this.log(`Notify: CurrentBankChanged msg: ${msg.id}`);
            this.updateBankMenuColor();
        }
        else if (msg.id == "changed") {
            if (subject == this.focusTrackColorParam) {
                this.log(`Notify: FocusTrackColorChanged subject: ${subject}`);
                this.onTrackColorChange(this.focusTrackColorParam.value);
            }
        }
        else if (msg.id == PreSonus.PadSection.kKeyboardModeChanged) {
            this.log(`Notify: KeyboardModeChanged subject: ${subject}`);
            let padSectionComponent = subject;
            this.isKeyboardModeParam.setValue(padSectionComponent.isKeyboardMode(), true);
            this.updateBankMenuColor();
        }
    }

    
    paramChanged(param) {
        this.log(`ParamChanged: name: ${param.name} value: ${param.value}`);
        if (param == this.padFocusMode) {
            let musicInputHandler = this.padSessionSection.component.getHandler(PadSectionMode.kPlayMode);
            musicInputHandler.setFocusPadWhenPressed(param.value);
        }
        else if (param == this.devicePadMode) {
            this.log("Pad mode changed");
            this.updatePadMode();
        }
        else if (param == this.bankMenu) {
            this.log("Bank menu changed");
            if (this.isKeyboardModeParam.value) {
                this.padSessionSection.component.setCurrentOctave(param.value);
                this.updateBankMenuColor();
            }
            else
                this.padSessionSection.component.setCurrentBank(param.value);
        }
    }

    restorePlayMode() {  // generic set to kDrumMode for all..
        if (this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kSpread))
            this.setPadMode(SessionMode.kPlayMode);
        else
            this.setPadMode(SessionMode.kPlayMode);
    }
    
    renderDrumMode = function () {
        this.log("Entering renderDrumMode");
        let mode = this.getPadMode();
        let c = this.padSessionSection.component;

        this.log("Rendering current drum mode");
        c.setActiveHandler(mode);
    }
    
    updatePadMode() {
        let mode = this.getPadMode();
        let c = this.padSessionSection.component;
        this.log(`Pad mode: ${mode} padSectionComponent: ${c}`);
        switch (mode) {
            case SessionMode.kDrumMode:
                this.log(`Pad mode: Drum Layout ${mode}`);
                break;
            case DevicePadMode.kSessionMode:
                this.log(`Pad mode: Session Layout ${mode}`);
                break;
        }
        c.setActiveHandler(mode);
        this.editorModeActive.value = mode == SessionMode.kPlayMode || mode == SessionMode.kPlayMode;
    }

    updateBankMenuColor() {
        this.log(`Inside updateBankMenuColor`);
        let c = this.padSessionSection.component;  // start with the padSessionSection component
        let bank = c.getCurrentBank();
        let bankColor = bankColors[bank];
        this.bankMenuColor.fromString(bankColor);
    }
}

function createMK3ComponentInstance() {
    return new MK3Component();
}