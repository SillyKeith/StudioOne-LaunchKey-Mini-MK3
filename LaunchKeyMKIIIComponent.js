/**
 * @Author: Sian Croser <Sian-Lee-SA>
 * @Date:   2020-05-27T21:56:33+09:30
 * @Email:  CQoute@gmail.com
 * @Filename: LaunchKeyMKIIIComponent.js
 * @Last modified by:   Keith Kepler
 * @Last modified time: 2024-05-27T21:56:33+09:30
 * @License: GPL-3
 */

const kPadCount = 16;
const kBankCount = 8;

include_file("resource://com.presonus.musicdevices/sdk/controlsurfacecomponent.js");
include_file("resource://com.presonus.musicdevices/sdk/controlsurfacedevice.js");
include_file("resource://com.presonus.musicdevices/sdk/midiprotocol.js");
//include_file("./resources/controlsurfacecomponent.js");
//include_file("./resources/musicprotocol.js");
include_file("Debug.js");
include_file("Color.js");
include_file("Modes.js");

class LaunchKeyMK3ExtendedComponent extends PreSonus.ControlSurfaceComponent {
    constructor() {
        super();
        this.channelsUpdated = false; // Initialize the flag for keeping track of whether the channels have been updated
    }

    onInit(hostComponent) {
        super.onInit(hostComponent);
        this.debugLog = true;  // Set to true to enable debug logging
        this.model = hostComponent.model;  
        let root = this.model.root;
        this.log("LaunchKeyMK3ExtendedComponent initialized");

        this.pagingComponent = hostComponent.find(PreSonus.ComponentID.kPaging);

        // Elements initialization. This is looking inside the LaunchKeyMKIII.surface.xml file for the elements
        this.padSessionSection = root.find("PadSessionSectionElement");
        this.padDrumSection = root.find("PadDrumSectionElement");
        this.padUserDefinedSection = root.find("PadUserDefinedSectionElement");
        this.windowManagerElement = root.find("WindowManagerElement");
        this.focusChannelElement = root.find("MixerElement/FocusBankElement").getElement(0);
        this.channelBankElement = root.find("MixerElement/RemoteBankElement");
        this.noteRepeatElement = root.find("NoteRepeatElement");
        this.transportPanelElement = root.find("TransportPanelElement");
        this.metronomeElement = root.find("MetronomeElement");

        // Params initialization
        let paramList = hostComponent.paramList;
        this.modes = new Modes(hostComponent, kBankCount);
        this.shiftModifier = paramList.addParam("shiftModifier");
        this.sceneHold = paramList.addParam("sceneHold");
        this.playLED = paramList.addInteger(0, 0x7F, "playLED");
        this.recordLED = paramList.addInteger(0, 0x7F, "recordLED");
        this.fullVelocityMode = paramList.addParam("fullVelocityMode");
        this.bankMenu = paramList.addInteger(0, kBankCount - 1, "bankMenu");
        this.repeatRateAlias = paramList.addAlias("repeatRate");
        this.repeatQuantizeAlias = paramList.addAlias("repeatQuantize");
        this.editorModeActive = paramList.addParam("editorModeActive");
        this.bankMenuColor = paramList.addColor("bankButtonColor");
        this.modes.lastTrackEditorType = PreSonus.HostUtils.kEditorTypeNone; // set to none initially
        this.updateBankMenuColor();

        // Additional setup
        this.setupBankList(paramList);
        this.setupModes();
        this.addColorParams(paramList);
        this.addMonoAndEffectParams(paramList);

        // Notifications
        PreSonus.HostUtils.enableEngineEditNotifications(this, true);
        PreSonus.HostUtils.enableEditorNotifications(this, true);
        Host.Signals.advise(this.padDrumSection.component, this);
        Host.Signals.advise(this.padSessionSection.component, this);
    }

    setupBankList = function(paramList) {
        this.bankList = paramList.addList("bankList");
        this.bankList.appendString(PreSonus.Banks.kAll);
        this.bankList.appendString(PreSonus.Banks.kAudioTrack);
        this.bankList.appendString(PreSonus.Banks.kAudioBus);
        this.bankList.appendString(PreSonus.Banks.kUser);
    }

