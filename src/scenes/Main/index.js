import React, { Component } from "react";
import { Row, Col, Button } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { parseAsync } from "json2csv";
import _ from "lodash";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { getPlaylists, getTracks } from "api";
import { parse, authorize } from "utils";
import "./style.css";

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      extractingPlaylists: false,
      extractingTracks: false,
      tracks: {},
      playlists: [],
      completed: false,
      exported: false
    };
    this.offset = 0;
    this.offsetTracks = 0;
    this.c = 0;
  }

  componentDidMount() {
    let accessToken = parse();
    if (accessToken) {
      this.setState({
        extractingPlaylists: true
      });
      this.extractPlaylists(accessToken);
    }
  }

  componentDidUpdate() {
    const { completed, exported } = this.state;
    if (completed && !exported) {
      this.toCsv();
    }
  }

  extractChunk = (token, playlist) => {
    const { tracks, playlists } = this.state;
    let tempTracks = Object.assign({}, tracks);
    return new Promise(async (resolve, reject) => {
      let extracted = null;
      let done = false;
      do {
        let playlistId = playlist.id;
        let response = await getTracks(token, playlistId, this.offsetTracks);
        extracted = response.data.items;
        if (!tempTracks[playlistId]) tempTracks[playlistId] = [];
        tempTracks[playlistId] = tempTracks[playlistId].concat(extracted);
        this.offsetTracks += 100;
        if (this.c === playlists.length - 1) done = true;
        this.setState({
          tracks: tempTracks,
          completed: done
        });
      } while (extracted.length === 100);
      this.offsetTracks = 0;
      resolve();
    });
  };

  extractTracks = async token => {
    const { playlists, tracks } = this.state;
    this.setState({
      extractingTracks: true
    });
    for (let playlist of playlists) {
      await this.extractChunk(token, playlist);
      this.c++;
    }
    this.setState({
      extractingTracks: false
    });
  };

  extractPlaylists = async token => {
    const { playlists } = this.state;
    let extracted = null;
    let tempPlaylists = playlists;
    do {
      this.offset += 50;
      let response = await getPlaylists(token, this.offset);
      extracted = response.data.items;
      tempPlaylists = tempPlaylists.concat(extracted);
      this.setState({
        playlists: tempPlaylists.slice(0, 3)
      });
    } while (false);
    this.setState({
      extractingPlaylists: false
    });
    this.extractTracks(token);
  };

  toCsv = () => {
    const { tracks } = this.state;
    const fields = ["track", "artist"];
    let temp = Object.keys(tracks).map(playlist => {
      return tracks[playlist].map(track => {
        return {
          track: track.track.name,
          artist: track.track.artists[0].name
        };
      });
    });
    let flattened = [].concat.apply([], temp);
    flattened = _.uniq(flattened, v => [v.track, v.artist].join());
    parseAsync(flattened, fields).then(csv => {
      this.setState({
        exported: true
      });
    });
  };

  download = () => {};

  render() {
    const {
      extractingPlaylists,
      extractingTracks,
      playlists,
      tracks,
      exported
    } = this.state;
    let acc = 0;
    Object.keys(tracks).forEach(playlist => (acc += tracks[playlist].length));
    return (
      <div className="center">
        <Button
          disabled={extractingPlaylists || extractingTracks}
          onClick={exported ? this.download : authorize}
          className="button"
        >
          <FontAwesomeIcon className="spotify-icon" icon={faSpotify} />
          {extractingPlaylists
            ? "Extracting playlists... (" + playlists.length + ")"
            : extractingTracks
            ? "Extracting tracks... (" + acc + ")"
            : exported
            ? "Download"
            : "Export"}
        </Button>
      </div>
    );
  }
}

export default Main;
