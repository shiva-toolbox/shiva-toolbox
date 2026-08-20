export function parseTwitchUsername(input: string) {
  const login = input
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?twitch\.tv\//i, "")
    .replace(/[?#].*$/, "")
    .replace(/\/.*$/, "")
    .replace(/^@/, "")
    .toLowerCase();

  return /^[a-z0-9_]{3,25}$/.test(login) ? login : null;
}

export function twitchStreamUrl(login: string) {
  return `https://www.twitch.tv/${login}`;
}
