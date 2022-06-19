import { waitFor } from "./wait";

const browserHasSerial = (): boolean => "serial" in navigator;

export type PanelSettings = {
    panelCount: number,
    sensorCount: number,
    maxPanels: number,
    maxSensors: number,
    buttonLimit: number
};

export type SensorData = {
    currentValue: number,
    enableThreshold: number,
    disableThreshold: number
}

export type PanelData = {
    sensors: Array<SensorData>;
}

export type SerialEventCallback = (data: string) => void;

const getPanelSettings = async (serial: PadSerialManager2): Promise<PanelSettings> => {
    let serialComplete = false;
    let settings: PanelSettings = {
        panelCount: 0,
        sensorCount: 0,
        maxPanels: 0,
        maxSensors: 0,
        buttonLimit: 0,
    };

    const loadSettings = (data: string) => {
        console.debug(data);
        const dataArr = data.split(' ');
        if (dataArr.length === 10) {
            settings = {
                panelCount: parseInt(dataArr[1]),
                sensorCount: parseInt(dataArr[3]),
                maxPanels: parseInt(dataArr[5]),
                maxSensors: parseInt(dataArr[7]),
                buttonLimit: parseInt(dataArr[9]),
            };
        }
        serialComplete = true;
    };

    await serial.write('s\n', loadSettings);
    await waitFor(() => serialComplete);

    return settings;
}

const getPanelState = async (serial: PadSerialManager2, settings: PanelSettings): Promise<Array<PanelData> | undefined> => {
    let serialComplete = true;
    let errorState = false;
    let panels: Array<PanelData> = [];

    const loadSensorData = (data: string): SensorData => {
        let sensorParts = data.split(': ')[1].split(' ');
        if (sensorParts.length !== 5) return { currentValue: 0, disableThreshold: 0, enableThreshold: 0};

        return {
            enableThreshold: Number(sensorParts[0]),
            disableThreshold: Number(sensorParts[1]),
            currentValue: Number(sensorParts[3])
        };
    }

    const loadPanelData = (data: string) => {
        console.log(data);
        const sensors = data.split('\n').slice(1, -1);
        if (sensors.length != settings.sensorCount) errorState = true;
        if (!errorState) {
            panels.push({sensors: sensors.map(loadSensorData)});
        };
        serialComplete = true;
    }

    for (let i = 0; i < settings.panelCount && !errorState; i++) {
        await waitFor(() => serialComplete, 1);
        serialComplete = false;
        await serial.write(`p ${i}\n`, loadPanelData);
    }
    await waitFor(() => serialComplete, 1);
    if (errorState) return undefined;
    return panels;
}

const setSensor = async (serial: PadSerialManager2, panelId: number, sensorId: number, pressThreshold: number, depressThreshold: number, stepRate: number) => {
    const command = `w ${panelId} ${sensorId} ${pressThreshold} ${depressThreshold} ${stepRate}\n`;
    await serial.write(command);
}

const arbitraryWrite = async (serial: PadSerialManager2, text: string, callback?: SerialEventCallback) => {
    let serialComplete = false;
    const callbackWrapper = (data: string) => {
        callback && callback(data);
        serialComplete = true;
    }
    await serial.write(`${text}\n`, callbackWrapper);
    await waitFor(() => serialComplete, 1);
}

class PadSerialManager2 {
    private encoder = new TextEncoder();
    private decoder = new TextDecoder();

    private port?: SerialPort;
    private open: boolean = false;

    private writes: Array<string> = [];
    private callbacks: Array<SerialEventCallback> = [];

    constructor() {

    }

    public init = async (): Promise<boolean> => {
        if (!browserHasSerial()) return false;

        const filters = [
            { usbVendorId: 0x2341, usbDeviceId: 0x8037 }
        ];
        try {
            this.port = await navigator.serial.requestPort({ filters });
        } catch {
            return false;
        }
        return true;
    }

    public connect = async () => {
        if (!this.port) return;
        try {
            await this.port.open({ baudRate: 115200, bufferSize: 255, dataBits: 8, flowControl: 'none', parity: 'none', stopBits: 1 })
            this.open = true;
            this.monitor();
            this.processWrite();
        } catch {

        }
    }

    private monitor = async () => {
        const dataEndFlag = new Uint8Array([4, 3]);
        while (this.open && this.port?.readable) {
            this.open = true;
            const reader = this.port.readable.getReader();
            try {
                let data: Uint8Array = new Uint8Array([]);
                while (this.open) {
                    const { value, done } = await reader.read();
                    if (done) {
                        this.open = false;
                        break;
                    }
                    if (value) {
                        data = Uint8Array.of(...data, ...value);
                    }
                    if (data.slice(-2).every((val, idx) => val === dataEndFlag[idx])) {
                        const decoded = this.decoder.decode(data);
                        const callback = this.callbacks.shift();
                        callback && callback(decoded);
                        data = new Uint8Array([]);
                    }
                }
                console.log("stopped monitoring");
            } catch {
                console.log("fatal?");

            }
        }
    }

    public write = async (data: string, callback?: SerialEventCallback) => {
        callback && this.callbacks.push(callback);
        this.writes.push(data);
    }

    private processWrite = async () => {
        while (this.open) {
            const nextMessage = this.writes.shift();
            if (nextMessage && this.port?.writable) {
                const writer = this.port.writable.getWriter();
                await writer.write(this.encoder.encode(nextMessage));
                writer.releaseLock();
            } else {
                await new Promise(resolve => setTimeout(resolve, 2));
            }
        }
    };

    public close = async () => {
        await this.port?.readable?.cancel();
        await this.port?.close();
    }
}

export default PadSerialManager2;

export {
    getPanelSettings,
    browserHasSerial,
    getPanelState,
    setSensor,
    arbitraryWrite
};
