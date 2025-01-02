import jsQR from "jsqr-es6";
import type { WorkerResult } from "./WorkerResult";

type GreyScaleWeights = {
  red: number;
  green: number;
  blue: number;
  useIntegerApproximation: boolean;
};

let inversionAttempts: "dontInvert" | "onlyInvert" | "attemptBoth" =
  "attemptBoth";
let greyScaleWeights: GreyScaleWeights = {
  // weights for quick luma integer approximation (https://en.wikipedia.org/wiki/YUV#Full_swing_for_BT.601)
  red: 77,
  green: 150,
  blue: 29,
  useIntegerApproximation: true,
};

self.onmessage = async (event) => {
  const id = event["data"]["id"];
  const type = event["data"]["type"];
  const data = event["data"]["data"];

  switch (type) {
    case "decode":
      decode(data, id);
      break;
    case "grayscaleWeights":
      setGrayscaleWeights(data);
      break;
    case "inversionMode":
      setInversionMode(data);
      break;
    case "close":
      // close after earlier messages in the event loop finished processing
      self.close();
      break;
  }
};

function decode(
  data: { data: Uint8ClampedArray; width: number; height: number },
  requestId: number,
): void {
  const rgbaData = data["data"];
  const width = data["width"];
  const height = data["height"];
  const result = jsQR(rgbaData, width, height, {
    inversionAttempts: inversionAttempts,
    greyScaleWeights: greyScaleWeights,
  });
  if (!result) {
    (self as unknown as Worker).postMessage({
      id: requestId,
      type: "qrResult",
      data: null,
    } as WorkerResult);
    return;
  }

  (self as unknown as Worker).postMessage(
    {
      id: requestId,
      type: "qrResult",
      data: result.data,
      // equivalent to cornerPoints of native BarcodeDetector
      cornerPoints: [
        result.location.topLeftCorner,
        result.location.topRightCorner,
        result.location.bottomRightCorner,
        result.location.bottomLeftCorner,
      ],
      version: result.version,
      matrixData: result.matrix.data,
      matrixWidth: result.matrix.width,
      matrixDataCorrected: result.matrixCorrected.data,
      ecLevel: result.ecLevel,
      dataMask: result.dataMask,
      chunks: result.chunks,
      streamMappings: result.streamMappings,
    } as WorkerResult,
    [result.matrix.data.buffer, result.matrixCorrected.data.buffer],
  );
}

function setGrayscaleWeights(data: GreyScaleWeights) {
  // update grayscaleWeights in a closure compiler compatible fashion
  greyScaleWeights.red = data["red"];
  greyScaleWeights.green = data["green"];
  greyScaleWeights.blue = data["blue"];
  greyScaleWeights.useIntegerApproximation = data["useIntegerApproximation"];
}

function setInversionMode(inversionMode: "original" | "invert" | "both") {
  switch (inversionMode) {
    case "original":
      inversionAttempts = "dontInvert";
      break;
    case "invert":
      inversionAttempts = "onlyInvert";
      break;
    case "both":
      inversionAttempts = "attemptBoth";
      break;
    default:
      throw new Error("Invalid inversion mode");
  }
}
