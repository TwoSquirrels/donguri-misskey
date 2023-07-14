// SPDX-License-Identifier: MIT

import { entities as misskeyEntities } from "misskey-js";
import { GAS } from "./common";

function chat(note: misskeyEntities.Note): string {
  return (note ? `${note.user.name} さん！` : "") + "ころころ〜";
}
