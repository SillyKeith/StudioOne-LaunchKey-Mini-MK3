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

include_file("./resources/controlsurfacecomponent.js");
include_file("./resources/musicprotocol.js");
include_file("Debug.js");
include_file("Color.js");
include_file("Modes.js");

class LaunchKeyMK3ExtendedComponent extends PreSonus.ControlSurfaceComponent {
    onInit(hostComponent) {
        super.onInit(hostComponent);
        this.debugLog = true;  // Set to true to enable debug logging
        this.model = hostComponent.model;
        let root = this.model.root;

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

    setupBankList(paramList) {
        this.bankList = paramList.addList("bankList");
        this.bankList.appendString(PreSonus.Banks.kAll);
        this.bankList.appendString(PreSonus.Banks.kAudioTrack);
        this.bankList.appendString(PreSonus.Banks.kAudioBus);
        this.bankList.appendString(PreSonus.Banks.kUser);
    }

    setupModes() {
        // Assuming Modes is a defined class elsewhere
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

    addColorParams(paramList) {
        for (let key in Color.Values) {
            paramList.addInteger(Color.Values[key], Color.Values[key], key);
        }
    }

    addMonoAndEffectParams(paramList) {
        paramList.addInteger(0x00, 0x00, 'MONO_OFF');
        paramList.addInteger(0x3F, 0x3F, 'MONO_HALF');
        paramList.addInteger(0x7F, 0x7F, 'MONO_FULL');
        paramList.addInteger(0, 0, "EFFECT_NONE");
        paramList.addInteger(1, 1, "EFFECT_BLINK");
        paramList.addInteger(2, 2, "EFFECT_PULSE");
    }

    updateBankMenuColor() {
        let c = this.padSessionSection.component;
        let d = this.padDrumSection.component;
        let bankIndex = c.getCurrentBank();
        let bankColor = Color.Bank[bankIndex];
        bankIndex = d.getCurrentBank();
        bankColor = Color.Bank[bankIndex];
        this.bankMenuColor.fromString(bankColor);
    }

    // Using this as the Initiation

    onHuiMixerConnect() {
        this.modes.setDevicePadMode('drum');
        this.modes.setDevicePotMode('device');
        this.modes.setDrumMode('play');
        this.modes.setPadFocusWhenPressed(true);

        this.modes.setSessionMode('hui');
        this.modes.setHuiMode('monitor');

        this.renderDrumMode();
        this.renderSessionMode();
    }

    paramChanged = function (param) {
        Host.Signals.signal("LaunchKeyMK3", 'paramChanged', param);
        this.log ("Hello World");
        this.log ("Hello World");
        switch (param) {
            case this.modes.params.device_pad:
                this.renderDrumMode();
                this.renderSessionMode();
                break;

            case this.modes.params.device_pot:
                return this.updateChannels();

            case this.sceneHold:
                return this.modes.setModifierActive(param.value);

            case this.modes.params.focus:
                return this.modes.setPadFocusWhenPressed(param.value);

            case this.modes.params.drum:
                return this.renderDrumMode();

            case this.modes.params.session:
                return this.renderSessionMode();

            case this.modes.params.hui:
                return this.renderHuiMode();

            case this.fullVelocityMode:
                return this.modes.setFullVelocityMode(param.value);

            case this.bankMenu:
                return this.modes.setCurrentBank(param.value);

            case this.bankList:
                this.channelBankElement.selectBank(this.bankList.string);
                this.onHuiScrollOptions(this.sceneHold.value);
                return;

        }
    }

    togglePadDisplayMode(state) {
        if (!state) return;
        this.modes.toggleNextPadDisplayMode();
    }

    onScenePressed(state) {
        if (!state || this.shiftModifier.value) return;

        let mode = this.modes.getCurrentDevicePadMode();
        switch (mode.id) {
            case 'session':
                if (this.modes.getCurrentSessionMode().id == 'loopedit')
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
    onToggleWindow = function (state) {
        if (!state)
            return;

        if (this.windowManagerElement.getParamValue('Editor')) {
            return this.windowManagerElement.setParamValue('Console', 1);
        }
        if (this.windowManagerElement.getParamValue('Console')) {
            return this.windowManagerElement.setParamValue('Console', 0);
        }

        return this.windowManagerElement.setParamValue('Editor', 1);
    }

    onTrackEditorChanged = function (editor) {
        let mode = this.modes.getCurrentSessionMode();
        let editorType = PreSonus.HostUtils.getEditorType(editor);

        this.modes.lastTrackEditorType = editorType; // remember last track editor type

        if (mode.id == 'stepedit' || mode.id == 'eventedit') {
            if (editorType == PreSonus.HostUtils.kEditorTypePattern)
                this.modes.setSessionMode('stepedit');
            else if (editorType == PreSonus.HostUtils.kEditorTypeMusic)
                this.modes.setSessionMode('eventedit');
        }
    }

    openEditorAndFocus = function (state) {
        if (!state)
            return;
        PreSonus.HostUtils.openEditorAndFocus(this, this.focusChannelElement, PreSonus.HostUtils.kInstrumentEditor, true);
    }

    onToggleLoopEditMode = function (state) {
        if (!state)
            return;

        if (this.modes.getCurrentSessionMode().id == 'loopedit') {
            return this.modes.restoreState();
        }

        this.modes.storeState();
        this.modes.setDevicePadMode('session');
        this.modes.setSessionMode('loopedit');
    }

    onHuiModePressed = function (state) {
        if (!state)
            return;
        this.modes.toggleNextHuiMode();
        this.updateChannels();
    }

    onConnectNoteRepeat = function () {
        this.noteRepeatElement.connectAliasParam(this.repeatRateAlias, PreSonus.NoteRepeat.kRate);
        this.noteRepeatElement.connectAliasParam(this.repeatQuantizeAlias, 'quantize');

        // init pad mode based on note repeat settings
        let repeatActive = this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kActive);
        this.onActivateNoteRepeat(repeatActive);
    }

    onNoteRepeatButtonPressed = function (state) {
        if (!state || this.modes.getCurrentDevicePadMode().id != 'drum')
            return;

        let shiftPressed = this.shiftModifier.value;
        let repeatActive = this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kActive);
        let spreadActive = this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kSpread);

        if (!shiftPressed) {
            if (spreadActive)
                this.noteRepeatElement.setParamValue(PreSonus.NoteRepeat.kSpread, false);
            else
                this.noteRepeatElement.setParamValue(PreSonus.NoteRepeat.kActive, !repeatActive);
        }
        else {
            if (repeatActive) {
                this.noteRepeatElement.setParamValue(PreSonus.NoteRepeat.kActive, false);
                this.noteRepeatElement.setParamValue(PreSonus.NoteRepeat.kSpread, false);
            }
            else {
                this.noteRepeatElement.setParamValue(PreSonus.NoteRepeat.kActive, true);
                this.noteRepeatElement.setParamValue(PreSonus.NoteRepeat.kSpread, true);
            }
        }
    }

    onActivateNoteRepeat = function (value) {
        if (value) {
            if (this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kSpread))
                this.modes.setDrumMode('rate_trigger');

        } else if (this.modes.getCurrentDrumMode().id == 'rate_trigger') {
            this.modes.setDrumMode('play');
        }
        this.renderDrumMode();
    }

