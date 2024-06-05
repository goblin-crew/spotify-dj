import { FC, useEffect, useRef, useState } from 'react';
import './GraphComponent.css';
import { DataSet } from '../../types/DataSet';
import moment from 'moment';

type Props = {
  dataState: DataSet;
  setData: React.Dispatch<React.SetStateAction<DataSet>>;
  duration: {
    hours: number;
    minutes: number;
  };
  progressSteps: number;
  bpmSteps: number;
  durationMs: number;
};

const GraphComponent: FC<Props> = ({ dataState, setData, duration, progressSteps, bpmSteps, durationMs }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const graphColor = 'blue';
  const gridColor = 'lightgray';
  // the data is a set with the progress as key and the bpm as value. The progress is a number between 0 and 100

  // the bounds are the min and max values of the bpm and the progress
  const [boundsState, setBounds] = useState<[number, number, number, number]>([30, 150, 0, 100]);

  const [mouseOverDataPoint, setMouseOverDataPoint] = useState<number | null>(null);

  const updateBounds = (data: DataSet) => {
    // Update the bounds of the graph using the data and normalize the bounds to the steps
    const minBpm = (Math.round(Math.min(...Object.values(data)) / bpmSteps) - 2) * bpmSteps;
    const maxBpm = (Math.round(Math.max(...Object.values(data)) / bpmSteps) + 2) * bpmSteps;
    setBounds([minBpm, maxBpm, 0, 100]);
  };

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bounds: [number, number, number, number]
  ) => {
    // Draw the grid using the bounds of the graph and the width and height of the canvas
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    // Draw the horizontal lines for the bpm with data labels using the bpm steps and bounds
    for (let i = bounds[0]; i <= bounds[1]; i += bpmSteps) {
      const y = convertBpmToPercentage(i, bounds) * height;
      ctx.moveTo(0, y);
      ctx.fillText(`${i.toString()}`, 0, y);
      ctx.lineTo(width, y);
    }

    // Draw the vertical lines
    for (let i = 0; i <= 100; i += progressSteps) {
      const x = (i / 100) * width;
      ctx.moveTo(x, 0);
      ctx.fillText(`${moment.utc(durationMs * (i / 100)).format('HH:mm')}`, x, ctx.canvas.height);
      ctx.lineTo(x, height);
    }

    ctx.stroke();
  };

  const drawGraph = (ctx: CanvasRenderingContext2D, data: DataSet, bounds: [number, number, number, number]) => {
    // Draw the graph using the data and the bounds
    ctx.beginPath();

    ctx.moveTo(0, 0);
    const pointCoordinates: [number, [number, number]][] = [];
    // transform the data to coordinates
    for (const [progress, bpm] of Object.entries(data).sort(([a], [b]) => Number(a) - Number(b))) {
      const x = ((Number(progress) - bounds[2]) / (bounds[3] - bounds[2])) * ctx.canvas.width;
      const y = ctx.canvas.height * convertBpmToPercentage(bpm, bounds);
      if (Number(progress) === 0) ctx.moveTo(x, y);
      pointCoordinates.push([Number(progress), [x, y]]);
    }
    // draw a smooth graph using the coordinates using bezier curves
    for (let i = 0; i < pointCoordinates.length - 1; i++) {
      ctx.strokeStyle = graphColor;
      ctx.lineWidth = 2;
      const p0 = pointCoordinates[i][1];
      const p1 = pointCoordinates[i + 1][1];
      // draw a smooth line to the next point
      const cp0 = [(p0[0] + p1[0]) / 2, p0[1]];
      const cp1 = [(p0[0] + p1[0]) / 2, p1[1]];
      ctx.bezierCurveTo(cp0[0], cp0[1], cp1[0], cp1[1], p1[0], p1[1]);
      // draw the bpm value and draw a dot  at the point
      data[pointCoordinates[i + 1][0]] && ctx.fillText(`${data[pointCoordinates[i + 1][0]]}`, p1[0], p1[1]);
      ctx.arc(p1[0], p1[1], 2, 0, 2 * Math.PI);
    }
    ctx.stroke();
    // highlight the point if the mouse is over it
    if (mouseOverDataPoint && mouseOverDataPoint === pointCoordinates.find((p) => p[0] === mouseOverDataPoint)?.[0]) {
      ctx.beginPath();
      const p1 = pointCoordinates.find((p) => p[0] === mouseOverDataPoint)?.[1];
      if (!p1) return;
      ctx.arc(p1[0], p1[1], 5, 0, 2 * Math.PI);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const updateCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.canvas.width = ctx.canvas.clientWidth;
        ctx.canvas.height = ctx.canvas.clientHeight;
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        // clear the canvas
        ctx.clearRect(0, 0, width, height);
        // draw the grid
        drawGrid(ctx, width, height, boundsState);
        // draw the graph
        drawGraph(ctx, dataState, boundsState);
      }
    }
  };

  const convertBpmToPercentage = (bpm: number, bounds: [number, number, number, number]) => {
    return 1 - (bpm - bounds[0]) / (bounds[1] - bounds[0]);
  };

  const convertPercentageToBpm = (percentage: number, bounds: [number, number, number, number]) => {
    return bounds[0] + (1 - percentage) * (bounds[1] - bounds[0]);
  };

  useEffect(() => {
    updateBounds(dataState);
    updateCanvas();
  }, [dataState, mouseOverDataPoint, durationMs]);

  useEffect(() => {
    var isDragging = false;
    var expired: number | null = null;

    const handleDoubleClick = (event: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const width = rect.width;
        const progress: number = Math.round(((x / width) * 100) / progressSteps) * progressSteps;
        const data = { ...dataState };
        delete data[progress];
        setData(data);
      }
    };

    const handleDoubleTap = (event: TouchEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = event.touches[0].clientX - rect.left;
        const width = rect.width;
        const progress: number = Math.round(((x / width) * 100) / progressSteps) * progressSteps;
        const data = { ...dataState };
        delete data[progress];
        setData(data);
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      isDragging = true;
      if (canvasRef.current) {
        const handleDrag = (event: MouseEvent) => {
          if (canvasRef.current && isDragging) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const width = rect.width;
            const height = rect.height;
            // Normalize to steps
            const progress: number = Math.round(((x / width) * 100) / progressSteps) * progressSteps;
            const bpm = Math.round(convertPercentageToBpm((1 / height) * y, boundsState));
            setData((prev) => ({ ...prev, [progress]: bpm }));

            canvasRef.current?.addEventListener('mouseup', () => {
              isDragging = false;
            });
            canvasRef.current?.addEventListener('mouseleave', () => {
              isDragging = false;
            });
          }
        };

        canvasRef.current?.addEventListener('mousemove', handleDrag);
        handleDrag(event);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();

      if (event.touches.length === 1) {
        if (!expired) {
          expired = event.timeStamp + 400;
        } else if (event.timeStamp <= expired) {
          // remove the default of this event ( Zoom )
          event.preventDefault();
          handleDoubleTap(event);
          // then reset the variable for other "double Touches" event
          expired = null;
          return;
        } else {
          // if the second touch was expired, make it as it's the first
          expired = event.timeStamp + 400;
        }
      }
      isDragging = true;
      if (canvasRef.current) {
        const handleDrag = (event: TouchEvent) => {
          if (canvasRef.current && isDragging) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = event.touches[0].clientX - rect.left;
            const y = event.touches[0].clientY - rect.top;
            const width = rect.width;
            const height = rect.height;
            // Normalize to steps
            const progress: number = Math.round(((x / width) * 100) / progressSteps) * progressSteps;
            const bpm = Math.round(convertPercentageToBpm((1 / height) * y, boundsState));
            setData((prev) => ({ ...prev, [progress]: bpm }));
            setMouseOverDataPoint(progress);

            canvasRef.current?.addEventListener('touchend', () => {
              isDragging = false;
              setMouseOverDataPoint(null);
            });
            canvasRef.current?.addEventListener('touchcancel', () => {
              isDragging = false;
              setMouseOverDataPoint(null);
            });
          }
        };
        canvasRef.current?.addEventListener('touchmove', handleDrag);
        handleDrag(event);
      }
    };

    // If the mouse is over a datapoint, highlight it
    const onOverDataPoint = (event: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const width = rect.width;
        const height = rect.height;
        const progress: number = Math.round(((x / width) * 100) / progressSteps) * progressSteps;
        if (dataState[progress]) {
          setMouseOverDataPoint(progress);
        } else {
          setMouseOverDataPoint(null);
        }
      }
    };

    canvasRef.current?.addEventListener('dblclick', handleDoubleClick);
    canvasRef.current?.addEventListener('touchstart', handleTouchStart);
    canvasRef.current?.addEventListener('mousedown', handleMouseDown);
    canvasRef.current?.addEventListener('mousemove', onOverDataPoint);
    canvasRef.current?.addEventListener('mouseleave', () => {
      setMouseOverDataPoint(null);
    });

    return () => {
      canvasRef.current?.removeEventListener('dblclick', handleDoubleClick);
      canvasRef.current?.removeEventListener('mousedown', handleMouseDown);
      canvasRef.current?.removeEventListener('mousemove', onOverDataPoint);
      canvasRef.current?.removeEventListener('mouseleave', () => {
        setMouseOverDataPoint(null);
      });
      canvasRef.current?.removeEventListener('touchstart', handleTouchStart);
      canvasRef.current?.removeEventListener('touchend', () => {
        isDragging = false;
        setMouseOverDataPoint(null);
      });
      canvasRef.current?.removeEventListener('touchcancel', () => {
        isDragging = false;
        setMouseOverDataPoint(null);
      });
      canvasRef.current?.removeEventListener('touchmove', (e) => {});

      canvasRef.current?.removeEventListener('mouseup', () => {
        isDragging = false;
      });
      canvasRef.current?.removeEventListener('mouseleave', () => {
        isDragging = false;
      });

      canvasRef.current?.removeEventListener('mousemove', (e) => {});
    };
  }, [canvasRef, boundsState, dataState]);

  return <canvas ref={canvasRef} id="graph" className="graphCanvas user-select-none" />;
};

export default GraphComponent;
