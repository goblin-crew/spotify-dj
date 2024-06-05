import { FC, useEffect, useState } from 'react';
import { DataSet } from '../../types/DataSet';
import moment from 'moment';
import { InputGroup, Form, Button, FloatingLabel, Col, Row } from 'react-bootstrap';
import './DataPointEditorComponent.css';

type Props = {
  dataState: DataSet;
  setData: React.Dispatch<React.SetStateAction<DataSet>>;
  progressSteps: number;
  durationMs: number;
};

const DataPointEditorComponent: FC<Props> = ({ dataState, setData, progressSteps, durationMs }) => {
  const [timeStamp, setTimeStamp] = useState<string[]>([]);
  const [localBpm, setLocalBpm] = useState<number[]>(Object.values(dataState));
  const [progressIsInvalid, setProgressIsInvalid] = useState<(boolean | undefined)[]>([]);
  const [bpmIsInvalid, setBpmIsInvalid] = useState<(boolean | undefined)[]>([]);

  const deleteDataPoint = (progress: number) => {
    const newDataState = { ...dataState };
    delete newDataState[progress];
    setData(newDataState);
  };

  useEffect(() => {
    setTimeStamp(Object.keys(dataState).map((progress) => progressToTime(+progress)));
  }, [dataState, durationMs]);

  const progressToTime = (progress: number) => {
    return moment.utc(durationMs * (progress / 100)).format('HH:mm');
  };

  const timeToMs = (time: string) => {
    return moment
      .duration(0)
      .add(moment(time, 'HH:mm').get('hours'), 'hours')
      .add(moment(time, 'HH:mm').get('minutes'), 'minutes')
      .as('milliseconds');
  };

  const timeToProgress = (time: string) => {
    return Math.round(((100 / durationMs) * timeToMs(time)) / progressSteps) * progressSteps;
  };

  const onTimeStampBlur = (event: React.FormEvent, i: number) => {
    const target = event.target as HTMLInputElement;
    if (!validateTimestamp(target.value, i)) return;
    const newProgress = timeToProgress(target.value);
    const newDataState = { ...dataState };
    delete newDataState[+Object.keys(dataState)[i]];
    newDataState[+newProgress] = dataState[+Object.keys(dataState)[i]];
    setData(newDataState);
  };

  const onBpmBlur = (event: React.FormEvent, i: number) => {
    const target = event.target as HTMLInputElement;
    if (!validateBpm(target.value, i)) return;
    const newDataState = { ...dataState };
    newDataState[+Object.keys(dataState)[i]] = parseInt(target.value);
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

  const validateTimestamp = (time: string, i: number) => {
    if (!/[0-5][0-9]:[0-5][0-9]/.test(time) || timeToMs(time) > durationMs) {
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
          .map(([progress], i, sortedArray) => (
            <Row key={progress} className="position-relative mb-3">
              <Col xs={12}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi-clock"></i>
                  </InputGroup.Text>
                  <Form.Control
                    value={timeStamp[i] || progressToTime(+progress)}
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
                      validateTimestamp(e.target.value, i);
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
                      value={localBpm[i] || 50}
                      isInvalid={bpmIsInvalid[i]}
                      min={1}
                      onBlur={(e) => {
                        onBpmBlur(e, i);
                      }}
                      onChange={(e) => {
                        setLocalBpm((prev) => {
                          const newLocalBpm = [...prev];
                          newLocalBpm[i] = parseInt(e.target.value);
                          return newLocalBpm;
                        });
                        validateBpm(e.target.value, i);
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
