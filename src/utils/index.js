import auth from "constants/auth";

export function parse() {
  let search = window.location.hash && window.location.hash.substring(1);
  let parsed = null;
  if (search.length > 0) {
    parsed = JSON.parse(
      '{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
      function(key, value) {
        return key === "" ? value : decodeURIComponent(value);
      }
    );
  }
  return parsed && parsed.access_token;
}

export function authorize() {
  window.location.href = auth;
}
