declare module '@undecaf/zbar-wasm' {
  export function scanImageData(imageData: ImageData): Promise<any[]>;
  export function setModuleArgs(args: {
    locateFile?: (filename: string, directory: string) => string;
  }): void;
}
