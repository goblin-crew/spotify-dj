import { Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import './App.css';
import Logo from './assets/logo.svg';
import GraphComponent from './components/GraphComponent/GraphComponent';
import { DataSet } from './types/DataSet';
import { FormEvent, useEffect, useRef, useState } from 'react';

function App() {
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

  const minuteInputRef = useRef<HTMLInputElement>(null);

  const handleDurationChange = (event: FormEvent) => {
    const target = event.target as HTMLInputElement;
    switch (target.id) {
      case 'hourInput':
        const inputVal = target.value;
        if (inputVal.length == 2) minuteInputRef.current?.focus();
        let hours = parseInt(inputVal);
        if (isNaN(hours)) hours = 0;
        if (hours < 0) hours = 0;
        setDuration((prev) => ({
          hours: hours,
          minutes: prev.minutes,
        }));
        break;
      case 'minuteInput':
        if (target.value.length == 2) target.blur();
        let minutes = parseInt(target.value);
        if (isNaN(minutes)) minutes = 0;
        if (minutes < 0) minutes = 0;
        if (minutes > 59) minutes = 59;
        setDuration((prev) => ({
          hours: prev.hours,
          minutes: minutes,
        }));
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (duration.hours == 0 && duration.minutes == 0) {
      setDuration({
        hours: 1,
        minutes: 0,
      });
    }
  }, [duration]);

  return (
    <Container>
      <img src={Logo} alt="Spotify DJ Logo" width={'10%'} />
      <h1>Spotify DJ</h1>
      <h2>Playlist</h2>
      <Col xs={3}>
        <InputGroup size="sm">
          <InputGroup.Text>Playlist Duration</InputGroup.Text>
          <Form.Control
            onFocus={(e) => e.currentTarget.select()}
            onChange={handleDurationChange}
            min={0}
            max={59}
            maxLength={2}
            type="number"
            id="hourInput"
            placeholder="HH"
            value={duration.hours}
          />
          <InputGroup.Text>:</InputGroup.Text>
          <Form.Control
            onFocus={(e) => e.currentTarget.select()}
            ref={minuteInputRef}
            onChange={handleDurationChange}
            min={0}
            maxLength={2}
            type="number"
            id="minuteInput"
            placeholder="mm"
            value={duration.minutes}
          />
        </InputGroup>
      </Col>
      <Row>
        <Col xs={12}>
          <GraphComponent dataState={dataState} setData={setData} duration={duration} />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
