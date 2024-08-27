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
        this.potGeneric = true;
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
        this.padGeneric = true;
    }
    
    resetPotGeneric() {
        this.potGeneric = false;
    }

    resetPadGeneric() {
        this.padGeneric = false;
    }
}

/**
 * Class representing a PadMode.
 */
class PadMode {
    /**
     * Create a PadMode.
     * @param {string} id - The ID of the pad mode.
     * @param {number} index - The index of the pad mode.
     */
    constructor(id, index) {
        this.id = id;
        this.index = index;
        this.effectParams = [];
    }

    /**
     * Initialize the pad mode.
     * @param {number} index - The index to set.
     * @param {Object} component - The component to associate with this pad mode.
     */
    init(index, component) {
        this.index = index;
        this.component = component;
        this.handler = component.getHandler(index);
        Host.Console.writeLine(`PadMode(init) Initialized ${this.id} with index ${this.index}`);
    }

    /**
     * Add a render handler function.
     * @param {Function} func - The render handler function to add.
     */
    addRenderHandler(func) {
        Host.Console.writeLine(`Entered addRenderHandler for ${this.id}`);
        
        if (!this.renderHandlers) {
            this.renderHandlers = [];
        }

        this.renderHandlers.push(func.bind(this));
    }

    /**
     * Render the pad mode.
     * @param {Object} host - The host object.
     * @param {Object} root - The root object.
     */
    render(host, root) {
        Host.Console.writeLine(`Entered render function for ${this.id}`);
        this.resetEffects();
        if (!this.renderHandlers) 
            return;
        this.renderHandlers.forEach(handler => handler(host, root));
        Host.Console.writeLine(`renderHandlers length: ${this.renderHandlers.length}`);
    }

    /**
     * Add an active render handler function.
     * @param {Function} func - The active render handler function to add.
     */
    addActiveRenderHandler(func) {
        Host.Console.writeLine(`Entering active render handler`);
        if (!this.activeRenderHandlers) this.activeRenderHandlers = [];
        this.activeRenderHandlers.push(func.bind(this));
    }

    /**
     * Render the pad mode in active state.
     * @param {Object} host - The host object.
     * @param {Object} root - The root object.
     */
    activeRender(host, root) {
        Host.Console.writeLine(`In activeRender for ${this.id}`);
        host.modes.params.scene_button.color.setValue(0);
        host.modes.params.scene_button.effect.setValue(0);
        host.modes.params.ssm_button.color.setValue(0);
        host.modes.params.ssm_button.effect.setValue(0);
        if (!this.activeRenderHandlers) 
            return;
        this.activeRenderHandlers.forEach(handler => handler(host, root));
    }

    /**
     * Deactivate the active renderers and set to IDLE. Currently not used.
     * @param {*} host 
     * @param {*} root 
     */
    deactivate(host, root) {
        Host.Console.writeLine(`Deactivating ${this.id}`);
        this.component.clearPadPressedState();
        this.component.setActiveHandler(3); //null handler
    }

    /**
     * Set the color of a pad.
     * @param {number} pad - The pad number.
     * @param {string|number} value - The color value.
     * @returns {boolean} - The result of setting the pad color.
     */
    setColor(pad, value) {
        Host.Console.writeLine(`Setting color for pad: ${pad}, value: ${value}`);
        if (typeof value === 'string' && value.charAt(0) === '#') {
            value = Color.hexToInt(value);
        }
        return this.component.setPadColor(pad, value);
    }

    /**
     * Toggle the state and color of a pad.
     * @param {number} pad - The pad number.
     * @param {boolean} value - The toggle value.
     * @param {string|number} color_off - The color when off.
     * @param {string|number} color_on - The color when on.
     * @returns {boolean} - The result of toggling the pad.
     */
    toggle(pad, value, color_off, color_on) {
        Host.Console.writeLine(`Toggling pad: ${pad}, value: ${value}`);
        this.component.setPadState(pad, true);
        return this.setColor(pad, value ? color_on : color_off);
    }

    /**
     * Set the effect of a pad.
     * @param {number} pad - The pad number.
     * @param {number} effect - The effect value.
     */
    setEffect(pad, effect) {
        this.effectParams[pad].setValue(effect);
    }

