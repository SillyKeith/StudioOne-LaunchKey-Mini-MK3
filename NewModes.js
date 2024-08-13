include_file("./resources/controlsurfacecomponent.js");

const Effect = {
    NONE: 0,
    FLASH: 1,
    PULSE: 2
};

class Channel {
    constructor() {
        this.channelElement = null;
        this.potValue = null;
        this.padSelect = null;
        this.padSelectColor = null;
        this.padToggle = null;
        this.padToggleColor = null;
        this.padToggleEffect = null;
        this.padSelectEffect = null;
        this.genericElement = null;
        this.padGeneric = false;
        this.potGeneric = false;
    }

    connectPot(element, paramName) {
        if (!paramName) {
            paramName = element;
            element = this.channelElement;
        }
        return element.connectAliasParam(this.potValue, paramName);
    }

    connectSelect(paramName) {
        Host.Console.writeLine(`Inside connectSelect`);
        return this.channelElement.connectAliasParam(this.padSelect, paramName);
    }

    connectSelectColor(paramName) {
        Host.Console.writeLine(`Inside connectSelectColor`);
        return this.channelElement.connectAliasParam(this.padSelectColor, paramName);
    }

    connectToggle(element, paramName) {
        if (!paramName) {
            Host.Console.writeLine(`Channel class connectToggle: No paramName provided, setting paramName to element ${element}`);
            paramName = element;
            element = this.channelElement;
        }
        Host.Console.writeLine(`Channel() connectToggle: Connecting toggle to element: ${element}, paramName: ${paramName}`);
        Host.Console.writeLine(`Is this.padToggle null or undefined?:: ${this.padToggle.value === null || this.padToggle.value === undefined}`);
        return element.connectAliasParam(this.padToggle, paramName);
    }

    updateSelectEffect() {
        Host.Console.writeLine(`Inside updateSelectEffect`);
        if (this.channelElement.getParamValue('selected'))
            return this.padSelectEffect.setValue(Effect.PULSE);

        this.padSelectEffect.setValue(Effect.NONE);
    }

    updateToggle(color_off, color_on, effect) {
        Host.Console.writeLine(`updateToggle - this.padToggle: ${this.padToggle.value}`);
        if (this.padToggle.value === null || this.padToggle.value === undefined) {
            this.padToggleColor.setValue(0);
            this.padToggleEffect.setValue(Effect.NONE);
            return;
        }
        this.padToggleColor.fromString((this.padToggle.value) ? color_on : color_off);
        Host.Console.writeLine(`We aren't null: this.padToggle.value: ${this.padToggle.value} padToggleColor: ${this.padToggleColor.value}`);
        Host.Console.writeLine(`Checking effect && this.padToggle.value: ${effect && this.padToggle.value}`);
        if (effect && this.padToggle.value) {
            this.padToggleEffect.setValue(effect);
            Host.Console.writeLine(`Setting effect to ${effect}`);
        } else {
            this.padToggleEffect.setValue(Effect.NONE);
        }
    }

    isPadGeneric() {
        return this.padGeneric;
    }

    isPotGeneric() {
        return this.potGeneric;
    }

    setPotGeneric() {
        this.genericElement.connectAliasParam(this.potValue, 'value');
        this.padGeneric = true;
    }

    setToggleGeneric() {
        Host.Console.writeLine(`Inside setToggleGeneric`);
        this.genericElement.connectAliasParam(this.padToggle, 'value');
    }

    setSelectGeneric() {
        Host.Console.writeLine(`Inside setSelectGeneric`);
        this.genericElement.connectAliasParam(this.padSelect, 'value');
        this.genericElement.connectAliasParam(this.padSelectColor, 'value');
    }

    setPadGeneric() {
        Host.Console.writeLine(`Inside setPadGeneric`);
        this.setToggleGeneric();
        this.setSelectGeneric();
        this.potGeneric = true;
    }
}

class PadMode {
    constructor(id, index) {
        this.id = id;
        this.index = index;
        this.effectParams = [];
    }

    init(index, component) {
        this.index = index;
        this.component = component;
        this.handler = component.getHandler(index);
    }

    addRenderHandler(func) {
        Host.Console.writeLine(`Entered addRenderHandler for ${this.id}`);
        
        if (!this.renderHandlers) {
            this.renderHandlers = [];
        } else {
            Host.Console.writeLine(`renderHandlers array already exists for ${this.id}, length: ${this.renderHandlers.length}`);
        }
        
        this.renderHandlers.push(func.bind(this));
        Host.Console.writeLine(`Added new render handler for ${this.id}, new length: ${this.renderHandlers.length}`);
    }

