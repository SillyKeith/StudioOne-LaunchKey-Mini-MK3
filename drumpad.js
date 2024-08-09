const DevicePadMode;
    (function (DevicePadMode) {
        DevicePadMode[DevicePadMode["custom"] = 0] = "custom";
        DevicePadMode[DevicePadMode["drum"] = 1] = "drum";
        DevicePadMode[DevicePadMode["session"] = 2] = "session";
        DevicePadMode[DevicePadMode["kPadModeMin"] = 0] = "kPadModeMin";
        DevicePadMode[DevicePadMode["kPadModeMax"] = 2] = "kPadModeMax";
})(DevicePadMode || (DevicePadMode = {}));

DrumMode.EffectParams = [];
DrumMode.prototype = new PadMode();
function DrumMode(id)
{
    this.id = id;
    this.effectParams = DrumMode.EffectParams;
};
Modes.DrumModes = [
    new DrumMode('play'),
    new DrumMode('repeat_menu'),
    new DrumMode('rate_trigger')
];

// Preprocess DrumModes
const drumModeIdToIndexMap = new Map();
Modes.DrumModes.forEach((mode, index) => {
    drumModeIdToIndexMap.set(mode.id, index);
    // Link to next mode if applicable
    mode.nextMode = Modes.DrumModes[index + 1] || Modes.DrumModes[0]; // Or Modes.DrumModes[0] to loop
});

class Modes extends Presonus.ControlSurfaceComponent {
    constructor(hostComponent, bankCount) {
        this.bankCount = bankCount;
        this.drumElement = undefined;
        this.sessionElement = undefined;
        this.userDefinedElement = undefined;

        let root = hostComponent.model.root;
        let paramList = hostComponent.paramList;

        this.params = {
            device_pad: paramList.addInteger(0, 126, "devicePadMode"),
            device_pot: paramList.addInteger(0, 126, "devicePotMode"),
            drum: paramList.addInteger(0, Modes.DrumModes.length - 1, "drumMode"),
            session: paramList.addInteger(0, Modes.SessionModes.length - 1, "sessionMode"),
            hui: paramList.addInteger(0, Modes.HuiModes.length - 1, "huiMode"),
            focus: paramList.addParam("padFocusMode"),
            display: paramList.addInteger(0, 2, "padDisplayMode"),
            scene_button: {
                color: paramList.addColor('sceneColor'),
                effect: paramList.addInteger(0, 2, 'sceneEffect')
            },
            ssm_button: {
                color: paramList.addColor('ssmColor'),
                effect: paramList.addInteger(0, 2, 'ssmEffect')
            }
        };
    }
    getCurrentDevicePadMode() {
        // Assuming Modes.DevicePadModes is an object where keys are mode names and values are their respective ids
        // and this.params.device_pad.value holds the id of the current device pad mode
        const modeId = this.params.device_pad.value;
        for (let modeName in Modes.DevicePadModes) {
            if (Modes.DevicePadModes[modeName] === modeId) {
                return modeName; // Return the mode name directly without using _getModeByIndex
            }
        }
        return null; // Return null if the modeId does not match any mode
    } 
    isDrumMode() {
        // Since getCurrentDevicePadMode() returns the mode name, we compare the returned value directly
        return this.getCurrentDevicePadMode() === 'drum';
    }

    getDrumMode(modeId) {
        return Modes.DrumModes.find(mode => mode.id === modeId) || null;
    }

    getCurrentDrumMode() {
        // Assuming this.params.drum.value holds the index of the current drum mode
        const modeIndex = this.params.drum.value;
        if (modeIndex >= 0 && modeIndex < Modes.DrumModes.length) {
            return Modes.DrumModes[modeIndex];
        }
        return null; // Return null if the index is out of bounds
    }

    setDrumMode(id) {
        const modeIndex = Modes.DrumModes.findIndex(mode => mode.id === id);
        if (modeIndex !== -1) {
            this.params.drum.setValue(modeIndex, true);
        }
    }
}