    setupModes = function() {
        this.modes.setupDrumModes(this.padDrumSection, [
            PreSonus.NoteRepeat.k4thPpq,
            PreSonus.NoteRepeat.k8thPpq,
            PreSonus.NoteRepeat.k16thPpq,
            PreSonus.NoteRepeat.k32thPpq,
            PreSonus.NoteRepeat.k4thTPpq,
            PreSonus.NoteRepeat.k8thTPpq,
            PreSonus.NoteRepeat.k16thTPpq,
            PreSonus.NoteRepeat.k32thTPpq
        ], this.repeatRateAlias);
        this.modes.setupSessionModes(this.padSessionSection, this.padUserDefinedSection, this.bankMenu);
    }
    
    addColorParams = function(paramList) {
        Object.keys(Color.Values).forEach(key => {
            paramList.addInteger(Color.Values[key], Color.Values[key], key);
        });
    }

    addMonoAndEffectParams = function(paramList) {
        paramList.addInteger(0x00, 0x00, 'MONO_OFF');
        paramList.addInteger(0x3F, 0x3F, 'MONO_HALF');
        paramList.addInteger(0x7F, 0x7F, 'MONO_FULL');
        paramList.addInteger(0, 0, "EFFECT_NONE");
        paramList.addInteger(1, 1, "EFFECT_FLASH"); // Blink is not a valid effect Flash is
        paramList.addInteger(2, 2, "EFFECT_PULSE");
    }

    updateBankMenuColor = function() {  // Since Drum Layout and Session Layout have different bank colors, this function is used to update the bank color based on the current mode.
        let bankIndex, bankColor;    

        this.log("Inside updateBankMenuColor - padSessionSection");
        let c = this.padSessionSection.component;
        bankIndex = c.getCurrentBank();
        bankColor = Color.Bank[bankIndex];
        this.bankMenuColor.fromString(bankColor);
        this.log("Inside updateBankMenuColor - padDrumSection");
        let d = this.padDrumSection.component;
        bankIndex = d.getCurrentBank();
        bankColor = Color.Bank[bankIndex];
        this.bankMenuColor.fromString(bankColor);
    }

    // Using this as the Initiation

    onHuiMixerConnect = function() {  // This function gets called when the surface is connected via onConnect in the surface.xml file. 
        this.log("Inside onHuiMixerConnect");
        this.modes.setDevicePadMode('drum');
        this.modes.setDevicePotMode('device');
        this.modes.setDrumMode('play');
        this.modes.setPadFocusWhenPressed(true);

        this.modes.setSessionMode('hui');
        this.modes.setHuiMode('monitor');

        this.renderDrumMode();
        this.renderSessionMode();
    }
    
    onExit () {
        Host.Signals.unadvise(this.padSessionSection.component, this);
        Host.Signals.unadvise(this.padDrumSection.component, this);
        Host.Signals.unadvise(this.padUserDefinedSection.component, this);
        //this.modes.setDevicePadMode('drum');
        PreSonus.HostUtils.enableEngineEditNotifications(this, false);
        PreSonus.HostUtils.enableEditorNotifications(this, false); // disconnect from both since we enable both
        super.onExit();   //PreSonus.ControlSurfaceComponent.prototype.onExit.call(this);
    }