    /**
     * Reset all effects to their default state.
     */
    resetEffects() {
        this.effectParams.forEach(param => param.setValue(Effect.NONE));
    }
}

class DevicePadMode {
    constructor(id, index) {
        this.id = id;
        this.index = index;
    }
}

class DevicePotMode {
    constructor(id, index) {
        this.id = id;
        this.index = index;
    }
}

class SessionMode extends PadMode {
    static EffectParams = [];

    constructor(id, color, skip, index) {
        super();
        this.id = id;
        this.color = color;
        this.skip = skip;
        this.index = index;
        this.effectParams = SessionMode.EffectParams;
    }
}

class DrumMode extends PadMode {
    static EffectParams = [];

    constructor(id, index) {
        super();
        this.id = id;
        this.effectParams = DrumMode.EffectParams;
        this.index = index;
    }
}

class HuiMode {
    constructor(id, color, toggleColor, effect, index) {
        this.id = id;
        this.color = color;
        this.toggleColor = toggleColor;
        this.effect = effect;
        this.index = index;
    }
}

// These sections are found in surface.xml under PadSection element
// Might use them later.
//var PadSectionID;
//(function (PadSectionID) {
//    PadSectionID["kMain"] = "PadDrumSectionElement";
//    PadSectionID["kSession"] = "PadSessionSectionElement";
//    PadSectionID["kUser"] = "PadUserDefinedSectionElement";
//    PadSectionID["kNone"] = "";
//})(PadSectionID || (PadSectionID = {}));

class Modes extends PreSonus.ControlSurfaceComponent {
    // These are the WorkFlows for when we're in Drum Layout
    static DrumModes = [
        new DrumMode('play', 0),
        new DrumMode('repeat_menu', 1),
        new DrumMode('rate_trigger', 2),
        new DrumMode('kIdle', 3) // We need a null handler for turning things off
    ];

    // These are the natively controlled layouts but we need to keep track of them.
    // MK3 25 only has buttons for Session(2), Drum(1), and Custom(5)
    // Drum Layout is the default and is the primary musicinput handler
    static DevicePadModes = [
        new DevicePadMode('custom-old', 0),     // unused
        new DevicePadMode('drum', 1),
        new DevicePadMode('session', 2),
        new DevicePadMode('scalechords', 3),    // unused but here for MK3 49, 61, 80
        new DevicePadMode('userchords', 4),     // unused but here for MK3 49, 61, 80
        new DevicePadMode('custom', 5)
    ];

    // These are the natively controlled Pot modes but we need to keep track of them.
    // MK3 25 only has buttons for Volume(1), Device(2), Pan(3), Sends(4), and Custom(6)
    static DevicePotModes = [
        new DevicePotMode('custom-old', 0),     // unused
        new DevicePotMode('volume', 1),
        new DevicePotMode('device', 2),
        new DevicePotMode('pan', 3),
        new DevicePotMode('sendA', 4),
        new DevicePotMode('sendB', 5),
        new DevicePotMode('custom', 6)  // added this to remove error when selecting custom as 6 is returned, not 0
    ];

    // These are the WorkFlows for when we're in Session Layout
    static SessionModes = [
        new SessionMode('stepedit', '#AAAA00', false, 0),
        new SessionMode('eventedit', '#AAAA00', false, 1),
        new SessionMode('setup', '#0000FF', false, 2),
        new SessionMode('bank', '#00FF00', false, 3),
        new SessionMode('hui', '#38FFCC', false, 4),
        new SessionMode('loopedit', 'aqua', true, 5)
    ];

    // These are the modes for when we're in HUI Layout
    static HuiModes = [
        new HuiMode('monitor', '#00A9FF', ['#00454F', '#00A9FF'], Effect.NONE, 0),
        new HuiMode('arm', '#FF4C87', ['#202020','#FF4C87'], Effect.PULSE, 1),
        new HuiMode('solo', '#FFE126', ['#392B00', '#FFE126'], Effect.NONE, 2),
        new HuiMode('mute', '#874CFF', ['#0F0030', '#874CFF'], Effect.NONE, 3)
    ];
            
