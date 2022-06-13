import { useEffect, useState } from "react";
import { BarChart, Legend, XAxis, YAxis, CartesianGrid, Bar, Tooltip } from 'recharts';

export type SensorData = {
    currentValue: number,
    enableThreshold: number,
    disableThreshold: number
}

export type PanelData = {
    sensors: Array<SensorData>;
}

export type PanelGraphProps = {
    panels: Array<PanelData>;
    sensorCount: number;
}

const PadGraph = (props: PanelGraphProps) => {
    const colour1: string = '#dd0000';
    const colour2: string = '#dddd00';
    const colour3: string = '#00dd00';
    const [data, setData] = useState([{}]);

    useEffect(() => {
        setData(props.panels.map((panel, index) => {
            let panelData = {
                name: `Panel ${index}`,
            };
            panel.sensors.map((sensor, index) => {
                console.log(`for ${sensor.currentValue} should be ${ Math.min(sensor.currentValue, sensor.disableThreshold)} `);
                const high = Math.max(sensor.currentValue-sensor.enableThreshold, 0);
                const mid = Math.max((sensor.currentValue-high)-sensor.disableThreshold, 0);
                const low = Math.min(sensor.currentValue, sensor.disableThreshold);
                panelData = {
                    ...panelData,
                    [`l${index}`]: low,
                    [`m${index}`]: mid,
                    [`h${index}`]: high,
                };
            });
            return panelData;
        }));
        console.log(data);
    }, [props.panels]);

    return (
        <div>
            <p>Hello</p>
            <BarChart
                width={500}
                height={300}
                data={data}

                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 1000]} />
                <Tooltip />
                <Legend />
                {[...new Array(props.sensorCount)].map((v, i) => 
                    <>
                        <Bar barSize={1000} dataKey={`l${i}`} stackId={"a"} fill={colour1} />
                        <Bar barSize={1000} dataKey={`m${i}`} stackId={"a"} fill={colour2} />
                        <Bar barSize={1000} dataKey={`h${i}`} stackId={"a"} fill={colour3} /> 
                    </>
                )}
            </BarChart>
        </div>
    )
}

export default PadGraph;