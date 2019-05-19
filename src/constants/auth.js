const clientId = "e774f35cd91c4fe68ab31fb58bd03e53";
const authUrl = "https://accounts.spotify.com/authorize/?";
console.log(process.env)
const redirectUri =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://naxulanth.github.io/spotify-playlist-exporter";
const scopes = "playlist-read-private playlist-read-collaborative";

const queryParams = {
  client_id: clientId,
  response_type: "token",
  redirect_uri: redirectUri,
  scope: scopes
};

function serialize(obj) {
  return Object.keys(obj)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
    .join("&");
}

export default authUrl + serialize(queryParams);
