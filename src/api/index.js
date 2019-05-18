import axios from "axios";
import { BASE_URL } from "constants/endpoints";

export function getPlaylists(header, offset) {
  return axios.request({
    method: "get",
    url: BASE_URL + "me/playlists",
    headers: {
      Authorization: "Bearer " + header
    },
    params: {
      limit: 50,
      offset: offset
    }
  });
}

export function getTracks(header, playlist) {
  return axios.request({
    method: "get",
    url: BASE_URL + "v1/playlists/" + playlist + "/tracks",
    headers: {
      Authorization: "Bearer " + header
    },
    params: {}
  });
}
