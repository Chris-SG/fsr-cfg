
import { useEffect, useState } from 'react';
import PadSerialManager2, { getPanelState, PanelSettings } from '../../util/serial';
import PadGraph, { PanelData } from '../PadGraph';

export type PadEmitterProps = {
    serial: PadSerialManager2;
    settings: PanelSettings;
}

const PadEmitter = (props: PadEmitterProps) => {
    const [panelData, setPanelData] = useState<Array<PanelData>>([]);

    const dataFetcher = async () => {
        const newData = await getPanelState(props.serial, props.settings);
        newData && setPanelData(newData);
        setTimeout(dataFetcher, 20);
    };
    
    useEffect(() => {
        dataFetcher();
    }, []);

    return (<>
        <p>{JSON.stringify(panelData, undefined, 4)}</p>
        <PadGraph panels={panelData} sensorCount={props.settings.sensorCount} />
    </>);
}

export default PadEmitter;
