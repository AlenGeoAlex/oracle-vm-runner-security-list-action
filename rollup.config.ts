// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'

const config = [
  {
    input: 'src/index.ts',
    output: {
      esModule: true,
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true
    },
    // @ts-ignore
    plugins: [
      // @ts-ignore
      typescript(),
      // @ts-ignore
      nodeResolve({ preferBuiltins: true }),
      // @ts-ignore
      commonjs(),
      // @ts-ignore
      terser()
    ]
  },
  {
    input: 'src/index-cleanup.ts',
    output: {
      esModule: true,
      file: 'dist/index-cleanup.js',
      format: 'es',
      sourcemap: true
    },
    // @ts-ignore
    plugins: [
      // @ts-ignore
      typescript(),
      // @ts-ignore
      nodeResolve({ preferBuiltins: true }),
      // @ts-ignore
      commonjs(),
      // @ts-ignore
      terser()
    ]
  }
]

export default config
