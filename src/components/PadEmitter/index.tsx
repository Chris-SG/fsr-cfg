
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import PadSerialManager2, { arbitraryWrite, getPanelState, PanelSettings } from '../../util/serial';
import PadGraph, { PanelData } from '../PadGraph';

export type PadEmitterProps = {
    serial: PadSerialManager2;
    settings: PanelSettings;
}

const PadEmitter = (props: PadEmitterProps) => {
    const [panelData, setPanelData] = useState<Array<PanelData>>([]);
    const [inputText, setInputText] = useState('');

    const dataFetcher = async () => {
        const newData = await getPanelState(props.serial, props.settings);
        newData && setPanelData(newData);
        setTimeout(dataFetcher, 20);
    };

    const handleCommandSend = (event: FormEvent) => {
        event.preventDefault();
        arbitraryWrite(props.serial, inputText);
        setInputText("");
    }

    const updateText = (event: ChangeEvent<HTMLInputElement>) => {
        setInputText(event.target.value);
    }
    
    useEffect(() => {
        dataFetcher();
    }, []);

    return (<>
        <p>{JSON.stringify(panelData, undefined, 4)}</p>
        <button onClick={dataFetcher}>Reload panel settings</button>
        <PadGraph panels={panelData} sensorCount={props.settings.sensorCount} />
        <form onSubmit={handleCommandSend}>
            <label>
                Command:
                <input type="text" value={inputText} onChange={updateText} />
            </label>
            <input type="submit" value="Submit" />
        </form>
    </>);
}

export default PadEmitter;
