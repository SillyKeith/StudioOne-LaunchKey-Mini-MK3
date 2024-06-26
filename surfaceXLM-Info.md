# About

This is a living document to detail information about Presonus Studio One surface.XML / device mapping files.

## Pre-read

First, you must understand about Studio One's ***"Focus mode"***. You can avoid remapping your MIDI controller for every song, but the behavior is not intuitive. If you are in focus mode the mapping works as long as your plugin window **is in focus.** Additionally, the mapping between your hardware knob and plugin parameter is retained between songs. Reference <https://www.youtube.com/watch?v=Vq0GMDvagi4>

*Yellow button on in the upper right hand corner of the plugin window indicates focus mode.*

![Focus-mode](./resources/S1-focus-mode.png)

When you are in global mode (same button is not yellow), your MIDI knobs continue to control the plugin even if its window is not in focus.

Presonus Studio One Surface/Device mapping cheatsheet ![Cheetsheet](./resources/Presonus-Studio-One-suface-XML-cheatsheet.png)

## Control-Surface

The basic keyboard.suface.xml structure looks like the below.

*You can define namespaces and variables within sections as needed.*

```XML
<ControlSurface> <!--** Create only ONE Instance **-->
    
    <Controls> <!--** Create only ONE Instance **-->
        <Control name="" type="" options="" title=""> <!--**create as many as needed**-->
            <MidiMessage status="" channel=n address=n options="" resolution=""/>
            <Handler class="MyCustomHandler"/> <!-- Requires custom Javascript code -->
        </Control>
    </Controls>
    
    <Mappings> <!--** Create only ONE Instance **-->
        <define name="MYNAMESPACE[n]" value="0" />
        ... 
        
        <GenericMappings> <!--** Create only ONE Instance **-->
            <Bank target="" name="">
                <ScrollBank target=...>
                    <Strip name="" onConnect...>
                        <ParamInvoke param="" options=""/>
                        <Value control="" param="" options=""/>
                        <Touch control="" param="" options=""/>
                        <String control="" param="" options=""/>
                    </Strip>
                </ScrollBank>
            </Bank>
        </GenericMappings>
        
        <Global> <!--** Create only ONE Instance **-->
            <Toggle control="" param="" options=""/>
            <Radio control="" param="" value="" options="" offvalue=""/>
            <Invoke control="" onRecieve=""/>
            <PlainValue control="" param=""/>
            <Value control="" param=""/>
            <Command control="" command.category="" command.name="" options=""/>
            
        </Global>

        <PadSection> <!--**create as many as needed**-->
            ..stuff..
            <foreach>
                <ParamVariant> </ParamVariant>
            </foreach>
        </PadSection>
        
        <DeviceMapping name="" device="" onConnect=""> <!--**create as many as needed**-->
        <!-- Other XML sections are allowed inside like -->
        <!-- include template="" -->
        <!-- Bank | PlacementBank | ScrollBank -->
        <!--    Target= RemoteBank | AllBank | FollowBank | MasterBank | FowardBank -->
        <!--    Strip | Foreach | ScrollButton -->
        <!-- ParamVariant | Group | Invoke | Value | ParamInvoke -->
        </DeviceMapping>

    </Mappings>
    
    <Templates>  <!--** Create only ONE Instance **-->
        <Template name=""> <!--**create as many as needed**-->
            <String control="" param=""/>
            <Value control="" param=""/>
            <Touch control="" param="" options=""/>
            <Radio control="" param="" value="" options="" offvalue=""/>
            <Variant control="" options="" statusled="">
                <Group>
                    <Relative control="" param=""/>
                </Group>
        </Template>
    </Templates>

    <Sections>
        <GenericSection name="" rows="" columns="">
            ..stuff..
        </GenericSection>
    </Sections>

</ControlSurface>```
