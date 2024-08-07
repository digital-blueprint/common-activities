import {globSync} from 'glob';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import serve from 'rollup-plugin-serve';
import del from 'rollup-plugin-delete';
import process from 'node:process';

const build = typeof process.env.BUILD !== 'undefined' ? process.env.BUILD : 'local';
console.log('build: ' + build);

export default (async () => {
    return {
        input: build != 'test' ? ['src/dbp-clipboard-management.js'] : globSync('test/**/*.js'),
        output: {
            dir: 'dist',
            entryFileNames: '[name].js',
            chunkFileNames: 'shared/[name].[hash].[format].js',
            format: 'esm',
            sourcemap: true,
        },
        preserveEntrySignatures: false,
        onwarn: function (warning, warn) {
            // ignore chai warnings
            if (warning.code === 'CIRCULAR_DEPENDENCY') {
                return;
            }
            warn(warning);
        },
        plugins: [
            del({
                targets: 'dist/*',
            }),
            resolve(),
            commonjs(),
            json(),
            build !== 'local' && build !== 'test' ? terser() : false,
            copy({
                targets: [
                    {src: 'assets/index.html', dest: 'dist'},
                    {src: 'assets/favicon.ico', dest: 'dist'},
                ],
            }),
            process.env.ROLLUP_WATCH === 'true'
                ? serve({contentBase: 'dist', host: '127.0.0.1', port: 8002})
                : false,
        ],
    };
})();