    render(host, root) {
        Host.Console.writeLine(`Entered render function for ${this.id}`);
        this.resetEffects();
        if (!this.renderHandlers) return;
        this.renderHandlers.forEach(handler => handler(host, root));
    }

    addActiveRenderHandler(func) {
        Host.Console.writeLine(`Entering active render handler`);
        if (!this.activeRenderHandlers) this.activeRenderHandlers = [];
        this.activeRenderHandlers.push(func.bind(this));
    }

    activeRender(host, root) {
        // Reset the scene button
        Host.Console.writeLine(`In activeRender for ${this.id}`);
        host.modes.params.scene_button.color.setValue(0);
        host.modes.params.scene_button.effect.setValue(0);
        host.modes.params.ssm_button.color.setValue(0);
        host.modes.params.ssm_button.effect.setValue(0);
        if (!this.activeRenderHandlers) return;
        this.activeRenderHandlers.forEach(handler => handler(host, root));
    }

    setColor(pad, value) {
        Host.Console.writeLine(`Setting color for pad: ${pad}, value: ${value}`);
        if (value.charAt(0) === '#') {
            value = Color.hexToInt(value);
        }
        return this.component.setPadColor(pad, value);
    }

    toggle(pad, value, color_off, color_on) {
        Host.Console.writeLine(`Toggling pad: ${pad}, value: ${value}`);
        this.component.setPadState(pad, true);
        return this.setColor(pad, value ? color_on : color_off);
    }

    setEffect(pad, effect) {
        this.effectParams[pad].setValue(effect);
    }

    resetEffects() {
        this.effectParams.forEach(param => param.setValue(Effect.NONE));
    }
}

class DevicePotMode {
    constructor(id, index) {
        this.id = id;
        this.index = index;
    }
}

class HuiMode {
    constructor(id, color, index) {
        this.id = id;
        this.color = color;
        this.index = index;
    }
}

class DevicePadMode {
    constructor(id, index) {
        this.id = id;
        this.index = index;
        this.nextMode = null;
    }
}

class SessionMode extends PadMode {
    static EffectParams = [];

    constructor(id, color, skip, index) {
        super(id, index);
        this.color = color;
        this.skip = skip;
        this.effectParams = SessionMode.EffectParams;
    }
}

class DrumMode extends PadMode {
    static EffectParams = [];

    constructor(id, index) {
        super(id, index);
        this.effectParams = DrumMode.EffectParams;
    }
}

class Modes extends PreSonus.ControlSurfaceComponent {
    constructor(hostComponent, bankCount) {
    super.onInit(hostComponent, bankCount);
    this.devicePotModes = [];
    this.devicePadModes = [];
    this.sessionModes = [];
    this.drumModes = [];
    this.huiModes = [];
    this.bankCount = bankCount;
    this.drumElement = undefined;
    this.sessionElement = undefined;
    this.userDefinedElement = undefined;
    }