    paramChanged = function (param) {
        Host.Signals.signal("LaunchKeyMK3", 'paramChanged', param); // This allows the BASIC component to receive signals.
        if (!param)
            return;
        this.log(`LaunchkeyComponent.js paramChanged value changed to ${param.value}`);
    
        switch (param) {
            case this.modes.params.device_pad:
                this.log(`Entered device_pad case with value: ${param.value}`);
                this.resetChannelsUpdatedFlag(); // Reset flag
                
                // Why are both being rendered when they are mutually exclusive?
                // 1 = Drum, 2 = Session and 5 = Custom
                //
                //if (param.value === 1 ) this.renderDrumMode();
                //else if (param.value === 2) this.renderSessionMode();
                this.renderDrumMode();
                this.renderSessionMode();
                break;
    
            case this.modes.params.device_pot:
                this.log(`Entered device_pot case with value: ${param.value}`);
                this.resetChannelsUpdatedFlag(); // Reset flag
                return this.updateChannels();
    
            case this.sceneHold:
                this.log(`Entered sceneHold case with value: ${param.value}`);
                // this.resetChannelsUpdatedFlag(); // Reset flag
                return this.modes.setModifierActive(param.value);
    
            case this.modes.params.focus:
                this.log(`Entered focus case with value: ${param.value}`);
                return this.modes.setPadFocusWhenPressed(param.value);
    
            case this.modes.params.drum:
                this.log(`Entered drum case with value: ${param.value}`);
                this.resetChannelsUpdatedFlag(); // Reset flag
                return this.renderDrumMode();
    
            case this.modes.params.session:
                this.log(`Entered session case with value: ${param.value}`);
                this.resetChannelsUpdatedFlag(); // Reset flag
                return this.renderSessionMode();
    
            case this.modes.params.hui:
                this.log(`Entered hui case with value: ${param.value}`);
                this.resetChannelsUpdatedFlag(); // Reset flag
                return this.renderHuiMode();
    
            case this.fullVelocityMode:
                this.log(`Entered fullVelocityMode case with value: ${param.value}`);
                // setFullVelocityMode is a native method so renaming the function in the Modes.js file to setDrumFullVelocityMode
                // this.resetChannelsUpdatedFlag(); // Reset flag
                return this.modes.setDrumFullVelocityMode(param.value);
    
            case this.bankMenu:
                this.log(`Entered bankMenu case with value: ${param.value}`);
                return this.modes.setDrumSessionCurrentBank(param.value);
    
            case this.bankList:
                this.log(`Entered bankList case with value: ${param.value}`);
                this.channelBankElement.selectBank(this.bankList.string);
                this.onHuiScrollOptions(this.sceneHold.value);
                return;
        }
    }

    togglePadDisplayMode = function(state) {
        this.log(`Inside togglePadDisplayMode - state: ${state}`);
        if (!state) return;
        this.modes.toggleNextPadDisplayMode();
    }

    onScenePressed = function(state) {
        if (!state || this.shiftModifier.value) return;
        const mode = this.modes.getCurrentDevicePadMode(); // changed to const vs let
        this.log("onScenePressed and mode is: " + mode.id);
        switch (mode.id) {
            case 'session':
                if (this.modes.getCurrentSessionMode().id == 'loopedit' )
                    return this.onToggleLoopEditMode(true);
                return this.modes.toggleNextSessionMode();
            case 'drum':
                return;
            case 'custom':
                return;
        }
    }

    /**
     * Known params Editor|Console|Browser|TransportPanel
     * @param  {bool}   state     Whether button is down or up
     */
    onToggleWindow = function (state) {  // This function is also called by the surface.xml elements
        if (!state)
            return;
        this.log("Inside onToggleWindow");
        if (this.windowManagerElement.getParamValue('Editor')) {
            return this.windowManagerElement.setParamValue('Console', 1);
        }
        if (this.windowManagerElement.getParamValue('Console')) {
            return this.windowManagerElement.setParamValue('Console', 0);
        }

        return this.windowManagerElement.setParamValue('Editor', 1);
    }

    onTrackEditorChanged = function (editor) {
        this.log("Inside onTrackEditorChanged");
        const mode = this.modes.getCurrentSessionMode();  // changed to const vs let
        const editorType = PreSonus.HostUtils.getEditorType(editor); // changed to const vs let

        this.modes.lastTrackEditorType = editorType; // remember last track editor type

        if (mode.id == 'stepedit' || mode.id == 'eventedit') {
            if (editorType == PreSonus.HostUtils.kEditorTypePattern)
                this.modes.setSessionMode('stepedit');
            else if (editorType == PreSonus.HostUtils.kEditorTypeMusic)
                this.modes.setSessionMode('eventedit');
        }
    }

    openEditorAndFocus = function (state) { // This function is also called by the surface.xml elements by the ssm button when in Session Mode plus shiftModifier
        if (!state)
            return;
        this.log("Inside openEditorAndFocus");
        PreSonus.HostUtils.openEditorAndFocus(this, this.focusChannelElement, PreSonus.HostUtils.kInstrumentEditor, true);
    }

