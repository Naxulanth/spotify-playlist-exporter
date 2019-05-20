import React, { Component } from "react";
import { Row, Col, Button } from "reactstrap";
import FileSaver from "file-saver";
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
        try {
          let response = await getTracks(token, playlistId, this.offsetTracks);
          extracted = response.data.items;
          if (!tempTracks[playlistId]) tempTracks[playlistId] = [];
          tempTracks[playlistId] = tempTracks[playlistId].concat(extracted);
          this.offsetTracks += 100;
          if (this.c === playlists.length - 1 && extracted.length !== 100)
            done = true;
          this.setState({
            tracks: tempTracks,
            completed: done
          });
        } catch (e) {
          console.error(e);
        }
      } while (extracted.length === 100);
      this.offsetTracks = 0;
      resolve();
    });
  };

  extractTracks = async token => {
    const { playlists } = this.state;
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
      try {
        let response = await getPlaylists(token, this.offset);
        extracted = response.data.items;
        tempPlaylists = tempPlaylists.concat(extracted);
        this.offset += 50;
        this.setState({
          playlists: tempPlaylists
        });
      } catch (e) {
        console.error(e);
      }
    } while (extracted.length === 50);
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
          track: track.track && track.track.name,
          artist:
            track.track &&
            track.track.artists &&
            track.track.artists[0] &&
            track.track.artists[0].name
        };
      });
    });
    let flattened = [].concat.apply([], temp);
    flattened = _.uniqBy(flattened, v => [v.track, v.artist].join());
    parseAsync(flattened, fields).then(csv => {
      this.setState({
        exported: true,
        csv: csv,
        flattenedTracks: flattened
      });
    });
  };

  download = () => {
    const { csv } = this.state;
    let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    FileSaver.saveAs(blob, "spotify_export.csv");
  };

  render() {
    const {
      extractingPlaylists,
      extractingTracks,
      playlists,
      tracks,
      exported,
      flattenedTracks
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
        <div style={{ marginTop: "10px" }}>
          {exported ? flattenedTracks.length + " tracks exported!" : null}
        </div>
      </div>
    );
  }
}

export default Main;