    onInit(hostComponent,bankCount) {
        let root = hostComponent.model.root;
        let paramList = hostComponent.paramList;
        const modeManager = new ModeManager();
        
        // Adding DevicePotModes
        modeManager.addDevicePotMode('custom', 0);
        modeManager.addDevicePotMode('volume', 1);
        modeManager.addDevicePotMode('device', 2);
        modeManager.addDevicePotMode('pan', 3);
        modeManager.addDevicePotMode('sendA', 4);
        modeManager.addDevicePotMode('sendB', 5);
        modeManager.addDevicePotMode('custom', 6);
        
        // Adding DevicePadModes
        modeManager.addDevicePadMode('custom-old', 0); // The real custom0 mode is at index 5
        modeManager.addDevicePadMode('drum', 1);
        modeManager.addDevicePadMode('session', 2);
        modeManager.addDevicePadMode('scalechords', 3);
        modeManager.addDevicePadMode('userchords', 4);
        modeManager.addDevicePadMode('custom', 5);

        // Adding SessionModes
        modeManager.addSessionMode('stepedit', '#AAAA00', false, 0);
        modeManager.addSessionMode('eventedit', '#AAAA00', false, 1);
        modeManager.addSessionMode('setup', '#0000FF', false, 2);
        modeManager.addSessionMode('bank', '#00FF00', false, 3);
        modeManager.addSessionMode('hui', '#38FFCC', false, 4);
        modeManager.addSessionMode('loopedit', 'aqua', true, 5);
        
        // Adding DrumModes
        modeManager.addDrumMode('play', 0);
        modeManager.addDrumMode('repeat_menu', 1);
        modeManager.addDrumMode('rate_trigger', 2);
        
        // Adding HuiMode
        modeManager.addHuiMode('monitor', '#00A9FF', ['#00454F', '#00A9FF'], Effect.NONE, 0);
        modeManager.addHuiMode('arm', '#FF4C87', ['#202020','#FF4C87'], Effect.PULSE, 1);
        modeManager.addHuiMode('solo', '#FFE126', ['#392B00', '#FFE126'], Effect.NONE, 2);
        modeManager.addHuiMode('mute', '#874CFF', ['#0F0030', '#874CFF'], Effect.NONE, 3);
        
        modeManager.preprocessModes();
        this.modeManager = modeManager;

        this.params = {
            device_pad: paramList.addInteger(0, 126, "devicePadMode"),
            device_pot: paramList.addInteger(0, 126, "devicePotMode"),
            drum: paramList.addInteger(0, ModeManager.DrumModes.length - 1, "drumMode"),
            session: paramList.addInteger(0, ModeManager.SessionModes.length - 1, "sessionMode"),
            hui: paramList.addInteger(0, ModeManager.HuiModes.length - 1, "huiMode"),
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

        // The basic component does not send a bankCount, so we need to check if this was the caller before proceeding
        if( ! bankCount )
            return;
        // add alias parameters for vpots, etc.
        let channelBankElement = root.find ("MixerElement/RemoteBankElement");
        this.channels = [];
        for(let i = 0; i < bankCount; i++)
        {
            let channel = new this.constructor.Channel();  

            channel.genericElement = root.getGenericMapping().getElement(0).find ("knob[" + i + "]");
            channel.channelElement = channelBankElement.getElement(i);
            channel.sendsBankElement = channel.channelElement.find("SendsBankElement");
            
            channel.potValue = paramList.addAlias("potValue" + i);

            channel.padSelect = paramList.addAlias("padSelectValue" + i);
            channel.padSelectColor = paramList.addAlias("padSelectColorValue" + i);
            channel.padSelectEffect = paramList.addInteger(0, 2, "padSelectEffectValue" + i);

            channel.padToggle = paramList.addAlias("padToggleValue" + i);
            channel.padToggleColor = paramList.addColor("padToggleColorValue" + i);
            channel.padToggleEffect = paramList.addInteger(0, 2, "padToggleEffectValue" + i);

            this.channels.push(channel);
        }

        for( let i = 0; i < 16; i++ )
            DrumMode.EffectParams.push( paramList.addInteger(0, 2, "drumPadEffect["+i+"]") );
        for( let i = 0; i < 8; i++ ) {
            SessionMode.EffectParams.push( paramList.addInteger(0, 2, "sessionHigherPadEffect["+i+"]") );
            SessionMode.EffectParams.push( paramList.addInteger(0, 2, "sessionLowerPadEffect["+i+"]") );
        }
        this.lastTrackEditorType = PreSonus.HostUtils.kEditorTypeNone;
    }

    activateDrumHandler = function()
    {
        Host.Console.writeLine(`Inside activateDrumHandler`);
        this.drumElement.component.setActiveHandler(this.params.drum.value);
    }

    setPadFocusWhenPressed = function( active )
    {
        Host.Console.writeLine(`Inside setPadFocusWhenPressed`);
        this.getDrumMode('play').handler.setFocusPadWhenPressed(active);
    }

    activateSessionHandler = function() {
        Host.Console.writeLine(`Activating session handler getCurrentSessionMode`);
        let mode = this.getCurrentSessionMode();
        this.sessionElement.component.setActiveHandler(mode.index);
        this.userDefinedElement.component.suspendProcessing(mode.id != 'setup');
    }

    // Other Functions

    activateSessionHandler = function() {
        Host.Console.writeLine(`Activating session handler getCurrentSessionMode`);
        let mode = this.getCurrentSessionMode();
        this.sessionElement.component.setActiveHandler(mode.index);
        this.userDefinedElement.component.suspendProcessing(mode.id != 'setup');
    }

    setModifierActive = function(active)
    {
        Host.Console.writeLine(`Inside setModifierActive`);
        this.drumElement.component.setModifierActive(active);
        this.sessionElement.component.setModifierActive(active);
    }

    setDrumFullVelocityMode = function(active)
    // The original function name was setFullVelocityMode but this is a native method of Presonus.component.
    // so to avoide collisions renamed to setDrumFullVelocityMode here and in LaunchKeyMKIIIComponent
    {
        Host.Console.writeLine(`Inside setDrumFullVelocityMode`);
        this.drumElement.component.setFullVelocityMode(active)
    }

    setDrumSessionCurrentBank = function(bank)
    {
        Host.Console.writeLine(`Inside setCurrentBank`);
        this.drumElement.component.setCurrentBank(bank);
        this.sessionElement.component.setCurrentBank(bank);
    }

    setPadDisplayMode = function( mode )
    {
        Host.Console.writeLine(`Inside setPadDisplayMode`);
        let modes = [
            PreSonus.MusicPadDisplayMode.kNoColors,
            PreSonus.MusicPadDisplayMode.kDimmedColors,
            PreSonus.MusicPadDisplayMode.kBrightColors,
        ];

        this.params.display.setValue( mode, true );
        this.getDrumMode('play').handler.setDisplayMode(modes[mode]);
    }

    toggleNextPadDisplayMode = function()
    {
        Host.Console.writeLine(`Inside toggleNextPadDisplayMode`);
        let nextMode = this.params.display.value + 1;
        if( nextMode > 2 )
            nextMode = 0;
        this.setPadDisplayMode(nextMode);
        Host.Console.writeLine(`toggleNextPadDisplayMode: nextMode: ${nextMode}`);
    }

    activateDrumHandler = function()
    {
        Host.Console.writeLine(`Inside activateDrumHandler`);
        this.drumElement.component.setActiveHandler(this.params.drum.value);
    }

    setPadFocusWhenPressed = function( active )
    {
        Host.Console.writeLine(`Inside setPadFocusWhenPressed`);
        this.getDrumMode('play').handler.setFocusPadWhenPressed(active);
    }
}

class DevicePadManager extends Modes {
    constructor(params) {
        super(params);
        this.devicePadModeIdToIndexMap = new Map();
        this.currentDevicePadMode = null;
    }

