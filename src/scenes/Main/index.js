import React, { Component } from "react";
import { Row, Col, Button } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { getPlaylists } from "api";
import { parse, authorize } from "utils";
import "./style.css";

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      extracting: false
    };
    this.playlists = [];
    this.offset = 0;
  }

  componentDidMount() {
    let accessToken = parse();
    if (accessToken) {
      this.setState({
        extracting: true
      });
      this.extract(accessToken);
    }
  }

  extract = async token => {
    let response = await getPlaylists(token, this.offset);
    let extracted = response.data.items;
    this.playlists = this.playlists.concat(extracted);
    console.log(this.playlists);
    if (extracted.length === 50) {
      this.offset += 50;
      this.extract(token);
    } else {
      this.setState({
        extracting: false
      });
    }
  };

  render() {
    const { extracting } = this.state;
    return (
      <div className="center">
        <Button disabled={extracting} onClick={authorize} className="button">
          <FontAwesomeIcon className="spotify-icon" icon={faSpotify} />
          {extracting ? "Loading..." : "Export"}
        </Button>
      </div>
    );
  }
}

export default Main;
