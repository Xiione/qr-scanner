import { type Chunks } from "jsqr-es6/decoder/decodeData";
import { type StreamInfo } from "jsqr-es6/decoder/decodeData/BitStream";
import { type Point } from "jsqr-es6/locator";

export interface WorkerResult {
  id: number;
  type: string;
  data: string | null;
  cornerPoints?: Point[];
  version?: number;
  matrixData?: Uint8ClampedArray;
  matrixWidth?: number;
  matrixDataCorrected?: Uint8ClampedArray;
  ecLevel?: number;
  dataMask?: number;
  chunks?: Chunks;
  streamMappings?: Map<number, StreamInfo>;
}
