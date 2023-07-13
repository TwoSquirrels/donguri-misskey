// SPDX-License-Identifier: MIT

function chat(note: MisskeyNote): string {
  return (note ? `${note.user.name} さん！` : "") + "ころころ〜";
}
