include_file("./resources/controlsurfacecomponent.js");

const Effect = {
    NONE: 0,
    FLASH: 1,
    PULSE: 2
};

function Channel() {
    // Log the properties of the Channel instance
    logObjectProperties(this);
       
    this.connectPot = function(element, paramName) {
        if (!paramName) {
            paramName = element;
            element = this.channelElement;
        }
        logObjectProperties(element);
        logObjectProperties(this.potValue);
        return element.connectAliasParam(this.potValue, paramName);
    }

    this.connectSelect = function(paramName) {
        Host.Console.writeLine(`Inside connectSelect`);
        return this.channelElement.connectAliasParam(this.padSelect, paramName);
    }

    this.connectSelectColor = function(paramName) {
        Host.Console.writeLine(`Inside connectSelectColor`);
        return this.channelElement.connectAliasParam(this.padSelectColor, paramName);
    }

    this.connectToggle = function(element, paramName) {
        if (!paramName) {
            Host.Console.writeLine(`Channel class connectToggle: No paramName provided, setting paramName to element ${element}`); // Log the element
            paramName = element;
            element = this.channelElement;
        }
        Host.Console.writeLine(`Channel() connectToggle: Connecting toggle to element: ${element}, paramName: ${paramName}`);
        Host.Console.writeLine(`Is this.padToggle null or undefined?:: ${this.padToggle.value === null || this.padToggle.value === undefined}`);
        return element.connectAliasParam(this.padToggle, paramName);
    }

    this.updateSelectEffect = function() {
        Host.Console.writeLine(`Inside updateSelectEffect`);
        if (this.channelElement.getParamValue('selected'))
            return this.padSelectEffect.setValue(Effect.PULSE);

        this.padSelectEffect.setValue(Effect.NONE);
    }

    this.updateToggle = function(color_off, color_on, effect) {
        Host.Console.writeLine(`updateToggle - this.padToggle: ${this.padToggle.value}`);
        if (this.padToggle.value === null || this.padToggle.value === undefined) { // Check if the value is null or undefined
            //this.padToggle.setValue(0); // to handle undefined values.
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
    
    /**
     * Checks if the pad is set to generic.
     * @returns {boolean} - True if the pad is generic, false otherwise.
     */
    this.isPadGeneric = function () {
        return this.padGeneric;
    }
    
    /**
     * Checks if the pot is set to generic.
     * @returns {boolean} - True if the pot is generic, false otherwise.
     */
    this.isPotGeneric = function () {
            return this.potGeneric;
        }

    this.setPotGeneric = function() {
        this.genericElement.connectAliasParam(this.potValue, 'value');
        this.padGeneric = true;
    }

    this.setToggleGeneric = function() {
        Host.Console.writeLine(`Inside setToggleGeneric`);
        this.genericElement.connectAliasParam(this.padToggle, 'value');
    }

    this.setSelectGeneric = function() {
        Host.Console.writeLine(`Inside setSelectGeneric`);
        this.genericElement.connectAliasParam(this.padSelect, 'value');
        this.genericElement.connectAliasParam(this.padSelectColor, 'value');
    }

    this.setPadGeneric = function() {
        Host.Console.writeLine(`Inside setPadGeneric`);
        this.setToggleGeneric();
        this.setSelectGeneric();
        this.potGeneric = true;
    }
}

function PadMode() {
    this.effectParams;

    this.init = function(index, component) {
        this.index = index;
        this.component = component;
        this.handler = component.getHandler(index);
    }

    this.addRenderHandler = function(func) {
        Host.Console.writeLine(`Entered addRenderHandler for ${this.id}`);
        
        if (!this.renderHandlers) {
            this.renderHandlers = [];
        } else {
            Host.Console.writeLine(`renderHandlers array already exists for ${this.id}, length: ${this.renderHandlers.length}`);
        }
        
        this.renderHandlers.push(func.bind(this));
        Host.Console.writeLine(`Added new render handler for ${this.id}, new length: ${this.renderHandlers.length}`);
    }

    this.render = function(host, root) {
        Host.Console.writeLine(`Entered render function for ${this.id}`);
        this.resetEffects();
        if( ! this.renderHandlers )
            return;
        this.renderHandlers.forEach(handler => handler(host, root));
    }

    this.addActiveRenderHandler = function(func) {
        Host.Console.writeLine(`Entering active render handler`);
        if( ! this.activeRenderHandlers )
            this.activeRenderHandlers = [];
        this.activeRenderHandlers.push(func.bind(this));
    }

    this.activeRender = function(host, root) {
        // Reset the scene button
        Host.Console.writeLine(`In activeRender for ${this.id}`);
        host.modes.params.scene_button.color.setValue(0);
        host.modes.params.scene_button.effect.setValue(0);
        host.modes.params.ssm_button.color.setValue(0);
        host.modes.params.ssm_button.effect.setValue(0);
        if( ! this.activeRenderHandlers )
            return
        this.activeRenderHandlers.forEach(handler => handler(host, root));
    }

    this.setColor = function(pad, value) {
        Host.Console.writeLine(`Setting color for pad: ${pad}, value: ${value}`);
        if (value.charAt(0) === '#') {
            value = Color.hexToInt(value);
        }
        return this.component.setPadColor(pad, value);
    }

    this.toggle = function(pad, value, color_off, color_on) {
        Host.Console.writeLine(`Toggling pad: ${pad}, value: ${value}`);
        this.component.setPadState(pad, true);
        return this.setColor(pad, (value) ? color_on : color_off);
    }

    this.setEffect = function(pad, effect) {
        this.effectParams[pad].setValue(effect);
    }

    this.resetEffects = function() {
        this.effectParams.forEach(param => param.setValue(Effect.NONE));
    }
}

// Access by Index
//      const currentModeIndex = 1; // Example index for 'drum'
//      const currentMode = Modes.DevicePadModes[currentModeIndex];
//      console.log(currentMode); // Output: DevicePadMode { id: 'drum', index: 1 }
//
// Using a Map for quick lookup
//      const modeId = 'drum';
//      const modeIndex = devicePadModeIdToIndexMap.get(modeId);
//      const currentMode = Modes.DevicePadModes[modeIndex];
//      console.log(currentMode); // Output: DevicePadMode { id: 'drum', index: 1 }
//
// Iterating through the array
//      const modeId = 'drum';
//      const currentMode = Modes.DevicePadModes.find(mode => mode.id === modeId);
//      console.log(currentMode); // Output: DevicePadMode { id: 'drum', index: 1 }
// 
// Using a Method to get the current mode
//      Modes.getCurrentDevicePadMode = function(modeId) {
//          const modeIndex = devicePadModeIdToIndexMap.get(modeId);
//          return this.DevicePadModes[modeIndex];
//      };
//      const currentMode = Modes.getCurrentDevicePadMode('drum');
//      console.log(currentMode); // Output: DevicePadMode { id: 'drum', index: 1 }

function DevicePadMode(id, index) 
{
    this.id = id;
    this.index = index;
};
Modes.DevicePadModes = [
    new DevicePadMode('custom-old', 0), // The real custom0 mode is at index 5
    new DevicePadMode('drum', 1),
    new DevicePadMode('session', 2),
    new DevicePadMode('scalechords', 3),
    new DevicePadMode('userchords', 4),
    new DevicePadMode('custom', 5)
];

// Preprocess DevicePadModes
const devicePadModeIdToIndexMap = new Map();
Modes.DevicePadModes.forEach((mode) => {
    devicePadModeIdToIndexMap.set(mode.id, mode.index); // Use the index property
    // Link to next mode if applicable
    mode.nextMode = Modes.DevicePadModes[mode.index + 1] || Modes.DevicePadModes[0]; // Adjusted to use the index property
});

DevicePotMode = function(id, index)
{
    this.id = id;
    this.index = index;
};
Modes.DevicePotModes = [
    new DevicePotMode('custom', 0),
    new DevicePotMode('volume', 1),
    new DevicePotMode('device', 2),
    new DevicePotMode('pan', 3),
    new DevicePotMode('sendA', 4),
    new DevicePotMode('sendB', 5),
    new DevicePotMode('custom', 6)  // added this to remove error when selecting custom as 6 is returned, not 0
];

// Preprocess DevicePotModes
const devicePotModeIdToIndexMap = new Map();
Modes.DevicePotModes.forEach((mode) => {
    devicePotModeIdToIndexMap.set(mode.id, mode.index); // Use the index property
    // Link to next mode if applicable
    mode.nextMode = Modes.DevicePotModes[mode.index + 1] || Modes.DevicePotModes[0]; // Adjusted to use the index property
});

SessionMode.EffectParams = [];
SessionMode.prototype = new PadMode();
function SessionMode(id, color, skip, index) {
    this.id = id;
    this.color = color;
    this.skip = skip;
    this.index = index; // Add index property

    this.effectParams = SessionMode.EffectParams;
};

// Update instantiation of SessionMode objects with index
Modes.SessionModes = [
    new SessionMode('stepedit', '#AAAA00', false, 0),
    new SessionMode('eventedit', '#AAAA00', false, 1),
    new SessionMode('setup', '#0000FF', false, 2),
    new SessionMode('bank', '#00FF00', false, 3),
    new SessionMode('hui', '#38FFCC', false, 4),
    new SessionMode('loopedit', 'aqua', true, 5)
];

// Preprocess SessionModes
const sessionModeIdToIndexMap = new Map();
Modes.SessionModes.forEach((mode) => {
    sessionModeIdToIndexMap.set(mode.id, mode.index); // Use the index property
    // Link to next mode if applicable
    mode.nextMode = Modes.SessionModes[mode.index + 1] || Modes.SessionModes[0]; // Adjusted to use the index property
});

DrumMode.EffectParams = [];
DrumMode.prototype = new PadMode();
function DrumMode(id, index)
{
    this.id = id;
    this.effectParams = DrumMode.EffectParams;
    this.index = index;
};
Modes.DrumModes = [
    new DrumMode('play', 0),
    new DrumMode('repeat_menu', 1),
    new DrumMode('rate_trigger', 2)
];

// Preprocess DrumModes
const drumModeIdToIndexMap = new Map();
Modes.DrumModes.forEach((mode) => {
    drumModeIdToIndexMap.set(mode.id, mode.index);
    // Link to next mode if applicable
    mode.nextMode = Modes.DrumModes[mode.index + 1] || Modes.DrumModes[0]; // Or Modes.DrumModes[0] to loop
});

Modes.HuiMode = function( id, color, toggleColor, effect, index )
{
    this.id = id;
    this.color = color;
    this.toggleColor = toggleColor;
    this.effect = effect;
    this.index = index;
};
Modes.HuiModes = [
    new Modes.HuiMode('monitor', '#00A9FF', ['#00454F', '#00A9FF'], Effect.NONE, 0),
    new Modes.HuiMode('arm', '#FF4C87', ['#202020','#FF4C87'], Effect.PULSE, 1),
    new Modes.HuiMode('solo', '#FFE126', ['#392B00', '#FFE126'], Effect.NONE, 2),
    new Modes.HuiMode('mute', '#874CFF', ['#0F0030', '#874CFF'], Effect.NONE, 3)
];

// Preprocess HuiModes
const huiModeIdToIndexMap = new Map();
Modes.HuiModes.forEach((mode) => {
    huiModeIdToIndexMap.set(mode.id, mode.index);
    // Link to next mode if applicable
    mode.nextMode = Modes.HuiModes[mode.index + 1] || Modes.HuiModes[0]; 
});

function Modes(hostComponent, bankCount) {
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

        // The basic component does not send a bankCount, so we need to check if this was the caller before proceeding
        if( ! bankCount )
            return;
        // add alias parameters for vpots, etc.
        let channelBankElement = root.find ("MixerElement/RemoteBankElement");
        this.channels = [];
        for(let i = 0; i < bankCount; i++)
        {
            let channel = new Channel();

            channel.genericElement = root.getGenericMapping().getElement(0).find ("knob[" + i + "]");
            channel.channelElement = channelBankElement.getElement(i);
            channel.sendsBankElement = channel.channelElement.find("SendsBankElement");

            // Log if any channelElement items are null or undefined
            if (channel.genericElement === null || channel.genericElement === undefined) {
                Host.Console.writeLine(`channel.genericElement is ${channel.genericElement} for channelBankElement.getElement(${i})`);
            }
            if (channel.channelElement === null || channel.channelElement === undefined) {
                Host.Console.writeLine(`channel.channelElement is ${channel.channelElement} for channelBankElement.getElement(${i})`);
            }
            if (channel.sendsBankElement === null || channel.sendsBankElement === undefined) {
                Host.Console.writeLine(`channel.sendsBankElement is ${channel.sendsBankElement} for channelBankElement.getElement(${i})`);
            }
            
            channel.potValue = paramList.addAlias("potValue" + i);

            channel.padSelect = paramList.addAlias("padSelectValue" + i);
            channel.padSelectColor = paramList.addAlias("padSelectColorValue" + i);
            channel.padSelectEffect = paramList.addInteger(0, 2, "padSelectEffectValue" + i);

            channel.padToggle = paramList.addAlias("padToggleValue" + i);
            channel.padToggleColor = paramList.addColor("padToggleColorValue" + i);
            channel.padToggleEffect = paramList.addInteger(0, 2, "padToggleEffectValue" + i);

            this.channels.push(channel);

            // Log the contents of each channel using log_obj
            Host.Console.writeLine(`Channel ${i}:`);
            logObjectProperties(channel.genericElement);
            logObjectProperties(channel.channelElement);
            logObjectProperties(channel.sendsBankElement);
            logObjectProperties(channel.potValue);
            logObjectProperties(channel.padSelect);
            logObjectProperties(channel.padSelectColor);
            logObjectProperties(channel.padSelectEffect);
            logObjectProperties(channel.padToggle);
            logObjectProperties(channel.padToggleColor);
            logObjectProperties(channel.padToggleEffect);
        }

        for( let i = 0; i < 16; i++ )
            DrumMode.EffectParams.push( paramList.addInteger(0, 2, "drumPadEffect["+i+"]") );
        for( let i = 0; i < 8; i++ ) {
            SessionMode.EffectParams.push( paramList.addInteger(0, 2, "sessionHigherPadEffect["+i+"]") );
            SessionMode.EffectParams.push( paramList.addInteger(0, 2, "sessionLowerPadEffect["+i+"]") );
        }
        this.lastTrackEditorType = PreSonus.HostUtils.kEditorTypeNone;
    
    this.setupDrumModes = function( _padElement, _repeatRates, _repeatRateAlias )
    {
        this.drumElement = _padElement;

        let padComponent = _padElement.component;
        padComponent.setPadColoringSupported(true);
        Host.Console.writeLine("Setting up drum modes " + Modes.DrumModes.length);
        Modes.DrumModes.forEach((mode, i) => {
            switch(mode.id) {
                case 'play':
                    Host.Console.writeLine("setupDrumModes: Setting up play mode " + mode + "id: " + mode.id);
                    padComponent.addHandlerForRole(PreSonus.PadSectionRole.kMusicInput);
                    this.params.display.setValue(1, true);
                    padComponent.getHandler(i).setDisplayMode(PreSonus.MusicPadDisplayMode.kDimmedColors);
                    padComponent.getHandler(i).setPadColor(Color.References['default_bank']);
                    for(let ii = 0; ii < this.bankCount; ii++) {
                        padComponent.getHandler(i).setBankColor(ii, Color.Bank[i]);
                        Host.Console.writeLine(`PLAY: Setting color for padComponent handler ${i}, bank ${ii} to ${Color.Bank[i]}`);
                    }
                    break;
                    case 'repeat_menu':
                        Host.Console.writeLine("setupDrumModes: Setting up repeat_menu mode " + mode + " id: " + mode.id);
                        let commands = [];
                        Host.Console.writeLine("Initializing commands array");
                    
                        PreSonus.PadSection.addCommand(commands, 6, "Note Repeat", "Quantize");
                        Host.Console.writeLine("Added command: Note Repeat, Quantize to commands array");
                    
                        PreSonus.PadSection.addCommand(commands, 7, "Note Repeat", "Aftertouch");
                        Host.Console.writeLine("Added command: Note Repeat, Aftertouch to commands array");
                    
                        mode.addRenderHandler(function(host, root) {
                            Host.Console.writeLine("Render handler called for repeat_menu mode");
                            let ele = host.noteRepeatElement;
                            Host.Console.writeLine("Retrieved noteRepeatElement from host");
                    
                            let quantizeValue = ele.getParamValue('quantize');
                            Host.Console.writeLine("Quantize value: " + quantizeValue);
                            this.toggle(6, quantizeValue, '#222200', '#00FF00');
                            Host.Console.writeLine("Toggled button 6 with quantize value");
                    
                            let pressureHandlingValue = ele.getParamValue('pressureHandling');
                            Host.Console.writeLine("Pressure handling value: " + pressureHandlingValue);
                            this.toggle(7, pressureHandlingValue, '#222200', '#00FF00');
                            Host.Console.writeLine("Toggled button 7 with pressure handling value");
                        });
                    
                        padComponent.addCommandInputHandler(commands);
                        Host.Console.writeLine("Added command input handler to padComponent");
                        break;
                case 'rate_trigger':
                    Host.Console.writeLine("setupDrumModes: Setting up rate_trigger mode " + mode + "id: " + mode.id);
                    padComponent.addHandlerForRole(PreSonus.PadSectionRole.kRateTrigger);
                    padComponent.getHandler(i).setPadColor(Color.References['rate_trigger']);
                    for(let key in _repeatRates)
                        padComponent.setPadRate(key, _repeatRates[key]);
                    break;
                default:
                    padComponent.addNullHandler();
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
    this.setupSessionModes = function( _padElement, _userDefined, _bankMenuElement )
    {
        Host.Console.writeLine("Entered setupSessionModes");
        
        // Assign the session and user-defined elements
        this.sessionElement = _padElement;
        this.userDefinedElement = _userDefined;
        
        // Get the pad component and enable pad coloring support
        let padComponent = _padElement.component;
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
        Host.Console.writeLine("sessionModeIdToIndexMap length " + sessionModeIdToIndexMap.size);
        //for(let i = 0; i < Modes.SessionModes.length; i++)
        //{
        //    let mode = Modes.SessionModes[i];
        Modes.SessionModes.forEach((mode, index) => { // mode=Modes.SessionModes[i]
            switch(mode.id)
            {
                case 'stepedit':
                    Host.Console.writeLine(`Setting up stepedit mode for id: ${mode.id} index: ${mode.index}`);
                    padComponent.addHandlerForRole(PreSonus.PadSectionRole.kStepEdit);
                    padComponent.getHandler(index).setPadColor(Color.References['command']);
                    break;

                case 'eventedit':
                    {
                        Host.Console.writeLine(`Setting up eventedit mode for id: ${mode.id} index: ${mode.index}`);
                        const commands = []; // Initialize the commands array changed from let to const
                        PreSonus.PadSection.addCommand (commands, 10, "Edit", "Duplicate", 0, null, '#E2D762');
                        PreSonus.PadSection.addCommand (commands, 15, "Edit", "Delete", 0, null, '#FF0000');
                        // NOTE: macro command names contain the base64-encoded macro filename (e.g. "Vel +10")
                        PreSonus.PadSection.addCommand (commands, 6, "Macros", "Macro VmVsIC0xMA==", 0, null, '#448800');
                        PreSonus.PadSection.addCommand (commands, 7, "Macros", "Macro VmVsICsxMA==", 0, null, '#00AA00');

                        padComponent.addCommandInputHandler(commands);
                        padComponent.getHandler(index).setPadColor(Color.References['command']);
                    } break;

                case 'setup':
                    {
                        Host.Console.writeLine(`Setting up setup mode for id: ${mode.id} index: ${mode.index}`);
                        const commands = []; // Initialize the commands array changed from let to const
                        const userCommands = []; // Initialize the userCommands array changed from let to const

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
                        padComponent.getHandler(index).setPadColor(Color.References['command']);
                    } break;
                case 'bank':
                    {
                        Host.Console.writeLine(`Setting up bank mode for id: ${mode.id} index: ${mode.index}`);
                        const items = [];
                        for(let ii = 0; ii < this.bankCount; ii++)
                            items.push ({"padIndex": ii, "value": ii, "color": Color.Bank[ii]});

                        padComponent.addMenuHandler(items, _bankMenuElement);
                        padComponent.getHandler(index).setPadColor(Color.References['default_bank']);
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
                        padComponent.getHandler(index).setPadColor(Color.References['command']);

                        mode.addActiveRenderHandler( function(host, root) {
                            host.modes.params.scene_button.effect.setValue(Effect.PULSE);
                        });
                    } break;
                default:
                    Host.Console.writeLine(`Setting up default mode and adding null handler for id: ${mode.id} index: ${mode.index}`);
                    padComponent.addNullHandler();
                    break;
            }
            // Global Initiations For Session Modes
            mode.init(index, padComponent);
            mode.addActiveRenderHandler( function(host, root) {
                Host.Console.writeLine(`Setting active render handler for ${mode.id}`);
                Host.Console.writeLine(`We're going to go check if host.modes.getCurrentDevicePadMode().id === 'session' (true/false): ` + (host.modes.getCurrentDevicePadMode().id === 'session'));
                if( host.modes.getCurrentDevicePadMode().id === 'session')
                    host.modes.params.scene_button.color.fromString(mode.color);
            });
        });
    }

    this.storeState = function() {
        Host.Console.writeLine(`Storing state currentDrum, Session, DevicePad`);
        this.store = {
            drum: this.getCurrentDrumMode(),
            session: this.getCurrentSessionMode(),
            device_pad: this.getCurrentDevicePadMode(),
        };
    }

    this.restoreState = function() {
        if( this.store )
        {
            Host.Console.writeLine(`Restoring state currentDrum, Session, DevicePad`);
            this.setDevicePadMode(this.store.device_pad.id);
            this.setSessionMode(this.store.session.id);
            this.setDrumMode(this.store.drum.id);
            this.store = null;
        }
    }

    // Device Pad Mode Functions
    //
    // getDevicePadMode      is never called anymore!!
    //
    //this.getDevicePadMode = function(id) {  
    //    const index = devicePadModeIdToIndexMap.get(String(id)); // Ensure id is a string
    //    Host.Console.writeLine(`getDevicePadMode Getting device pad mode: ${id} index=${index}`);
    //    if (index !== undefined) {
    //        Host.Console.writeLine(`getDevicePadMode Returning device pad mode index: ${Modes.DevicePadModes[index]}`);
    //        return Modes.DevicePadModes[index];
    //    }
    //    return null; // Or handle the case where the id is not found
    //}

    this.getCurrentDevicePadMode = function() { // We need to return the mode object
        const index = this.params.device_pad.value; // This is the index of the mode (0, 1, 2) 
        // Assuming `this.params.device_pad.value` directly corresponds to the index of the mode
        // Host.Console.writeLine(`getCurrentDevicePadMode - Getting current device pad mode: ${index}`);
        return Modes.DevicePadModes.find(mode => mode.index === index);
    }

    this.setDevicePadMode = function(id) {  // id is a string 'drum' or 'session'
        const index = devicePadModeIdToIndexMap.get(String(id)); // Use the IndexMap to translate the id('drum',etc) to an index. Replaces the need for getDevicePadMode
        // Host.Console.writeLine(`setDevicePadMode Trying to set device pad mode: ${id}:index=${index}`);
        if (index !== undefined) {
            this.params.device_pad.setValue(index, true);  // Set the value of the device pad mode
        } else {
            // Handle the case where the id is not found. We should not get here.
            Host.Console.writeLine(`setDevicePadMode Error: Mode with ID ${id} not found.`);
            return null;
        }
    }

    // Device Pot Mode Functions
    //
    // getDevicePotMode      is never called anymore!!
    //
    //this.getDevicePotMode = function(id) {  
        // Directly return the DevicePotMode object using the id
    //    Host.Console.writeLine(`getDevicePotMode - Getting device pot mode: ${id}`);
    //    return Modes.DevicePotModes.find(mode => mode.id === id);
    //}

    this.getCurrentDevicePotMode = function() { // We need to return the mode object
        const index = this.params.device_pot.value; // This is the index of the mode (0, 1, 2) 
        // Assuming `this.params.device_pot.value` directly corresponds to the index of the mode
        // Host.Console.writeLine(`getCurrentDevicePotMode - Getting current device pot mode: ${index}`);
        return Modes.DevicePotModes.find(mode => mode.index === index);
    }

    this.setDevicePotMode = function(id) {
        //const index = this.getDevicePotMode(id).index;
        const index = devicePotModeIdToIndexMap.get(String(id)); // Use the IndexMap to translate the id('custom', 'volume', 'device',etc) to an index. Replaces the need for getDevicePotMode
        Host.Console.writeLine(`setDevicePotMode - Setting device pot mode: ${id} index=${index}`);
        if (index !== undefined) {
            this.params.device_pot.setValue(index, true);
        } else {
            Host.Console.writeLine(`setDevicePotMode - Error: Mode with ID ${id} not found.`);
            return null;
        }
    }

    //Session Mode Functions
    this.isSessionMode = function()
    { // ${this.getCurrentDevicePadMode().id}` = a string 'drum' or 'session'
        const currentMode = this.getCurrentDevicePadMode();
        //Host.Console.writeLine(`isSessionMode Current device pad mode: ${currentMode.id} result: ${currentMode.id === 'session'}`);
        return currentMode.id === 'session';
    }

    this.getSessionMode = function(id) {  //updated to use the index property
        const index = sessionModeIdToIndexMap.get(String(id)); // Use the IndexMap to translate the id('stepedit', 'eventedit', etc) to an index. Replaces the need for getDevicePadMode
        if (index !== undefined) {
            return Modes.SessionModes[index];
        }
        return null;
    }
    
    this.getCurrentSessionMode = function() {
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
    this.setSessionMode = function(id) {
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
    }
    
    this.activateSessionHandler = function() {
        Host.Console.writeLine(`Activating session handler getCurrentSessionMode`);
        let mode = this.getCurrentSessionMode();
        this.sessionElement.component.setActiveHandler(mode.index);
        this.userDefinedElement.component.suspendProcessing(mode.id != 'setup');
    }
    this.toggleNextSessionMode = function() {
        Host.Console.writeLine(`Toggling next session mode getCurrentSessionMode`);
        let currentMode = this.getCurrentSessionMode();
        let nextMode = currentMode.nextMode;
    
        // Skip 'loopedit' mode because we are only supposed to enter it via scenehold + play button
        if (nextMode.id === 'loopedit') {
            nextMode = nextMode.nextMode;
        }
    
        this.setSessionMode(nextMode.id);
    }
    
    // Drum Mode Functions
    this.isDrumMode = function() { 
        // Access the .id property of the object returned by getCurrentDevicePadMode()
        const currentMode = this.getCurrentDevicePadMode();
        // Host.Console.writeLine(`isDrumMode: Current device pad mode: ${currentMode.id} result: ${currentMode.id === 'drum'}`);
        return currentMode.id === 'drum';
    }
    
    this.getDrumMode = function(id) {
        // Host.Console.writeLine(`getDrumMode: Getting drum mode: ${id}`);
        return Modes.DrumModes.find(mode => mode.id === id);
    }

    this.getCurrentDrumMode = function() {
        // Assuming this.params.drum.value holds the index of the current drum mode
        const modeIndex = this.params.drum.value;
        return Modes.DrumModes.find(mode => mode.index === modeIndex);
    }

    this.setDrumMode = function(id) {
        const modeIndex = this.getDrumMode(id).index;
        // Host.Console.writeLine(`setDrumMode: Setting drum mode: ${id} index=${modeIndex}`);
        if (modeIndex !== undefined) {
            this.params.drum.setValue(modeIndex, true);
        } else {
            Host.Console.writeLine(`setDrumMode: Error: Mode with ID ${id} not found.`);
            return null;
        }
    }
    
    this.activateDrumHandler = function()
    {
        Host.Console.writeLine(`Inside activateDrumHandler`);
        this.drumElement.component.setActiveHandler(this.params.drum.value);
    }

    this.setPadFocusWhenPressed = function( active )
    {
        Host.Console.writeLine(`Inside setPadFocusWhenPressed`);
        this.getDrumMode('play').handler.setFocusPadWhenPressed(active);
    }
    
    // Hui Mode Functions
    this.getHuiMode = function(id) {
        // Use the preprocessed map to get the index of the mode by ID
        const modeIndex = huiModeIdToIndexMap.get(String(id));
        Host.Console.writeLine(`getHuiMode: Getting Hui mode: ${id} index=${modeIndex}`);
        // Return the mode from Modes.HuiModes using the index
        return Modes.HuiModes[modeIndex];
    }

    this.getCurrentHuiMode = function() {
        // Access the current Hui mode based on this.params.hui.value
        const modeIndex = this.params.hui.value;
        if (modeIndex >= 0 && modeIndex < Modes.HuiModes.length) {
            Host.Console.writeLine(`getCurrentHuiMode: Getting current Hui mode: ${modeIndex}`);
            return Modes.HuiModes[modeIndex];
        }
        return null;
    }

    this.setHuiMode = function(id) {
        const modeIndex = this.getHuiMode(id).index;
        Host.Console.writeLine(`setHuiMode: Setting Hui mode: ${id} index=${modeIndex}`);
        if (modeIndex !== undefined) {
            this.params.hui.setValue(modeIndex, true);
        } else {
            Host.Console.writeLine(`setHuiMode: Error: Mode with ID ${id} not found.`);
            return null;
        }
    }
    this.toggleNextHuiMode = function() {
        // Get the current Hui mode
        Host.Console.writeLine(`Inside toggleNextHuiMode`);
        const currentMode = this.getCurrentHuiMode();
        // Set the Hui mode to the next mode using the nextMode property
        this.setHuiMode(currentMode.nextMode.id);
    }
    // Other Functions
    this.setModifierActive = function(active)
    {
        Host.Console.writeLine(`Inside setModifierActive`);
        this.drumElement.component.setModifierActive(active);
        this.sessionElement.component.setModifierActive(active);
    }

    this.setDrumFullVelocityMode = function(active)
    // The original function name was setFullVelocityMode but this is a native method of component.
    // so renamed to setDrumFullVelocityMode here and in LaunchKeyMKIIIComponent
    {
        Host.Console.writeLine(`Inside setDrumFullVelocityMode`);
        this.drumElement.component.setFullVelocityMode(active)
    }

    this.setDrumSessionCurrentBank = function(bank)
    {
        Host.Console.writeLine(`Inside setCurrentBank`);
        this.drumElement.component.setCurrentBank(bank);
        this.sessionElement.component.setCurrentBank(bank);
    }

    this.setPadDisplayMode = function( mode )
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

    this.toggleNextPadDisplayMode = function()
    {
        Host.Console.writeLine(`Inside toggleNextPadDisplayMode`);
        let nextMode = this.params.display.value + 1;
        if( nextMode > 2 )
            nextMode = 0;
        this.setPadDisplayMode(nextMode);
        Host.Console.writeLine(`toggleNextPadDisplayMode: nextMode: ${nextMode}`);
    }

}

