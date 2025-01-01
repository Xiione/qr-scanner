import alias from "@rollup/plugin-alias";
import sourcemaps from "rollup-plugin-sourcemaps";
// ts config is a combination of tsconfig.json and overrides here. Type declarations file is generated separately via
// tsc (see build script in package.json), because rollup can not emit multiple files if using output.file option.
import typescript from "@rollup/plugin-typescript";

// note: i removed this because it doesn't play nice with wasm, plus we want to
// use jsQR always
// not using rollup's output.banner/output.intro/output.footer/output.outro as we also have to modify the generated code
// function workerScriptToDynamicImport() {
//     return {
//         name: 'worker-script-to-dynamic-import',
//         generateBundle(options, bundle) {
//             for (const chunkName of Object.keys(bundle)) {
//                 const chunk = bundle[chunkName];
//                 if (chunk.type !== 'chunk') {
//                     continue;
//                 }
//                 // chunk.code = 'export const createWorker=()=>new Worker(URL.createObjectURL(new Blob([`'
//                 //     + chunk.code.replace(/`/g, '\\`').replace(/\${/g, '\\${')
//                 //     + '`]),{type:"application/javascript"}), {type: "module"})';
//                 chunk.code = 'export const createWorker=()=>new Worker(URL.createObjectURL(new Blob(['
//                 + JSON.stringify(chunk.code)
//                 + '],{type:"application/javascript"})), {type: "module"})';
//             }
//         },
//     };
// }

const jsqr_ext = [
  "jsqr-es6",
  "jsqr-es6/BitMatrix",
  "jsqr-es6/locator",
  "jsqr-es6/decoder",
  "jsqr-es6/decoder/version",
  "jsqr-es6/decoder/decodeData",
  "jsqr-es6/decoder/decodeData/BitStream",
  "jsqr-es6/decoder/reedsolomon",
];

export default () => [
  // worker; built first to be available for inlining in the legacy build
  {
    external: [...jsqr_ext],
    input: "src/worker.ts",
    output: {
      file: "qr-scanner-worker.js",
      format: "esm",
      interop: "auto",
      sourcemap: true,
    },
    plugins: [
      typescript(),
      sourcemaps(),
      // closureCompiler({
      //     compilation_level: 'ADVANCED',
      //     warning_level: 'QUIET',
      //     language_in: 'ECMASCRIPT6',
      //     language_out: 'ECMASCRIPT6',
      //     rewrite_polyfills: false,
      // }),
    ],
  },
  ...[
    // standard build specific settings
    {
      // Note that this results in the dynamic import of the worker to also be a dynamic import in the umd build.
      // However, umd builds do not support multiple chunks, so that's probably the best we can do, as js dynamic
      // imports are now widely supported anyways.
      external: ["./qr-scanner-worker.js", ...jsqr_ext],
      output: [
        {
          file: "qr-scanner.js",
          format: "esm",
        },
        // },
      ],
      language_out: "ECMASCRIPT_2017",
    },
    // legacy build specific settings
    {
      external: ["./qr-scanner-worker.js", ...jsqr_ext],
      aliases: {
        "./qr-scanner-worker.js": "../qr-scanner-worker.js",
      },
      output: [
        {
          file: "qr-scanner.legacy.js",
          format: "umd",
          name: "QrScanner",
          // inline the worker as older browsers that already supported es6 did not support dynamic imports yet
          inlineDynamicImports: true,
        },
      ],
      language_out: "ECMASCRIPT6",
    },
  ].map((specificSettings) => ({
    input: "src/qr-scanner.ts",
    external: specificSettings.external,
    output: specificSettings.output.map((output) => ({
      interop: "auto",
      sourcemap: true,
      ...output,
    })),
    plugins: [
      alias({
        entries: specificSettings.aliases,
      }),
      typescript(),
      // closureCompiler({
      //     language_in: 'ECMASCRIPT_2017',
      //     language_out: specificSettings.language_out,
      //     rewrite_polyfills: false,
      // })
    ],
  })),
];
