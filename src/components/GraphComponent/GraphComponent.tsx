import React, { useState, useEffect, useCallback } from 'react';
import './GraphComponent.css';
import { DataSet } from '../../types/DataSet';
import moment from 'moment';

type Props = {
  dataState: DataSet;
  setData: React.Dispatch<React.SetStateAction<DataSet>>;
  progressSteps: number;
  bpmSteps: number;
  durationMs: number;
};

type PlotCoordinate = [number, number];

const GraphComponent: React.FC<Props> = ({ dataState, setData, progressSteps, bpmSteps, durationMs }) => {
  const [boundsState, setBounds] = useState<[number, number, number, number]>([30, 150, 0, 100]);
  const [draggingPoint, setDraggingPoint] = useState<number | null>(null);
  const [currnetMouseData, setCurrnetMouseData] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const svgRef = React.createRef<SVGSVGElement>();
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [bezierCommands, setBezierCommands] = useState<string>();

  const [showTooltip, setShowTooltip] = useState(true);

  const updateBounds = useCallback(
    (data: DataSet) => {
      const minBpm = (Math.round(Math.min(...Object.values(data)) / bpmSteps) - 2) * bpmSteps;
      const maxBpm = (Math.round(Math.max(...Object.values(data)) / bpmSteps) + 2) * bpmSteps;
      setBounds([minBpm, maxBpm, 0, 100]);
    },
    [bpmSteps]
  );

  useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setWidth(rect.width);
      setHeight(rect.height);
    }
  }, [svgRef]);

  useEffect(() => {
    updateBounds(dataState);
  }, [dataState, updateBounds]);

  useEffect(() => {
    const points: PlotCoordinate[] = Object.entries(dataState)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([progress, bpm]) => {
        const x = convertProgressToX(Number(progress), width);
        const y = convertBpmToY(bpm, height, boundsState);
        return [x, y];
      });

    const bezComs: string[] = [];

    points.forEach((point, i, a) => {
      if (i <= 0) {
        return;
      }
      bezComs.push(bezierCommand(point, i, a));
    });

    setBezierCommands(`${bezComs.join(' ')}`);
  }, [dataState, width, height, boundsState]);

  const handleMouseDown = (e: React.MouseEvent<SVGCircleElement>, progress: number) => {
    setDraggingPoint(progress);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const progress: number = Math.round(((x / width) * 100) / progressSteps) * progressSteps;
    const newBpm = Math.round(convertPercentageToBpm((1 / height) * y, boundsState));
    if (draggingPoint !== null) {
      if (!dataState[progress]) {
        const newData = { ...dataState };
        delete newData[draggingPoint];
        newData[progress] = Math.round(newBpm);
        setData(newData);
        setDraggingPoint(progress);
      } else {
        setData((prevData) => ({
          ...prevData,
          [draggingPoint]: Math.round(newBpm),
        }));
      }
    }
    setCurrnetMouseData([progress, newBpm, x, y]);
  };

  const handleMouseUp = () => {
    setDraggingPoint(null);
  };

  const handlePointDelete = (e: React.MouseEvent<SVGCircleElement, MouseEvent>, progress: number) => {
    e.preventDefault();
    e.stopPropagation();
    const newData = { ...dataState };
    delete newData[progress];
    setData(newData);
  };

  const handlePointAdd = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    // Normalize to steps
    const progress: number = Math.round(((x / width) * 100) / progressSteps) * progressSteps;
    if (dataState[progress]) {
      return;
    }
    const bpm = Math.round(convertPercentageToBpm((1 / height) * y, boundsState));
    const newDataState = { ...dataState };
    newDataState[progress] = bpm;
    setData(newDataState);
  };

  const convertBpmToY = (bpm: number, height: number, bounds: [number, number, number, number]) => {
    return (1 - (bpm - bounds[0]) / (bounds[1] - bounds[0])) * height;
  };

  const convertYToBpm = (y: number, height: number, bounds: [number, number, number, number]) => {
    return bounds[1] - (y / height) * (bounds[1] - bounds[0]);
  };

  const convertProgressToX = (progress: number, width: number) => {
    return (progress / 100) * width;
  };

  const convertXToProgress = (x: number, width: number) => {
    return (x / width) * 100;
  };

  const convertPercentageToBpm = (percentage: number, bounds: [number, number, number, number]) => {
    return bounds[0] + (1 - percentage) * (bounds[1] - bounds[0]);
  };

  const line = (pointA: PlotCoordinate, pointB: PlotCoordinate) => {
    const lengthX = pointB[0] - pointA[0];
    const lengthY = pointB[1] - pointA[1];
    return {
      length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
      angle: Math.atan2(lengthY, lengthX),
    };
  };

  // Position of a control point
  // I:  - current (array) [x, y]: current point coordinates
  //     - previous (array) [x, y]: previous point coordinates
  //     - next (array) [x, y]: next point coordinates
  //     - reverse (boolean, optional): sets the direction
  // O:  - (array) [x,y]: a tuple of coordinates
  const controlPoint = (current: PlotCoordinate, previous: PlotCoordinate, next: PlotCoordinate, reverse?: boolean) => {
    // When 'current' is the first or last point of the array
    // 'previous' or 'next' don't exist.
    // Replace with 'current'
    const p = previous || current;
    const n = next || current;
    // The smoothing ratio
    const smoothing = 0.1;

    // The flattening ratio
    const flattening = 0.5;
    // Properties of the opposed-line
    const o = line(p, n);
    // const flat = lib.map(Math.cos(o.angle) * this.o.line.flattening, 0, 1, 1, 0);

    const flat = Math.min(Math.max(flattening, 0), 1);

    // If is end-control-point, add PI to the angle to go backward
    const angle = o.angle * flat + (reverse ? Math.PI : 0);
    const length = o.length * smoothing;
    // The control point position is relative to the current point
    const x = current[0] + Math.cos(angle) * length;
    const y = current[1] + Math.sin(angle) * length;
    return [x, y];
  };

  // Create the bezier curve command
  // I:  - point (array) [x,y]: current point coordinates
  //     - i (integer): index of 'point' in the array 'a'
  //     - a (array): complete array of points coordinates
  // O:  - (string) 'C x2,y2 x1,y1 x,y': SVG cubic bezier C command
  const bezierCommand = (point: PlotCoordinate, i: number, a: PlotCoordinate[]) => {
    // start control point
    const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
    // end control point
    const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
    return `C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`;
  };

  return (
    <svg
      id="graph"
      className="graphSVG user-select-none w-100 h-100"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handlePointAdd}
      onMouseLeave={handleMouseUp}
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Defs for styling */}
      <defs>
        <filter id="lineBackDrop" y="-50%" height="400%">
          <feGaussianBlur stdDeviation="0 5" result="blur1" />
          <feGaussianBlur in="blur1" stdDeviation="2" result="blur1" />

          <feOffset in="blur1" result="offsetBlur" dx="0" dy="10" />

          <feComponentTransfer in="offsetBlur" result="transfer1">
            <feFuncA type="table" tableValues="0 2" />
          </feComponentTransfer>

          <feGaussianBlur in="transfer1" stdDeviation="10 60" result="blur2" />

          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id="rainbow" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100%" y2="0">
          {width &&
            Object.entries(dataState).map(([progress, bpm]) => {
              const x = convertProgressToX(Number(progress), width);
              return (
                <stop
                  key={progress}
                  offset={`${(x / width) * 100}%`}
                  stopColor={`hsl(${(bpm / boundsState[1]) * 360}, 100%, 50%)`}
                />
              );
            })}
        </linearGradient>

        <mask id="lineMask" height="400%">
          {bezierCommands && (
            <path
              fill="white"
              strokeWidth="4"
              className="transition1"
              d={`M 0 ${height}
          L ${convertProgressToX(0, width)},${convertBpmToY(dataState[0], height, boundsState)}
          ${bezierCommands}
           L ${width} ${height} Z`}
            />
          )}
        </mask>
      </defs>

      {/* Time Lines */}
      {[...Array(Math.floor(100 / progressSteps) + 1)].map((_, index) => {
        const x = convertProgressToX(index * progressSteps, width || 1000);
        return (
          <g key={index}>
            <text x={x} y={height - 10} fill="black" alignmentBaseline="middle">
              {moment.utc(durationMs * ((progressSteps * index) / 100)).format('HH:mm')}
            </text>
            return <line key={index} x1={x} y1="0" x2={x} y2="500" stroke="lightgray" strokeWidth="1" />;
          </g>
        );
      })}
      {/* BPM Lines */}
      {[...Array(Math.floor((boundsState[1] - boundsState[0]) / bpmSteps) + 1)].map((_, index) => {
        const bpm = boundsState[0] + index * bpmSteps;
        const y = convertBpmToY(bpm, height, boundsState);
        return (
          index !== 0 &&
          index !== Math.floor((boundsState[1] - boundsState[0]) / bpmSteps) && (
            <g key={index}>
              <text x="10" y={y - 10} fill="black" alignmentBaseline="middle">
                {bpm}
              </text>
              <line x1="0" y1={y} x2="1000" y2={y} stroke="lightgray" strokeWidth="1" />
            </g>
          )
        );
      })}

      {/* Data Points and Line */}
      {
        // Bezier Curve
        bezierCommands && (
          <path
            fill="none"
            strokeWidth="8"
            className="dataLine user-select-none transition1"
            d={`M${convertProgressToX(0, width)},${convertBpmToY(dataState[0], height, boundsState)} ${bezierCommands}`}
          />
        )
      }
      {/* circle elements for draggable functionality */}
      {Object.entries(dataState).map(([progress, bpm]) => {
        const x = convertProgressToX(Number(progress), width);
        const y = convertBpmToY(bpm, height, boundsState);
        return (
          <circle
            key={progress}
            cx={x}
            cy={y}
            r="6"
            fill={`hsl(${(bpm / boundsState[1]) * 360}, 100%, 50%)`}
            className={`dataPointCircle user-select-none transition1 ${draggingPoint == +progress ? 'active' : ''}`}
            onMouseDown={(e) => handleMouseDown(e, Number(progress))}
            onDoubleClick={(e) => handlePointDelete(e, Number(progress))}
          />
        );
      })}

      {
        // Tooltip
        showTooltip && (
          <g className="user-user-select-none position-absolute ">
            <text
              x={currnetMouseData[2] + 20}
              y={currnetMouseData[3]}
              fontSize="20"
              fill="black"
              className="toolTipText"
            >
              <tspan>Time: {moment.utc(durationMs * (currnetMouseData[0] / 100)).format('HH:mm:ss')}</tspan>
              <tspan x={currnetMouseData[2] + 20} dy="1.2em">
                BPM: {currnetMouseData[1]}
              </tspan>
            </text>
          </g>
        )
      }
    </svg>
  );
};

export default GraphComponent;
