import { SimplifiedPlaylist } from '@spotify/web-api-ts-sdk';
import { FC } from 'react';
import { Card } from 'react-bootstrap';
import './PlaylistCardComponent.css';

type Props = {
  playlist: SimplifiedPlaylist;
  setSelectedPlaylist: React.Dispatch<React.SetStateAction<SimplifiedPlaylist | null>>;
  selected?: boolean;
};

const PlaylistCardComponent: FC<Props> = ({ playlist, setSelectedPlaylist, selected }) => {
  return (
    <Card
      onClick={() => setSelectedPlaylist(selected ? null : playlist)}
      className={`${selected ? 'border-primary' : ''}, clickable`}
    >
      <Card.Body>
        <div
          style={{
            backgroundImage: `url(${playlist.images && playlist.images.length > 0 ? playlist.images[0].url : 'https://cataas.com/cat'})`,
            objectFit: 'cover',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
          className="aspectSquare w-100 d-flex justify-content-center align-items-end playlistImage overflow-hidden"
        >
          {playlist.description && (
            <p className="lineClamp4 playlistDescription p-1 w-100 mb-0 user-select-none">{playlist.description}</p>
          )}
        </div>
        <Card.Title className="lineClamp2 user-select-none">{playlist.name}</Card.Title>
        <Card.Text>{playlist.owner.display_name}</Card.Text>
      </Card.Body>
    </Card>
  );
};

export default PlaylistCardComponent;