    addDevicePadMode(id, index) {
        const mode = new DevicePadMode(id, index);
        Modes.DevicePadModes.push(mode);
        this.devicePadModeIdToIndexMap.set(id, index);
        mode.nextMode = Modes.DevicePadModes[index + 1] || Modes.DevicePadModes[0];
    }

    preprocessDevicePadModes() {
        Modes.DevicePadModes.forEach((mode) => {
            mode.nextMode = Modes.DevicePadModes[mode.index + 1] || Modes.DevicePadModes[0];
        });
    }

    getCurrentDevicePadMode = function() {
        const index = this.params.device_pad.value;
        this.currentDevicePadMode = Modes.DevicePadModes.find(mode => mode.index === index);
        return this.currentDevicePadMode;
    }

    setDevicePadMode = function(id) {
        const index = this.devicePadModeIdToIndexMap.get(String(id));
        if (index !== undefined) {
            this.params.device_pad.setValue(index, true);
            this.currentDevicePadMode = Modes.DevicePadModes[index];
        } else {
            Host.Console.writeLine(`setDevicePadMode Error: Mode with ID ${id} not found.`);
            return null;
        }
    }
}

class DevicePotManager extends Modes {
    constructor(params) {
        super(params);
        this.devicePotModeIdToIndexMap = new Map();
        this.currentDevicePotMode = null;
    }

    addDevicePotMode(id, index) { // This is the function that adds the mode to the DevicePotModes array
        const mode = new DevicePotMode(id, index);
        Modes.DevicePotModes.push(mode);
        this.devicePotModeIdToIndexMap.set(id, index);
        mode.nextMode = Modes.DevicePotModes[index + 1] || Modes.DevicePotModes[0];
    }

    preprocessDevicePotModes() { // This function is called to set the nextMode property of each mode in the DevicePotModes array
        Modes.DevicePotModes.forEach((mode) => {
            mode.nextMode = Modes.DevicePotModes[mode.index + 1] || Modes.DevicePotModes[0];
        });
    }

