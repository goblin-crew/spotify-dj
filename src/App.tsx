import { Col, Container, Navbar, Row } from 'react-bootstrap';
import './App.css';
import Logo from './assets/logo.svg';
import GraphComponent from './components/GraphComponent/GraphComponent';
import { DataSet } from './types/DataSet';
import { useEffect, useState } from 'react';
import DataPointEditorComponent from './components/DataPointEditorComponent/DataPointEditorComponent';
import DurationInputComponent from './components/DurationInputComponent/DurationInputComponent';
import moment from 'moment';

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

  const [durationMs, setDurationMs] = useState<number>(0);

  useEffect(() => {
    if (duration.hours == 0 && duration.minutes == 0) {
      setDuration({
        hours: 1,
        minutes: 0,
      });
    }
    setDurationMs(moment.duration(0).add(duration.hours, 'hours').add(duration.minutes, 'minutes').as('milliseconds'));
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
    <>
      <Navbar className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="">
            <img src={Logo} alt="Spotify DJ Logo" width={'10%'} className="d-inline-block align-top" />
            <span className="h3 ms-4 d-inline-block align-middle">Spotify DJ</span>
          </Navbar.Brand>
        </Container>
      </Navbar>
      <Container>
        <h2>BPM Graph</h2>
        <Col xs={3} className="mb-2">
          <DurationInputComponent duration={duration} setDuration={setDuration} />
        </Col>
        <Row>
          <Col xs={9} style={{ maxHeight: '50vh' }}>
            <GraphComponent
              dataState={dataState}
              setData={setData}
              progressSteps={progressSteps}
              bpmSteps={bpmSteps}
              durationMs={durationMs}
            />
          </Col>
          <Col xs={3} className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
            <DataPointEditorComponent
              dataState={dataState}
              setData={setData}
              duration={duration}
              progressSteps={progressSteps}
              durationMs={durationMs}
            />
          </Col>
        </Row>
        <hr />
      </Container>
    </>
  );
}

export default App;
