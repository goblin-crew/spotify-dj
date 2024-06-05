import { FC, FormEvent, useRef } from 'react';
import { InputGroup, Form } from 'react-bootstrap';

type Props = {
  duration: { hours: number; minutes: number };
  setDuration: React.Dispatch<
    React.SetStateAction<{
      hours: number;
      minutes: number;
    }>
  >;
};

const DurationInputComponent: FC<Props> = ({ duration, setDuration }) => {
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
  return (
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
  );
};

export default DurationInputComponent;