    getCurrentDevicePotMode() { // We need to return the mode object
        const index = this.params.device_pot.value; // This is the index of the mode (0, 1, 2) 
        // Host.Console.writeLine(`getCurrentDevicePotMode - Getting current device pot mode: ${index}`);
        this.currentDevicePotMode = Modes.DevicePotModes.find(mode => mode.index === index);
        return this.currentDevicePotMode;
    }

    setDevicePotMode(id) {
        const index = this.devicePotModeIdToIndexMap.get(String(id)); // Use the IndexMap to translate the id('custom', 'volume', 'device',etc) to an index. Replaces the need for getDevicePotMode
        Host.Console.writeLine(`setDevicePotMode - Setting device pot mode: ${id} index=${index}`);
        if (index !== undefined) {
            this.params.device_pot.setValue(index, true);
            this.currentDevicePotMode = Modes.DevicePotModes[index];
        } else {
            Host.Console.writeLine(`setDevicePotMode - Error: Mode with ID ${id} not found.`);
            return null;
        }
    }
}

class SessionManager extends Modes {
    constructor(params, lastTrackEditorType) {
        super(params, lastTrackEditorType);
        this.sessionModeIdToIndexMap = new Map();
        this.currentSessionMode = null;
    }

    isSessionMode() {
        return this.currentDevicePadMode === 'session';
    }

    getSessionMode(id) {
        const index = this.sessionModeIdToIndexMap.get(String(id)); // Use the IndexMap to translate the id('stepedit', 'eventedit', etc) to an index. Replaces the need for getDevicePadMode
        if (index !== undefined) {
            return Modes.SessionModes[index];
        }
        return null;
    }

    getCurrentSessionMode() {
        return this.currentSessionMode;
    }

    setSessionMode(id) {
        // Retrieve the session mode object based on the provided ID
        let mode = this.getSessionMode(id); 

        // Check if the mode is 'stepedit' or 'eventedit'
        if (mode.id === 'stepedit' || mode.id === 'eventedit') {
            // Determine the index based on the last track editor type
            let index = (this.lastTrackEditorType === PreSonus.HostUtils.kEditorTypePattern) 
                        ? this.getSessionMode('stepedit').index 
                        : this.getSessionMode('eventedit').index;

            // Set the session value to the determined index
            this.params.session.setValue(index, true);

            // Defer the command to update the view
            Host.GUI.Commands.deferCommand("View", "Editor", false, Host.Attributes(["State", true]));
        } else {
            // Set the session value for other modes
            this.params.session.setValue(mode.index, true);
        }
        // Update the current session mode
        this.currentSessionMode = mode;
    }

    toggleNextSessionMode() {
        Host.Console.writeLine(`Toggling next session mode getCurrentSessionMode`);
        let currentMode = this.currentSessionMode;
        let nextMode = currentMode.nextMode;
    
        // Skip 'loopedit' mode because we are only supposed to enter it via scenehold + play button
        if (nextMode.id === 'loopedit') {
            nextMode = nextMode.nextMode;
        }
    
        this.setSessionMode(nextMode.id);
    }
}

class ModeManager {
    constructor(params) {
        this.devicePotModes = [];
        this.devicePadModes = [];
        this.sessionModes = [];
        this.drumModes = [];
        this.huiModes = [];
        this.devicePotModeIdToIndexMap = new Map();
        this.devicePadModeIdToIndexMap = new Map();
        this.sessionModeIdToIndexMap = new Map();
        this.drumModeIdToIndexMap = new Map();
        this.huiModeIdToIndexMap = new Map();
        this.params = params;
    }

    addDevicePotMode(id, index) {
        const mode = new DevicePotMode(id, index);
        this.devicePotModes.push(mode);
        this.devicePotModeIdToIndexMap.set(id, index);
        mode.nextMode = this.devicePotModes[index + 1] || this.devicePotModes[0];
    }

    addDevicePadMode(id, index) {
        const mode = new DevicePadMode(id, index);
        this.devicePadModes.push(mode);
        this.devicePadModeIdToIndexMap.set(id, index);
        mode.nextMode = this.devicePadModes[index + 1] || this.devicePadModes[0];
    }

    addSessionMode(id, color, skip, index) {
        const mode = new SessionMode(id, color, skip, index);
        this.sessionModes.push(mode);
        this.sessionModeIdToIndexMap.set(id, index);
        mode.nextMode = this.sessionModes[index + 1] || this.sessionModes[0];
    }

    addDrumMode(id, index) {
        const mode = new DrumMode(id, index);
        this.drumModes.push(mode);
        this.drumModeIdToIndexMap.set(id, index);
        mode.nextMode = this.drumModes[index + 1] || this.drumModes[0];
    }

