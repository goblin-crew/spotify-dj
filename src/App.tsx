import { Col, Container, Row } from 'react-bootstrap';
import './App.css';
import Logo from './assets/logo.svg';
import GraphComponent from './components/GraphComponent/GraphComponent';
import { DataSet } from './types/DataSet';
import { useEffect, useState } from 'react';
import DataPointEditorComponent from './components/DataPointEditorComponent/DataPointEditorComponent';
import DurationInputComponent from './components/DurationInputComponent/DurationInputComponent';

function App() {
  const progressSteps = 5;
  const bpmSteps = 5;
  const [dataState, setData] = useState<DataSet>({
    0: 50,
    20: 70,
    50: 60,
    70: 100,
    100: 50,
  });

  const [duration, setDuration] = useState({
    hours: 1,
    minutes: 0,
  });

  useEffect(() => {
    if (duration.hours == 0 && duration.minutes == 0) {
      setDuration({
        hours: 1,
        minutes: 0,
      });
    }
  }, [duration]);

  useEffect(() => {
    if (!dataState[0] || isNaN(dataState[0])) {
      const sortedDataArray = Object.entries(dataState).sort(([a], [b]) => parseInt(a) - parseInt(b));
      if (sortedDataArray.length <= 1) {
        setData((prev) => ({ ...prev, 0: 50 }));
        return;
      }
      const firstProgress = +sortedDataArray[0][0];
      const firstBpm = +sortedDataArray[0][1];
      const newDataState = { ...dataState };
      delete newDataState[firstProgress];
      newDataState[0] = firstBpm;
      setData(newDataState);
    }
    if (!dataState[100] || isNaN(dataState[100])) {
      const sortedDataArray = Object.entries(dataState).sort(([a], [b]) => parseInt(a) - parseInt(b));
      if (sortedDataArray.length <= 1) {
        setData((prev) => ({ ...prev, 100: 50 }));
        return;
      }
      const lastProgress = +sortedDataArray[sortedDataArray.length - 1][0];
      const lastBpm = +sortedDataArray[sortedDataArray.length - 1][1];
      const newDataState = { ...dataState };
      delete newDataState[lastProgress];
      newDataState[100] = lastBpm;
      setData(newDataState);
    }
  }, [dataState]);

  return (
    <Container>
      <img src={Logo} alt="Spotify DJ Logo" width={'10%'} />
      <h1>Spotify DJ</h1>
      <h2>Playlist</h2>
      <Col xs={3}>
        <DurationInputComponent duration={duration} setDuration={setDuration} />
      </Col>
      <Row>
        <Col xs={9}>
          <GraphComponent
            dataState={dataState}
            setData={setData}
            duration={duration}
            progressSteps={progressSteps}
            bpmSteps={bpmSteps}
          />
        </Col>
        <Col xs={3}>
          <DataPointEditorComponent
            dataState={dataState}
            setData={setData}
            duration={duration}
            progressSteps={progressSteps}
            setDuration={setDuration}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
