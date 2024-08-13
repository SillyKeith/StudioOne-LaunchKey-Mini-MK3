include_file("./resources/controlsurfacecomponent.js");
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
}

class Modes extends PreSonus.ControlSurfaceComponent {
    constructor(hostComponent, bankCount) {
    super.onInit(hostComponent, bankCount);
    this.modeManager = [];
    this.bankCount = bankCount;
    this.drumElement = undefined;
    this.sessionElement = undefined;
    this.userDefinedElement = undefined;
    }

    onInit(hostComponent,bankCount) {
        let root = hostComponent.model.root;
        let paramList = hostComponent.paramList;
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
                    
                    channel.potValue = paramList.addAlias("potValue" + i);
        
                    channel.padSelect = paramList.addAlias("padSelectValue" + i);
                    channel.padSelectColor = paramList.addAlias("padSelectColorValue" + i);
                    channel.padSelectEffect = paramList.addInteger(0, 2, "padSelectEffectValue" + i);
        
                    channel.padToggle = paramList.addAlias("padToggleValue" + i);
                    channel.padToggleColor = paramList.addColor("padToggleColorValue" + i);
                    channel.padToggleEffect = paramList.addInteger(0, 2, "padToggleEffectValue" + i);
        
                    this.channels.push(channel);
                }
            }
        }