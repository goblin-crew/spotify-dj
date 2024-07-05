import { PlaylistedTrack, Track, AudioFeatures } from '@spotify/web-api-ts-sdk';
import { DataSet } from '../types/DataSet';
import moment from 'moment';

const createPlaylistFromCurve = (
  tracks: (PlaylistedTrack<Track> & AudioFeatures)[],
  dataState: DataSet,
  duration: number,
  bpmThreshold = 5
) => {
  const sortedDataArray = Object.entries(dataState)
    .map(([progress, bpm]) => [parseInt(progress), bpm])
    .sort(([a], [b]) => a - b);
  const filledBpmCurve = sortedDataArray.reduce(
    (acc, [progress, bpm], index, array) => {
      const nextProgress = array[index + 1] ? array[index + 1][0] : 100;
      const nextBpm = array[index + 1] ? array[index + 1][1] : 50;
      const steps = nextProgress - progress;
      const stepSize = (nextBpm - bpm) / steps;
      for (let i = 0; i < steps; i++) {
        acc.push([progress + i, bpm + stepSize * i]);
      }
      return acc;
    },
    [] as [number, number][]
  );
  const filledBpmCurveArray = filledBpmCurve.map(([progress, bpm]) => [progress, Math.round(bpm)]);

  const newDataState: DataSet = {};
  const additionalData: [number, any][] = [];

  let currentProgress = 0;
  const newPlaylist: PlaylistedTrack<Track>[] = [];
  while (currentProgress < 100) {
    let tempBpmThreshold = bpmThreshold;
    const currentBpm = filledBpmCurveArray.find(([progress]) => progress === currentProgress)![1];

    const currentBpmTracks = [];
    while (currentBpmTracks.length === 0) {
      currentBpmTracks.push(
        ...tracks.filter(
          (track) =>
            track.tempo >= currentBpm - tempBpmThreshold &&
            track.tempo <= currentBpm + tempBpmThreshold &&
            !newPlaylist.includes(track)
        )
      );
      tempBpmThreshold += 5;
    }

    const randomTrack = currentBpmTracks[Math.floor(Math.random() * currentBpmTracks.length)];
    newPlaylist.push(randomTrack);
    newDataState[currentProgress] = randomTrack.tempo;
    additionalData.push([currentProgress, buildAdditionalDataElement(currentProgress, randomTrack, duration)]);
    currentProgress += Math.round((100 / duration) * randomTrack.track.duration_ms);
    console.debug(
      currentProgress,
      moment.utc((duration / 100) * currentProgress).format('HH:mm:ss'),
      randomTrack.track.duration_ms,
      randomTrack.track.name,
      randomTrack.tempo
    );
  }
  return { newPlaylist, newDataState, additionalData };
};

const buildAdditionalDataElement = (
  progress: number,
  track: PlaylistedTrack<Track> & AudioFeatures,
  duration: number
) => {
  return (
    <>
      <text x="50%" y="50%" style={{ fontSize: '14px' }}>
        {moment.utc((duration / 100) * progress).format('HH:mm')} - {track.track.name}
      </text>
      <text x="50%" y="70%" style={{ fontSize: '12px' }}>
        {track.tempo} BPM
      </text>
    </>
  );
};

export { createPlaylistFromCurve };
