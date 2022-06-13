import { useState, useEffect } from 'react';
import SerialManager, { browserHasSerial, getPanelSettings, PanelSettings } from './util/serial';

import PadEmitter from './components/PadEmitter';

export default function App() {
    const [loading, setLoading] = useState(true);
    const [panelSettings, setPanelSettings] = useState<PanelSettings | undefined>(undefined);
    const [serialManager] = useState<SerialManager>(new SerialManager());

    const supported = browserHasSerial();

    window.addEventListener('beforeunload', () => {
        serialManager.close();
        setLoading(true);
    });

    useEffect(() => {
        !loading && getPanelSettings(serialManager).then(setPanelSettings);
    }, [loading]);

    if (!supported) {
        return (
            <p>Looks like this browser doesn't support the WebSerial API. Try using a compatible browser: https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility</p>
        );
    }

    if (loading) {
        return (
            <button onClick={() => {
                serialManager.init().then(() => {
                    serialManager.connect().then((result) => {
                        setLoading(false);
                    });
                });
            }}>
                Connect to device
            </button>
        );
    }

    if (!panelSettings) {
        return (
            <p>Loading panel settings, hang on...</p>
        );
    }

    return (
        <div>
            <p>{`${JSON.stringify(panelSettings)}`}</p>
            <tbody>
                {[...Array(panelSettings?.panelCount)].map((x, i) => <button onClick={() => serialManager.write(`p ${i}\n`, console.log)}>panel {i}</button>)}
            </tbody>
            <div>
                {panelSettings && <PadEmitter serial={serialManager} settings={panelSettings} />}
            </div>
        </div>
    );
};