    static createMap(modes) {
        const map = new Map();
        modes.forEach((mode) => {
            map.set(mode.id, mode.index);
            mode.nextMode = modes[mode.index + 1] || modes[0];
        });
        return map;
    }
    
    static devicePadModeIdToIndexMap = Modes.createMap(Modes.DevicePadModes);
    static devicePotModeIdToIndexMap = Modes.createMap(Modes.DevicePotModes);
    static sessionModeIdToIndexMap = Modes.createMap(Modes.SessionModes);
    static drumModeIdToIndexMap = Modes.createMap(Modes.DrumModes);
    static huiModeIdToIndexMap = Modes.createMap(Modes.HuiModes);

    constructor(hostComponent, bankCount) {
        super();
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
  
        // The basic component does not send a bankCount, so we need to check if this was the caller before proceeding and return early.
        if( ! bankCount )
            return;
        
        // add alias parameters for vpots, etc.
        const channelBankElement = root.find ("MixerElement/RemoteBankElement");
        this.channels = [];
        for(let i = 0; i < bankCount; i++)
        {
            const channel = new Channel();

            channel.genericElement = root.getGenericMapping().getElement(0).find ("knob[" + i + "]");
            channel.channelElement = channelBankElement.getElement(i);
            channel.sendsBankElement = channel.channelElement.find("SendsBankElement"); // for SendA and SendB found in surface.xml
            
            channel.potValue = paramList.addAlias("potValue" + i); // vpots

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

    // Create the Drum Mode handlers
    setupDrumModes(_padElement, _repeatRates, _repeatRateAlias) {
        this.drumElement = _padElement;

        const padComponent = _padElement.component;
        padComponent.setPadColoringSupported(true);
        Host.Console.writeLine(`Setting up ${Modes.DrumModes.length} Drum Mode handlers`);
        Modes.DrumModes.forEach((mode, i) => {
            switch(mode.id) {
                case 'play':
                    Host.Console.writeLine(`setupDrumModes: Setting up play mode for id: ${mode.id}`);
                    // Create a handler for the pad component to handle music input
                    padComponent.addHandlerForRole(PreSonus.PadSectionRole.kMusicInput);
                    this.params.display.setValue(1, true); // Set the display mode to dimmed colors 1=dimmed colors, 2=bright colors
                    padComponent.getHandler(i).setDisplayMode(PreSonus.MusicPadDisplayMode.kDimmedColors);
                    padComponent.getHandler(i).setPadColor(Color.References.DEFAULT_BANK);
                    for(let ii = 0; ii < this.bankCount; ii++) {
                        padComponent.getHandler(i).setBankColor(ii, Color.Bank[i]);
                        Host.Console.writeLine(`PLAY: Setting color for padComponent handler ${i}, bank ${ii} to ${Color.Bank[i]}`);
                    }

                    break;
                    case 'repeat_menu':
                        Host.Console.writeLine(`setupDrumModes: Setting up repeat_menu mode for id: ${mode.id}`);
                        const commands = [];
                        PreSonus.PadSection.addCommand(commands, 6, "Note Repeat", "Quantize");
                        PreSonus.PadSection.addCommand(commands, 7, "Note Repeat", "Aftertouch");
                    
                        mode.addRenderHandler(function(host, root) {
                            const ele = host.noteRepeatElement;
                            const quantizeValue = ele.getParamValue('quantize');
                            this.toggle(6, quantizeValue, '#222200', '#00FF00');
                            const pressureHandlingValue = ele.getParamValue('pressureHandling');
                            this.toggle(7, pressureHandlingValue, '#222200', '#00FF00');
                        });
                    
                        padComponent.addCommandInputHandler(commands);
                        break;
                case 'rate_trigger':
                    Host.Console.writeLine(`setupDrumModes: Setting up rate_trigger mode for id: ${mode.id}`);
                    padComponent.addHandlerForRole(PreSonus.PadSectionRole.kRateTrigger);
                    padComponent.getHandler(i).setPadColor(Color.References.RATE_TRIGGER);
                    for (const [key, value] of Object.entries(_repeatRates)) {
                        padComponent.setPadRate(key, value);
                    }
                    break;
                default:
                    padComponent.addNullHandler();
                    Host.Console.writeLine(`Null handler added for drum mode id: ${mode.id}`);
                    break;
            }
            // Global Initiations for Drum Modes
            mode.init(i, padComponent);
        });
    }
    /**
     * Sets up session modes for the given pad element, user-defined element, and bank menu element.
     * 
     * @param {Object} _padElement - The pad element to set up session modes for.
     * @param {Object} _userDefined - The user-defined element to set up session modes for.
     * @param {Object} _bankMenuElement - The bank menu element to set up session modes for.
     */
    setupSessionModes(_padElement, _userDefined, _bankMenuElement) {
        Host.Console.writeLine("Entered setupSessionModes");
        
        // Assign the session and user-defined elements
        this.sessionElement = _padElement;
        this.userDefinedElement = _userDefined;
        
        // Get the pad component and enable pad coloring support
        const padComponent = _padElement.component;
        padComponent.setPadColoringSupported(true);
        _userDefined.component.setPadColoringSupported(true);

        // Add colors to the user-defined component's pad palette
        Object.keys(Color.PRESONUS_SNAP).forEach((key, index) => {
            if (index % 2 === 0) {
                _userDefined.component.addPadPaletteColor('#' + Color.convert(key).hex);
            }
        });
        
        Color.SnapColors.forEach(color => {
            _userDefined.component.addPadPaletteColor(color);
        });

        Host.Console.writeLine("Setting up session modes ");
        // Host.Console.writeLine("sessionModeIdToIndexMap length " + sessionModeIdToIndexMap.size);
        Modes.SessionModes.forEach((mode, index) => { 
            switch(mode.id)
            {
                case 'stepedit':
                    Host.Console.writeLine(`Setting up stepedit mode for id: ${mode.id} index: ${mode.index}`);
                    padComponent.addHandlerForRole(PreSonus.PadSectionRole.kStepEdit);
                    padComponent.getHandler(index).setPadColor(Color.References.COMMAND);
                    break;

                case 'eventedit':
                    {
                        Host.Console.writeLine(`Setting up eventedit mode for id: ${mode.id} index: ${mode.index}`);
                        const commands = [];
                        PreSonus.PadSection.addCommand (commands, 10, "Edit", "Duplicate", 0, null, '#E2D762');
                        PreSonus.PadSection.addCommand (commands, 15, "Edit", "Delete", 0, null, '#FF0000');
                        // NOTE: macro command names contain the base64-encoded macro filename (e.g. "Vel +10")
                        PreSonus.PadSection.addCommand (commands, 6, "Macros", "Macro VmVsIC0xMA==", 0, null, '#448800');
                        PreSonus.PadSection.addCommand (commands, 7, "Macros", "Macro VmVsICsxMA==", 0, null, '#00AA00');

                        padComponent.addCommandInputHandler(commands);
                        padComponent.getHandler(index).setPadColor(Color.References.COMMAND);
                    } break;

                case 'setup':
                    {
                        Host.Console.writeLine(`Setting up setup mode for id: ${mode.id} index: ${mode.index}`);
                        const commands = [];
                        const userCommands = [];

                        // make first 8 pads user-assignable
                        for(let ii = 0; ii < 8; ii++)
                            PreSonus.PadSection.addCommand(userCommands, ii, "", "", PreSonus.PadSection.kCommandItemUserAssignable);
                        _userDefined.component.addCommandInputHandler(userCommands);
                        // We activate userdefined commands here as the xml will only enable this component in setup mode
                        _userDefined.component.setActiveHandler(0);

                        PreSonus.PadSection.addCommand(commands, 8, "Transport", "Tap Tempo", PreSonus.PadSection.kCommandItemDirect, null, '#0000FF');

                        PreSonus.PadSection.addCommand(commands, 10, "Edit", "Duplicate", 0, null, '#E2D762');

                        PreSonus.PadSection.addCommand(commands, 12, "Transport", "Click");
                        PreSonus.PadSection.addCommand(commands, 13, "Transport", "Precount");

                        PreSonus.PadSection.addCommand(commands, 15, "Edit", "Delete", 0, null, '#FF0000');

                        mode.addRenderHandler( function(host, root) {
                            this.setEffect(8, Effect.PULSE);
                            this.setEffect(15, Effect.FLASH);

                            const ele = host.metronomeElement;
                            this.toggle(12, ele.getParamValue('clickOn'), '#222200', '#00FF00');
                            this.toggle(13, ele.getParamValue('precount'), '#222200', '#00FF00');
                        });

                        padComponent.addCommandInputHandler(commands);
                        padComponent.getHandler(index).setPadColor(Color.References.COMMAND);
                    } break;
                case 'bank':
                    {
                        Host.Console.writeLine(`Setting up bank mode for id: ${mode.id} index: ${mode.index}`);
                        const items = [];
                        for(let ii = 0; ii < this.bankCount; ii++)
                            items.push ({"padIndex": ii, "value": ii, "color": Color.Bank[ii]});

                        padComponent.addMenuHandler(items, _bankMenuElement);
                        padComponent.getHandler(index).setPadColor(Color.References.DEFAULT_BANK);
                    } break;
                case 'loopedit':
                    {
                        Host.Console.writeLine(`Setting up loopedit mode for id: ${mode.id} index: ${mode.index}`);
                        const commands = [];
                        PreSonus.PadSection.addCommand(commands, 0, "Zoom", "Zoom to Loop", 0, null, '#00FFFF');

                        PreSonus.PadSection.addCommand(commands, 1, "Transport", "Loop Follows Selection", 0, null, '#005500');

                        PreSonus.PadSection.addCommand(commands, 6, "Transport", "Shift Loop Backwards");
                        PreSonus.PadSection.addCommand(commands, 7, "Transport", "Shift Loop");

                        PreSonus.PadSection.addCommand(commands, 8, "Transport", "Set Loop Start", 0, null, '#00AA00');
                        PreSonus.PadSection.addCommand(commands, 9, "Transport", "Rewind Bar", 'autorepeat', null, '#0000FF');
                        PreSonus.PadSection.addCommand(commands, 14, "Transport", "Forward Bar", 'autorepeat', null, '#0000FF');
                        PreSonus.PadSection.addCommand(commands, 15, "Transport", "Set Loop End", 0, null, '#FF0000');

                        padComponent.addCommandInputHandler(commands);
                        padComponent.getHandler(index).setPadColor(Color.References.COMMAND);

                        mode.addActiveRenderHandler( function(host, root) {
                            host.modes.params.scene_button.effect.setValue(Effect.PULSE);
                        });
                    } break;
                default:
                    // Host.Console.writeLine(`Setting up default mode and adding null handler for id: ${mode.id} index: ${mode.index}`);
                    padComponent.addNullHandler(); // Add a null handler for the default case which is SessionMode 'hui' index 4
                    break;
            }
            // Global Initiations For Session Modes
            Host.Console.writeLine(`Global Initiations For Session Modes ${mode.id} with index ${mode.index}`);
            mode.init(index, padComponent);
            mode.addActiveRenderHandler( function(host, root) {
                Host.Console.writeLine(`Setting active render handler for ${mode.id}`);
                Host.Console.writeLine(`We're going to go check if host.modes.getCurrentDevicePadMode().id === 'session' (true/false): ` + (host.modes.getCurrentDevicePadMode().id === 'session'));
                if( host.modes.getCurrentDevicePadMode().id === 'session')
                    host.modes.params.scene_button.color.fromString(mode.color);
            });
        });
    }
    
    storeState() {
        Host.Console.writeLine(`Storing state currentDrum, Session, DevicePad`);
        this.store = {
            drum: this.getCurrentDrumMode(),
            session: this.getCurrentSessionMode(),
            device_pad: this.getCurrentDevicePadMode(),
        };
    }

    restoreState() {
        if( this.store )
        {
            Host.Console.writeLine(`Restoring state currentDrum, Session, DevicePad`);
            this.setDevicePadMode(this.store.device_pad.id);
            this.setSessionMode(this.store.session.id);
            this.setDrumMode(this.store.drum.id);
            this.store = null;
        }
    }

    // Other Functions

    activateDrumHandler() {
        // this.params.drum.value is the handlerindex of the drumElement.component
        Host.Console.writeLine(`Inside activateDrumHandler ${this.params.drum.value}`);
        this.drumElement.component.setActiveHandler(this.params.drum.value);
    }

    setPadFocusWhenPressed(active) {
        Host.Console.writeLine(`Inside setPadFocusWhenPressed`);
        this.getDrumMode('play').handler.setFocusPadWhenPressed(active);
    }
    
    activateSessionHandler() {
        // this.params.session.value is the handlerindex of the sessionElement.component returned by getCurrentSessionMode
        // this.getCurrentSessionMode().index is the handlerindex of the sessionElement.component
        const mode = this.getCurrentSessionMode();
        Host.Console.writeLine(`Activating session handler getCurrentSessionMode ${mode.index}`);
        
        this.sessionElement.component.setActiveHandler(mode.index);
        if (!this.isDrumMode()) {
            Host.Console.writeLine(`Suspending processing of drum elements by setting active handler to null`);
            this.drumElement.component.setActiveHandler(3); // Suspend processing of the drum element by assigning it to the null handler while we're not in Drum Layout
        }
        this.userDefinedElement.component.suspendProcessing(mode.id != 'setup');
    }

    setModifierActive(active) {
        Host.Console.writeLine(`Inside setModifierActive`);
        this.drumElement.component.setModifierActive(active);
        this.sessionElement.component.setModifierActive(active);
    }

    setDrumFullVelocityMode(active) {
    // The original function name was setFullVelocityMode but this is a native method of Presonus.component.
    // so to avoide collisions renamed to setDrumFullVelocityMode here and in LaunchKeyMKIIIComponent
        Host.Console.writeLine(`Inside setDrumFullVelocityMode`);
        this.drumElement.component.setFullVelocityMode(active)
    }

    setDrumSessionCurrentBank(bank) {
        Host.Console.writeLine(`Inside setCurrentBank`);
        this.drumElement.component.setCurrentBank(bank);
        this.sessionElement.component.setCurrentBank(bank);
    }

    // Consolidated the SetDisplayMode and toggleNextPadDisplayMode functions into one function
    // Also removed kNoColors from the display modes since I removed the LED State from the pads
    toggleNextPadDisplayMode() {
        Host.Console.writeLine(`Inside toggleNextPadDisplayMode`);
        let nextMode = this.params.display.value + 1;
        if (nextMode > 2) {
            nextMode = 1;
        }
    
        const modes = [
            null, // PreSonus.MusicPadDisplayMode.kNoColors, // index 0
            PreSonus.MusicPadDisplayMode.kDimmedColors, // index 1
            PreSonus.MusicPadDisplayMode.kBrightColors, // index 2
        ];
    
        this.params.display.setValue(nextMode, true);
        this.getDrumMode('play').handler.setDisplayMode(modes[nextMode]);
        //if (nextMode === 0) {
        //    Host.Console.writeLine(`Setting active handler to null so pads turn off`)
        //    this.drumElement.component.setActiveHandler(3); // Suspend processing of the drum element by assigning it to the null handler breifly to setstate 0.
        //} else {
        //    Host.Console.writeLine(`Setting active handler back to enabled`)
        //    this.drumElement.component.setActiveHandler(this.params.drum.value);
    //}
    // Host.Console.writeLine(`toggleNextPadDisplayMode: nextMode: ${nextMode}`);
    }

    getCurrentDevicePadMode() {
        const index = this.params.device_pad.value;
        return Modes.DevicePadModes.find(mode => mode.index === index);
    }

    setDevicePadMode(id) {
        const index = Modes.devicePadModeIdToIndexMap.get(String(id));
        //if (index !== undefined) {
            this.params.device_pad.setValue(index, true);  // Set the value of the device pad mode
        //} else {
            // Handle the case where the id is not found. We should not get here.
        //    Host.Console.writeLine(`setDevicePadMode Error: Mode with ID ${id} not found.`);
        //    return null;
        //}
    }

    getCurrentDevicePotMode() { // We need to return the mode object
        const index = this.params.device_pot.value; // This is the index of the mode (0, 1, 2) 
        // Host.Console.writeLine(`getCurrentDevicePotMode - Getting current device pot mode: ${index}`);
        return Modes.DevicePotModes.find(mode => mode.index === index);
    }

    setDevicePotMode(id) {
        const index = Modes.devicePotModeIdToIndexMap.get(String(id)); // Use the IndexMap to translate the id('custom', 'volume', 'device',etc) to an index. Replaces the need for getDevicePotMode
        Host.Console.writeLine(`setDevicePotMode - Setting device pot mode: ${id} index=${index}`);
        this.params.device_pot.setValue(index, true);
    }

    isSessionMode() {
        const currentMode = this.getCurrentDevicePadMode();
        //Host.Console.writeLine(`isSessionMode Current device pad mode: ${currentMode.id} result: ${currentMode.id === 'session'}`);
        return currentMode.id === 'session';
    }

    getSessionMode(id) {
        const index = Modes.sessionModeIdToIndexMap.get(String(id)); // Use the IndexMap to translate the id('stepedit', 'eventedit', etc) to an index. Replaces the need for getDevicePadMode
        //if (index !== undefined) {
            return Modes.SessionModes[index];
        //}
        //return null;
    }

    getCurrentSessionMode() {
        const index = this.params.session.value;
        if (index >= 0 && index < Modes.SessionModes.length) { // Check if the index is within the bounds of the array
            return Modes.SessionModes[index];
        }
        return null;
    }

    /**
     * Sets the session mode based on the provided ID.
     * 
     * @param {string} id - The ID of the session mode to set.
     */
    setSessionMode(id) {
        // Retrieve the session mode object based on the provided ID
        const mode = this.getSessionMode(id); 

        // Check if the mode is 'stepedit' or 'eventedit'
        if (mode.id === 'stepedit' || mode.id === 'eventedit') {
            // Determine the index based on the last track editor type
            const index = (this.lastTrackEditorType === PreSonus.HostUtils.kEditorTypePattern) 
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
    }

    toggleNextSessionMode() {
        Host.Console.writeLine(`Toggling next session mode getCurrentSessionMode`);
        const currentMode = this.getCurrentSessionMode();
        let nextMode = currentMode.nextMode;
    
        // Skip 'loopedit' mode because we are only supposed to enter it via scenehold + play button
        if (nextMode.id === 'loopedit') {
            nextMode = nextMode.nextMode;
        }
    
        this.setSessionMode(nextMode.id);
    }

    getHuiMode(id) {
        const modeIndex = Modes.huiModeIdToIndexMap.get(String(id));
        Host.Console.writeLine(`getHuiMode: Getting Hui mode: ${id} index=${modeIndex}`);
        return Modes.HuiModes[modeIndex];
    }

    getCurrentHuiMode() {
        // Access the current Hui mode based on this.params.hui.value
        const modeIndex = this.params.hui.value;
        if (modeIndex >= 0 && modeIndex < Modes.HuiModes.length) {
            Host.Console.writeLine(`getCurrentHuiMode: Getting current Hui mode: ${modeIndex}`);
            return Modes.HuiModes[modeIndex];
        }
        return null;
    }

    setHuiMode(id) {
        const modeIndex = this.getHuiMode(id).index;
        Host.Console.writeLine(`setHuiMode: Setting Hui mode: ${id} index=${modeIndex}`);
        this.params.hui.setValue(modeIndex, true);
    }

    toggleNextHuiMode() {
        // Get the current Hui mode
        Host.Console.writeLine(`Inside toggleNextHuiMode`);
        const currentMode = this.getCurrentHuiMode();
        // Set the Hui mode to the next mode using the nextMode property
        this.setHuiMode(currentMode.nextMode.id);
    }

    isDrumMode() {
        // Access the .id property of the object returned by getCurrentDevicePadMode()
        const currentMode = this.getCurrentDevicePadMode();
        // Host.Console.writeLine(`isDrumMode: Current device pad mode: ${currentMode.id} result: ${currentMode.id === 'drum'}`);
        return currentMode.id === 'drum';
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
        this.params.drum.setValue(modeIndex, true);
    }
}