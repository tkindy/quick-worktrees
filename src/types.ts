export interface CopyPathEntry {
  path: string;
  mode?: "copy" | "exclude" | "clear-first";
  children?: CopyPathEntry[];
}

export interface WtConfig {
  scripts?: {
    setup?: string;
  };
  copyPaths?: (string | CopyPathEntry)[];
}