    onToggleLoopEditMode = function (state) {
        if (!state)
            return;
        this.log("Inside onToggleLoopEditMode");
        if (this.modes.getCurrentSessionMode().id == 'loopedit') {
            return this.modes.restoreState();
        }

        this.modes.storeState();
        this.modes.setDevicePadMode('session');
        this.modes.setSessionMode('loopedit');
    }

    onHuiModePressed = function (state) { // This function is also called by the surface.xml elements by the sceneHold and ssm button
        if (!state)
            return;
        this.log("Inside onHuiModePressed");
        this.modes.toggleNextHuiMode();
        this.updateChannels();
    }

    onConnectNoteRepeat = function () {
        this.noteRepeatElement.connectAliasParam(this.repeatRateAlias, PreSonus.NoteRepeat.kRate);
        this.noteRepeatElement.connectAliasParam(this.repeatQuantizeAlias, 'quantize');
    
        // init pad mode based on note repeat settings
        const repeatActive = this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kActive);
        this.onActivateNoteRepeat(repeatActive);
    }

    /**
     * Handles the logic for when the note repeat button is pressed.
     * 
     * @param {boolean} state - The state of the note repeat button (pressed or not).
     */
    onNoteRepeatButtonPressed = function (state) {
        // If the state is false or the current device pad mode is not 'drum', exit the function.
        if (!state || this.modes.getCurrentDevicePadMode().id != 'drum')
            return;

        // Log the action for debugging purposes.
        this.log("inside onNoteRepeatButtonPressed");

        // Reset the channel update flag.
        this.resetChannelsUpdatedFlag();

        // Check and store if the shift modifier is pressed.
        const shiftPressed = this.shiftModifier.value;

        // Get the current values of the note repeat active and spread parameters.
        const repeatActive = this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kActive);
        const spreadActive = this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kSpread);

        // If the shift modifier is not pressed.
        if (!shiftPressed) {
            // If spread is active, deactivate it.
            if (spreadActive)
                this.noteRepeatElement.setParamValue(PreSonus.NoteRepeat.kSpread, false);
            // Otherwise, toggle the active state of note repeat.
            else {
                this.noteRepeatElement.setParamValue(PreSonus.NoteRepeat.kActive, !repeatActive);

            }
        }
        // If the shift modifier is pressed.
        else {
            // If note repeat is active, deactivate both note repeat and spread.
            if (repeatActive) {
                this.noteRepeatElement.setParamValue(PreSonus.NoteRepeat.kActive, false);
                this.noteRepeatElement.setParamValue(PreSonus.NoteRepeat.kSpread, false);
            }
            // Otherwise, activate both note repeat and spread.
            else {
                this.noteRepeatElement.setParamValue(PreSonus.NoteRepeat.kActive, true);
                this.noteRepeatElement.setParamValue(PreSonus.NoteRepeat.kSpread, true);
            }
        }
    }

    onActivateNoteRepeat = function (value) {
        this.log("inside onActivateNoteRepeat");
        if (value) {
            if (this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kSpread)){
                this.modes.setDrumMode('rate_trigger');
                this.resetChannelsUpdatedFlag(); // Reset Channel Update flag
            }

        } else if (this.modes.getCurrentDrumMode().id == 'rate_trigger') {
            this.modes.setDrumMode('play');
        }
        this.renderDrumMode();
    }

    onSpreadModeChanged = function (value) {
        if (value && this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kActive)) {
            this.modes.setDrumMode('rate_trigger');
        } else if (!value && this.modes.getCurrentDrumMode().id === 'rate_trigger') {
            this.modes.setDrumMode('play');
        }
    }

    onNoteRepeatSceneHold = function (value) {
        const isDrumMode = this.modes.getCurrentDevicePadMode().id === 'drum';
        const isNoteRepeatActive = this.noteRepeatElement.getParamValue('active');
    
        if (isDrumMode && isNoteRepeatActive) {
            const mode = value ? 'repeat_menu' : 'play';
            this.modes.setDrumMode(mode);
        }
    }

    renderGlobals = function () {  // This also gets called by the onChanged or onConnect events driven by the surface.xml elements.
        this.log("Entering renderGlobals");
        let play = 0;
        let record = 0;

        if (this.transportPanelElement.getParamValue('loop'))
            play = 0x05;

        if (this.transportPanelElement.getParamValue('start'))
            play = 0x7F;

        if (this.focusChannelElement.getParamValue('recordArmed'))
            record = 0x05;

        if (this.transportPanelElement.getParamValue('record'))
            record = 0x7F;

        this.playLED.setValue(play, true);
        this.recordLED.setValue(record, true);
    }

    /**
     * Renders the drum mode for the LaunchKey MKIII component.
     * 
     * This function handles the activation of the drum handler, rendering the current drum mode,
     * and updating the UI elements based on the current state of the drum mode, note repeat, and full velocity mode.
     * These are like WorkFlows "play", "rate_trigger", "repeat_menu", "full_velocity"
     */
    renderDrumMode = function () {
        // Log the entry into the function
        this.log("Entering renderDrumMode");

        // Activate the drum handler and render the current drum mode
        this.log("Activating drum handler and rendering current drum mode");
        this.modes.activateDrumHandler();
        const currentDrumMode = this.modes.getCurrentDrumMode();
        currentDrumMode.render(this, this.model.root);

        // Check if the drum mode is active
        const isDrumModeActive = this.modes.isDrumMode();
        this.log(`Checking if drum mode is active: ${isDrumModeActive}`);
        if (isDrumModeActive) {
            // Log the active drum mode and render it
            this.log(`Drum mode is active, rendering ${currentDrumMode.id}`);
            currentDrumMode.activeRender(this, this.model.root);

            // Check if note repeat is active and update the scene button color if it is
            const noteRepeatActive = this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kActive);
            this.log(`Note repeat active status: ${noteRepeatActive}`);
            if (noteRepeatActive) {
                this.modes.params.scene_button.color.fromString('#0000FF');
                //this.resetChannelsUpdatedFlag(); // Reset Channels Update flag to render knobs
            }

            // Retrieve the current value of the effect
            const currentEffectValue = this.modes.params.ssm_button.effect.value;

            // Check if the current value is already Effect.PULSE
            if (currentEffectValue !== Effect.PULSE) {
                // If not, set the value to Effect.PULSE
                this.modes.params.ssm_button.effect.setValue(Effect.PULSE);
            }

            // Check if full velocity mode is active and update the ssm button color accordingly
            const fullVelocityModeActive = this.fullVelocityMode.value;
            this.log(`Checking full velocity mode: ${fullVelocityModeActive}`);
            if (fullVelocityModeActive) {
                this.modes.params.ssm_button.color.fromString('purple');
            } else {
                this.modes.params.ssm_button.color.setValue(0);
            }
        }

        // Update the channels and log the exit from the function
        this.log("Updating channels");
        this.updateChannels();
        this.log("Exiting renderDrumMode");
    }

    /**
     * Renders the session mode for the LaunchKey MKIII component.
     * 
     * This function handles the rendering of the current session mode, updating the UI elements
     * based on the current state of the session mode, and activating the session handler.
     */
    renderSessionMode = function () {
        // Retrieve the current session mode
        const mode = this.modes.getCurrentSessionMode();
        const currentDevicePadMode = this.modes.getCurrentDevicePadMode();
        this.log(`renderSessionMode function: ${mode.id}`);

        // Handle specific session modes
        switch (mode.id) {
            case 'bank':
                // Update the bank menu value to ensure it is up-to-date
                this.bankMenu.value = this.padSessionSection.component.getCurrentBank();
                break;
            case 'hui':
                // Defer the command to view the console
                Host.GUI.Commands.deferCommand("View", "Console", false, Host.Attributes(["State", true]));
                break;
        }

        // Activate the session handler
        this.log("calling activateSessionHandler from renderSessionMode");
        this.modes.activateSessionHandler();

        // Check if the current device pad mode is 'session'
        if (currentDevicePadMode === 'session') {
            // Update the editor mode active value based on the session mode
            this.editorModeActive.value = mode.id === 'eventedit' || mode.id === 'stepedit';
        }

        // Render the current session mode if the current device pad mode is not 'drum'
        if (currentDevicePadMode !== 'drum') {
            mode.render(this, this.model.root);
        }

        // If the session mode is active, perform additional rendering
        if (this.modes.isSessionMode()) {
            mode.activeRender(this, this.model.root);
            // Render HUI mode if the current session mode is 'hui'
            if (mode.id === 'hui') {
                this.renderHuiMode();
            }
        }

        // Update the channels
        this.updateChannels();
    }

    renderHuiMode = function () {
        this.log("Entering renderHuiMode function");
        const hui = this.modes.getCurrentHuiMode(); // Get the current HUI mode
    
        // Loop through each pad and set its state -- REMOVED
        // for (let i = 0; i < kPadCount; i++) {
        //    this.padSessionSection.component.setPadState(i, 1);
        // }
        
        // Set the color from the hui mode
        this.modes.params.ssm_button.color.fromString(hui.color);
    }

    /**
     * Handles the HUI scroll options for the LaunchKey MKIII component.
     * 
     * This function is triggered by the surface.xml elements via the sceneHold button.
     * It updates the toggle states and colors of the channels based on the current session mode
     * and the provided state. If the state is true, it sets the toggle generic, updates the pad toggle
     * colors, and applies specific colors to certain channels. If the state is false, it updates the channels.
     * 
     * @param {boolean} state - The state indicating whether to activate or deactivate the HUI scroll options.
     */
    onHuiScrollOptions = function (state) {
        // Log the current state
        this.log("onHuiScrollOptions - state: " + state);

        // Retrieve the current session mode
        let mode = this.modes.getCurrentSessionMode();

        if (state) {
            // If state is true, set the toggle generic and update pad toggle colors for all channels
            for (let i = 0; i < this.modes.channels.length; i++) {
                this.modes.channels[i].setToggleGeneric();
                this.modes.channels[i].padToggleColor.setValue(0);
                this.modes.channels[i].padToggleEffect.setValue(Effect.NONE);
            }

            // Log the color switch for the current mode
            this.log("onHuiScrollOptions - color switch: " + mode.id);

            // Apply specific colors to certain channels
            this.modes.channels[0].padToggleColor.fromString('#00FF00');
            this.modes.channels[1].padToggleColor.fromString('#002200');
            this.modes.channels[6].padToggleColor.fromString('#002200');
            this.modes.channels[7].padToggleColor.fromString('#00FF00');

            // Update pad toggle colors for channels 2 to 5 based on the bank list value
            for (let i = 2; i < 6; i++) {
                this.modes.channels[i].padToggleColor.fromString((this.bankList.value == i - 2) ? '#00FFFF' : '#003333');
                this.log(`onHuiScrollOptions - bankList: ${this.bankList.value}`);
            }
        } else {
            // If state is false, update the channels
            this.updateChannels();
        }
    }

    /**
     * Updates the channels based on the current mode.
     */
    updateChannels = function () {
        this.log("Entering updateChannels");

        // Check if channels have already been updated
        if (this.channelsUpdated) {
            this.log("Channels have already been updated, skipping update");
            return;
        }

        // Reset all pots to generic if not already set
        // If this is not done, the pots and pads will not be reset to generic when switching modes or changing settings
        // For example the note repeat rate and gate pots will not be reset to generic when switching from drum mode to session mode leaving them set to note repeat
        for (let i = 0; i < kBankCount; i++) {
            if (!this.modes.channels[i].isPadGeneric()) {
                this.log(`Resetting pad for channel ${i} to generic`);
                this.modes.channels[i].setPadGeneric();
            }
            if (!this.modes.channels[i].isPotGeneric()) {
                this.log(`Resetting pot for channel ${i} to generic`);
                this.modes.channels[i].setPotGeneric();
            }
        }

        // Check if drum mode is active
        if (this.modes.isDrumMode()) {
            this.log("Drum mode is active");
            const noteRepeatActive = this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kActive);
            this.log("Note repeat active status: " + noteRepeatActive);

            if (noteRepeatActive) {
                this.log("Connecting pot for rate on channel 0 to noteRepeatElement");
                this.modes.channels[0].connectPot(this.noteRepeatElement, 'rate');
                this.log("Connecting pot for gate on channel 2 to noteRepeatElement");
                this.modes.channels[2].connectPot(this.noteRepeatElement, 'gate');
                // Mark these pots as not generic so that the next time updateChannels is called, these will be reset
                this.modes.channels[0].resetPotGeneric();
                this.modes.channels[2].resetPotGeneric();
            }
        }

        // Check if session mode is active
        if (this.modes.isSessionMode()) {
            this.log("Session mode is active");
            const currentSessionModeId = this.modes.getCurrentSessionMode().id;
            this.log("Current session mode ID: " + currentSessionModeId);

            switch (currentSessionModeId) {
                case 'setup':
                    this.log("Session mode is 'setup', connecting pot for tempo on channel 0 to transportPanelElement");
                    this.modes.channels[0].connectPot(this.transportPanelElement, 'tempo');
                    // Mark this pot as not generic so that the next time updateChannels is called, it will be reset
                    this.modes.channels[0].resetPotGeneric();
                    break;

                case 'hui':
                    this.log("Session mode is 'hui', updating all channels");
                    for (let i = 0; i < this.modes.channels.length; i++) {
                        this.log(`Updating channel ${i}`);
                        this.updateChannel(i);
                    }
                    break;
            }
        }
        
        this.channelsUpdated = true; // Set the flag to true after updating channels to prevent multiple updates

        this.log("Exiting updateChannels");
    }

    updateChannel = function (i) { // this function also gets called by onChanged events driven by the surface.xml RemoteBank elements.
        this.log(`Entering updateChannel for channel ${i}`);
        if (this.modes.getCurrentSessionMode().id != 'hui')
            return;

        const channel = this.modes.channels[i];
        const potMode = this.modes.getCurrentDevicePotMode();
        const huiMode = this.modes.getCurrentHuiMode();
        this.log (`updateChannel- potMode: ${potMode.id} huiMode: ${huiMode.id}`);
        channel.connectSelect('selected');
        channel.connectSelectColor('color');
        channel.updateSelectEffect();
    
        switch (potMode.id) {
        case 'volume':
            channel.connectPot('volume');
            // Mark the pots as not generic so that the next time updateChannels is called, it will be reset
            channel.resetPotGeneric();
            break;
        case 'pan':
            channel.connectPot('pan');
            // Mark the pots as not generic so that the next time updateChannels is called, it will be reset
            channel.resetPotGeneric();
            break;
        case 'sendA':
            channel.connectPot(channel.sendsBankElement.getElement(0), "sendlevel");
            // Mark the pots as not generic so that the next time updateChannels is called, it will be reset
            channel.resetPotGeneric();
            break;
        case 'sendB':
            channel.connectPot(channel.sendsBankElement.getElement(1), "sendlevel");
            // Mark the pots as not generic so that the next time updateChannels is called, it will be reset
            channel.resetPotGeneric();
            break;
    }

        // If scene hold is true then PreSonus.Bankscrolling is active
        if (this.sceneHold.value)
            return;

        switch (huiMode.id) {
        case 'monitor':
            channel.connectToggle('monitor');
            break;
        case 'arm':
            channel.connectToggle('recordArmed');
            break;
        case 'solo':
            channel.connectToggle('solo');
            break;
        case 'mute':
            channel.connectToggle('mute');
            break;
        }
        channel.updateToggle(huiMode.toggleColor[0], huiMode.toggleColor[1], huiMode.effect);
    }

    resetChannelsUpdatedFlag = function () {
        this.channelsUpdated = false;
    }

    notify = function (subject, msg) {
        if(!subject || !msg)
            return;
        this.log(`Component.js notify function ${subject}: ${msg.id}`);
        if (msg.id == PreSonus.HostUtils.kTrackEditorChanged)
            this.onTrackEditorChanged(msg.getArg(0));

        else if (msg.id == PreSonus.PadSection.kCurrentBankChanged)
            this.updateBankMenuColor();
    }
}

// factory entry called by host
function createLaunchKeyMK3ExtendedComponentInstance() {
    return new LaunchKeyMK3ExtendedComponent;
}