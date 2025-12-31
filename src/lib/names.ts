const WORDS = [
  "alpine", "anchor", "aurora", "beacon", "blaze",
  "breeze", "brook", "canyon", "cedar", "cliff",
  "cloud", "coral", "cove", "crane", "creek",
  "crest", "crystal", "dagger", "dawn", "delta",
  "dune", "eagle", "ember", "falcon", "fern",
  "fjord", "flame", "flint", "forest", "frost",
  "glacier", "grove", "harbor", "hawk", "haven",
  "heron", "horizon", "ivy", "jade", "jasper",
  "juniper", "lagoon", "lark", "laurel", "lotus",
  "maple", "marble", "meadow", "mesa", "mist",
  "moon", "moss", "nectar", "oak", "oasis",
  "obsidian", "onyx", "orchid", "otter", "palm",
  "peak", "pearl", "pebble", "pine", "pond",
  "quartz", "raven", "reef", "ridge", "river",
  "robin", "sage", "sequoia", "shade", "shore",
  "silver", "slate", "snow", "sparrow", "spruce",
  "star", "stone", "storm", "summit", "swift",
  "thistle", "thunder", "tiger", "trail", "tulip",
  "valley", "violet", "wave", "willow", "wind",
  "wolf", "wren", "yarrow", "zenith", "zephyr"
];

export function generateRandomWord(): string {
  const index = Math.floor(Math.random() * WORDS.length);
  return WORDS[index];
}
