import { FC, useEffect, useState } from 'react';
import { DataSet } from '../../types/DataSet';
import moment from 'moment';
import { InputGroup, Form, Button, FloatingLabel, Col, Row } from 'react-bootstrap';
import './DataPointEditorComponent.css';

type Props = {
  dataState: DataSet;
  setData: React.Dispatch<React.SetStateAction<DataSet>>;
  duration: { hours: number; minutes: number };
  progressSteps: number;
  setDuration: React.Dispatch<React.SetStateAction<{ hours: number; minutes: number }>>;
};

const DataPointEditorComponent: FC<Props> = ({ dataState, setData, duration, progressSteps, setDuration }) => {
  const [durationMs, setDurationMs] = useState<number>(0);
  const [timeStamp, setTimeStamp] = useState<string[]>([]);
  const [progressIsInvalid, setProgressIsInvalid] = useState<(boolean | undefined)[]>([]);
  const [bpmIsInvalid, setBpmIsInvalid] = useState<(boolean | undefined)[]>([]);

  const deleteDataPoint = (progress: number) => {
    const newDataState = { ...dataState };
    delete newDataState[progress];
    setData(newDataState);
  };
  useEffect(() => {
    setDurationMs(moment.duration(0).add(duration.hours, 'hours').add(duration.minutes, 'minutes').as('milliseconds'));
  }, [duration]);

  useEffect(() => {
    setTimeStamp(Object.keys(dataState).map((progress) => progressToTime(+progress)));
  }, [dataState, durationMs]);

  const progressToTime = (progress: number) => {
    return moment.utc(durationMs * (progress / 100)).format('HH:mm');
  };

  const timeToProgress = (time: string) => {
    return (
      Math.round(
        ((100 / durationMs) *
          moment
            .duration(0)
            .add(moment(time, 'HH:mm').get('hours'), 'hours')
            .add(moment(time, 'HH:mm').get('minutes'), 'minutes')
            .as('milliseconds')) /
          progressSteps
      ) * progressSteps
    );
  };

  const updateDuration = () => {
    const sortedTimeStamps = timeStamp.sort((a, b) => moment(a, 'HH:mm').diff(moment(b, 'HH:mm')));
    const newDuration = moment.duration(
      moment(sortedTimeStamps[sortedTimeStamps.length - 1], 'HH:mm').diff(moment(sortedTimeStamps[0], 'HH:mm'))
    );

    setDuration({ hours: newDuration.get('hours'), minutes: newDuration.get('minutes') });
  };

  const onTimeStampBlur = (event: React.FormEvent, i: number) => {
    const target = event.target as HTMLInputElement;
    if (!validateProgress(target.value, i)) return;
    const newProgress = timeToProgress(target.value);
    const newDataState = { ...dataState };
    delete newDataState[+Object.keys(dataState)[i]];
    newDataState[+newProgress] = dataState[+Object.keys(dataState)[i]];
    setData(newDataState);
  };

  const addDataPoint = (progress: number) => {
    return () => {
      const newDataState = { ...dataState };
      newDataState[progress] = 50;
      setData(newDataState);
    };
  };

  const validateBpm = (bpm: string, i: number) => {
    if (!bpm || bpm.length < 1 || isNaN(+bpm)) {
      setBpmIsInvalid((prev) => {
        const newBpmIsInvalid = [...prev];
        newBpmIsInvalid[i] = true;
        return newBpmIsInvalid;
      });
      return false;
    } else {
      setBpmIsInvalid((prev) => {
        const newBpmIsInvalid = [...prev];
        newBpmIsInvalid[i] = false;
        return newBpmIsInvalid;
      });
      return true;
    }
  };

  const validateProgress = (progress: string, i: number) => {
    if (progress.match(/[0-5][0-9]:[0-5][0-9]/) === null) {
      setProgressIsInvalid((prev) => {
        const newProgressIsInvalid = [...prev];
        newProgressIsInvalid[i] = true;
        return newProgressIsInvalid;
      });
      return false;
    } else {
      setProgressIsInvalid((prev) => {
        const newProgressIsInvalid = [...prev];
        newProgressIsInvalid[i] = false;
        return newProgressIsInvalid;
      });
      return true;
    }
  };

  return (
    <>
      {dataState &&
        Object.entries(dataState)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([progress, bpm], i, sortedArray) => (
            <Row key={progress} className="position-relative mb-3">
              <Col xs={12}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi-clock"></i>
                  </InputGroup.Text>
                  <Form.Control
                    value={timeStamp[i]}
                    pattern="[0-5][0-9]\:[0-5][0-9]"
                    isInvalid={progressIsInvalid[i]}
                    onBlur={(e) => {
                      onTimeStampBlur(e, i);
                    }}
                    onChange={(e) => {
                      setTimeStamp((prev) => {
                        const newTimeStamp = [...prev];
                        newTimeStamp[i] = e.target.value;
                        return newTimeStamp;
                      });
                      validateProgress(e.target.value, i) && updateDuration();
                    }}
                    type="string"
                    placeholder="Progress"
                    aria-label="Progress"
                    aria-describedby="basic-addon2"
                    disabled={i === 0 || i === Object.keys(dataState).length - 1}
                  />
                  <InputGroup.Text>
                    <i className="bi-speedometer" />
                  </InputGroup.Text>
                  <FloatingLabel controlId="floatingInput" label="BPM">
                    <Form.Control
                      value={+bpm}
                      isInvalid={bpmIsInvalid[i]}
                      min={1}
                      onBlur={(e) => {
                        validateBpm(e.target.value, i);
                      }}
                      onChange={(e) => {
                        validateBpm(e.target.value, i);
                        const newBpm = parseInt(e.target.value);
                        const newDataState = { ...dataState };
                        newDataState[+progress] = newBpm;
                        setData(newDataState);
                      }}
                      type="number"
                      placeholder="BPM"
                      aria-label="BPM"
                      aria-describedby="basic-addon2"
                      onFocus={(e) => {
                        e.currentTarget.select();
                      }}
                    />
                  </FloatingLabel>
                  <Button
                    onClick={() => deleteDataPoint(+progress)}
                    variant="outline-secondary"
                    id="button-addon2"
                    disabled={Object.entries(dataState).length <= 2}
                  >
                    <i className="bi-trash"></i>
                  </Button>
                </InputGroup>
              </Col>
              {i !== Object.keys(dataState).length - 1 &&
                sortedArray[i + 1] &&
                Math.abs(+progress - +sortedArray[i + 1][0]) > progressSteps && (
                  <Col
                    xs={12}
                    className="addDataPoint d-flex justify-content-center align-items-center separator position-absolute"
                    onClick={addDataPoint(+progress + progressSteps)}
                  >
                    <i className="bi-plus-circle m-0 p-0" style={{ color: 'cornflowerblue', lineHeight: '1' }} />
                  </Col>
                )}
            </Row>
          ))}
    </>
  );
};

export default DataPointEditorComponent;
