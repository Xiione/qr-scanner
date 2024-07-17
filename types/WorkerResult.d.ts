import { Point } from "jsqr-es6/dist/locator";
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
}