    onSpreadModeChanged = function (value) {
        if (value) {
            if (this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kActive))
                this.modes.setDrumMode('rate_trigger');
            return;
        }

        if (this.modes.getCurrentDrumMode().id == 'rate_trigger')
            return this.modes.setDrumMode('play');
    }

    onNoteRepeatSceneHold = function (value) {
        if (this.modes.getCurrentDevicePadMode().id != 'drum' || !this.noteRepeatElement.getParamValue('active'))
            return;

        if (value) {
            return this.modes.setDrumMode('repeat_menu');
        }
        return this.modes.setDrumMode('play');
    }

    renderGlobals = function () {
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

    renderDrumMode = function () {
        this.modes.activateDrumHandler();
        this.modes.getCurrentDrumMode().render(this, this.model.root);
        this.log ("renderDrumMode: " + this.modes.isDrumMode());
        if (this.modes.isDrumMode()) {
            this.modes.getCurrentDrumMode().activeRender(this, this.model.root);
            if (this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kActive)) {
                this.modes.params.scene_button.color.fromString('#0000FF');
            }

            this.modes.params.ssm_button.effect.setValue(Effect.PULSE);
            if (this.fullVelocityMode.value) {
                this.modes.params.ssm_button.color.fromString('purple');
            } else {
                this.modes.params.ssm_button.color.setValue(0);
            }
        }

        this.updateChannels();
    }

    renderSessionMode = function () {
        let mode = this.modes.getCurrentSessionMode();
        this.log ("renderSessionMode fuction: " + mode.id);
        switch (mode.id) {
            case 'bank':
                this.bankMenu.value = this.padSessionSection.component.getCurrentBank(); // make sure value is up-to-date
                break;
            case 'hui':
                Host.GUI.Commands.deferCommand("View", "Console", false, Host.Attributes(["State", true]));
                break;
        }

        this.modes.activateSessionHandler();

        if (this.modes.getCurrentDevicePadMode().id == 'session')
            this.editorModeActive.value = mode.id == 'eventedit' || mode.id == 'stepedit';

        this.modes.getCurrentSessionMode().render(this, this.model.root);

        if (this.modes.isSessionMode()) {
            this.modes.getCurrentSessionMode().activeRender(this, this.model.root);
            // Render here as above method resets sub buttons
            if (mode.id == 'hui')
                this.renderHuiMode();
        }

        this.updateChannels();
    }

        renderHuiMode = function () {
            let hui = this.modes.getCurrentHuiMode();

            for (let i = 0; i < kPadCount; i++)
                this.padSessionSection.component.setPadState(i, 1);
            this.modes.params.ssm_button.color.fromString(hui.color);
        }

        onHuiScrollOptions = function (state) {
            let mode = this.modes.getCurrentSessionMode();
            if (state) {
                for (let i = 0; i < this.modes.channels.length; i++) {
                    this.modes.channels[i].setToggleGeneric();
                    this.modes.channels[i].padToggleColor.setValue(0);
                    this.modes.channels[i].padToggleEffect.setValue(Effect.NONE);
                }

                this.modes.channels[0].padToggleColor.fromString('#00FF00');
                this.modes.channels[1].padToggleColor.fromString('#002200');
                this.modes.channels[6].padToggleColor.fromString('#002200');
                this.modes.channels[7].padToggleColor.fromString('#00FF00');

                for (let i = 2; i < 6; i++)
                    this.modes.channels[i].padToggleColor.fromString((this.bankList.value == i - 2) ? '#00FFFF' : '#003333');
            } else {
                this.updateChannels();
            }
        }

        updateChannels = function () {
            // Reset all pots to genereic
            for (let i = 0; i < kBankCount; i++) {
                this.modes.channels[i].setPadGeneric();
                this.modes.channels[i].setPotGeneric();
            }

            if (this.modes.isDrumMode()) {
                if (this.noteRepeatElement.getParamValue(PreSonus.NoteRepeat.kActive)) {
                    this.modes.channels[0].connectPot(this.noteRepeatElement, 'rate');
                    this.modes.channels[2].connectPot(this.noteRepeatElement, 'gate');
                }
            }

            if (this.modes.isSessionMode()) {
                switch (this.modes.getCurrentSessionMode().id) {
                    case 'setup':
                        this.modes.channels[0].connectPot(this.transportPanelElement, 'tempo');
                        break;

                    case 'hui':
                        for (let i = 0; i < this.modes.channels.length; i++)
                            this.updateChannel(i);
                        break;

                }
            }
        }

        updateChannel = function (i) {
            this.log ("updateChannel- What mode are we in:" + this.modes.getCurrentSessionMode().id);
            if (this.modes.getCurrentSessionMode().id != 'hui')
                return;

            let channel = this.modes.channels[i];
            let potMode = this.modes.getCurrentDevicePotMode();
            let huiMode = this.modes.getCurrentHuiMode();

            channel.connectSelect('selected');
            channel.connectSelectColor('color');
            channel.updateSelectEffect();

            switch (potMode.id) {
                case 'volume':
                    channel.connectPot('volume');
                    break;
                case 'pan':
                    channel.connectPot('pan');
                    break;
                case 'sendA':
                    channel.connectPot(channel.sendsBankElement.getElement(0), "sendlevel");
                    break;
                case 'sendB':
                    channel.connectPot(channel.sendsBankElement.getElement(1), "sendlevel");
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

        notify = function (subject, msg) {
            log(subject + ': ' + msg.id);
            if (msg.id == PreSonus.HostUtils.kTrackEditorChanged)
                this.onTrackEditorChanged(msg.getArg(0));

            else if (msg.id == PreSonus.PadSection.kCurrentBankChanged)
                this.updateBankMenuColor();
        }

        onExit = function () {
            Host.Signals.unadvise(this.padSessionSection.component, this);
            Host.Signals.unadvise(this.padDrumSection.component, this);

            this.modes.setDevicePadMode('drum');

            PreSonus.HostUtils.enableEngineEditNotifications(this, false);

            PreSonus.ControlSurfaceComponent.prototype.onExit.call(this);
        }
}

// factory entry called by host
function createLaunchKeyMK3ExtendedComponentInstance() {
    return new LaunchKeyMK3ExtendedComponent;
}