    addHuiMode(id, color, index) {
        const mode = new HuiMode(id, color, index);
        this.huiModes.push(mode);
        this.huiModeIdToIndexMap.set(id, index);
        mode.nextMode = this.huiModes[index + 1] || this.huiModes[0];
    }

    preprocessModes() {
        this.devicePotModes.forEach((mode) => {
            mode.nextMode = this.devicePotModes[mode.index + 1] || this.devicePotModes[0];
        });

        this.devicePadModes.forEach((mode) => {
            mode.nextMode = this.devicePadModes[mode.index + 1] || this.devicePadModes[0];
        });

        this.sessionModes.forEach((mode) => {
            mode.nextMode = this.sessionModes[mode.index + 1] || this.sessionModes[0];
        });

        this.drumModes.forEach((mode) => {
            mode.nextMode = this.drumModes[mode.index + 1] || this.drumModes[0];
        });

        this.huiModes.forEach((mode) => {
            mode.nextMode = this.huiModes[mode.index + 1] || this.huiModes[0];
        });
    }

}

class HuiModeManager extends Modes {
    constructor(params) {
        super(params);
        this.huiModeIdToIndexMap = new Map();
        this.currentHuiMode = null;
    }

    addHuiMode(id, color, index) {
        const mode = new HuiMode(id, color, index);
        Modes.HuiModes.push(mode);
        this.huiModeIdToIndexMap.set(id, index);
        mode.nextMode = Modes.HuiModes[index + 1] || Modes.HuiModes[0];
    }

    preprocessModes() {
        Modes.HuiModes.forEach((mode) => {
            mode.nextMode = Modes.HuiModes[mode.index + 1] || Modes.HuiModes[0];
        });
    }

    getHuiMode(id) {
        const modeIndex = this.huiModeIdToIndexMap.get(String(id));
        Host.Console.writeLine(`getHuiMode: Getting Hui mode: ${id} index=${modeIndex}`);
        return Modes.HuiModes[modeIndex];
    }

    getCurrentHuiMode() {
        const modeIndex = this.params.hui.value;
        if (modeIndex >= 0 && modeIndex < Modes.HuiModes.length) {
            Host.Console.writeLine(`getCurrentHuiMode: Getting current Hui mode: ${modeIndex}`);
            this.currentHuiMode = Modes.HuiModes[modeIndex];
            return this.currentHuiMode;
        }
        return null;
    }

    setHuiMode(id) {
        const mode = this.getHuiMode(id);
        if (mode) {
            const modeIndex = mode.index;
            Host.Console.writeLine(`setHuiMode: Setting Hui mode: ${id} index=${modeIndex}`);
            this.params.hui.setValue(modeIndex, true);
            this.currentHuiMode = mode;
        } else {
            Host.Console.writeLine(`setHuiMode: Error: Mode with ID ${id} not found.`);
            return null;
        }
    }

    toggleNextHuiMode() {
        Host.Console.writeLine(`Inside toggleNextHuiMode`);
        const currentMode = this.getCurrentHuiMode();
        if (currentMode) {
            this.setHuiMode(currentMode.nextMode.id);
        }
    }
}



class DrumManager extends ModeManager {
    constructor(params) {
        super(params);
        this.drumModeIdToIndexMap = new Map();
        this.currentDrumMode = null;
    }

    isDrumMode() {
        return this.currentDevicePadMode === 'drum';
    }

    getDrumMode(id) {
        // Host.Console.writeLine(`getDrumMode: Getting drum mode: ${id}`);
        return Modes.DrumModes.find(mode => mode.id === id);
    }

    getCurrentDrumMode() {
        // Assuming this.params.drum.value holds the index of the current drum mode
        const modeIndex = this.params.drum.value;
        return Modes.DrumModes.find(mode => mode.index === modeIndex);
    }

    setDrumMode(id) {
        const modeIndex = this.getDrumMode(id).index;
        // Host.Console.writeLine(`setDrumMode: Setting drum mode: ${id} index=${modeIndex}`);
        if (modeIndex !== undefined) {
            this.params.drum.setValue(modeIndex, true);
        } else {
            Host.Console.writeLine(`setDrumMode: Error: Mode with ID ${id} not found.`);
            return null;
        }
        this.currentDrumMode = Modes.DrumModes[modeIndex];
    }
}




