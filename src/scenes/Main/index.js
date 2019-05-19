import React, { Component } from "react";
import { Row, Col, Button } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
      playlists: []
    };
    this.offset = 0;
    this.offsetTracks = 0;
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

  extractChunk = (token, playlist) => {
    const { tracks } = this.state;
    let tempTracks = Object.assign({}, tracks);
    return new Promise(async (resolve, reject) => {
      let extracted = null;
      do {
        let playlistId = playlist.id;
        let response = await getTracks(token, playlistId, this.offsetTracks);
        extracted = response.data.items;
        if (!tempTracks[playlistId]) tempTracks[playlistId] = [];
        tempTracks[playlistId] = tempTracks[playlistId].concat(extracted);
        this.offsetTracks += 100;
        console.log(tempTracks);
        this.setState({
          tracks: tempTracks
        });
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
    }
    this.setState({
      extractingTracks: false
    });
  };

  extractPlaylists = async token => {
    const { playlists } = this.state;
    let extracted = null;
    let tempPlaylists = playlists.slice();
    do {
      this.offset += 50;
      let response = await getPlaylists(token, this.offset);
      extracted = response.data.items;
      tempPlaylists = tempPlaylists.concat(extracted);
      console.log(tempPlaylists);
      this.setState({
        playlists: tempPlaylists
      });
    } while (extracted.length === 50);
    this.setState({
      extractingPlaylists: false
    });
    this.extractTracks(token);
  };

  render() {
    const {
      extractingPlaylists,
      extractingTracks,
      playlists,
      tracks
    } = this.state;
    let acc = 0;
    Object.keys(tracks).forEach(playlist => (acc += tracks[playlist].length));
    return (
      <div className="center">
        <Button
          disabled={extractingPlaylists || extractingTracks}
          onClick={authorize}
          className="button"
        >
          <FontAwesomeIcon className="spotify-icon" icon={faSpotify} />
          {extractingPlaylists
            ? "Extracting playlists... (" + playlists.length + ")"
            : extractingTracks
            ? "Extracting tracks... (" + acc + ")"
            : "Export"}
        </Button>
      </div>
    );
  }
}

export default Main;
