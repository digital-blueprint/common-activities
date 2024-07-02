import {globSync} from 'glob';
import path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import serve from 'rollup-plugin-serve';
import url from '@rollup/plugin-url';
import del from 'rollup-plugin-delete';
// import {getPackagePath, getDistPath} from '../../rollup.utils.js';

const build = typeof process.env.BUILD !== 'undefined' ? process.env.BUILD : 'local';
console.log('build: ' + build);

export default (async () => {
    return {
        input:
            build != 'test'
                ? ['src/dbp-group-manage.js', 'src/dbp-group-manage-demo.js']
                : globSync('test/**/*.js'),
        output: {
            dir: 'dist',
            entryFileNames: '[name].js',
            chunkFileNames: 'shared/[name].[hash].[format].js',
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            del({
                targets: 'dist/*',
            }),
            resolve({browser: true}),
            commonjs(),
            url({
                limit: 0,
                include: [await getPackagePath('select2', '**/*.css')],
                emitFiles: true,
                fileName: 'shared/[name].[hash][extname]',
            }),
            json(),
            build !== 'local' && build !== 'test' ? terser() : false,
            copy({
                targets: [
                    {src: 'assets/silent-check-sso.html', dest: 'dist'},
                    {src: 'assets/index.html', dest: 'dist'},
                    // {
                    //     src: await getPackagePath('@dbp-toolkit/common', 'assets/icons/*.svg'),
                    //     dest: 'dist/' + (await getDistPath('@dbp-toolkit/common', 'icons')),
                    // },
                ],
            }),
            process.env.ROLLUP_WATCH === 'true'
                ? serve({contentBase: 'dist', host: '127.0.0.1', port: 8002})
                : false,
        ],
    };
})();

async function getPackagePath(packageName, assetPath) {
    let packageRoot;
    let current = require.resolve('./package.json');
    if (require(current).name === packageName) {
        // current package
        packageRoot = path.dirname(current);
    } else {
        // Other packages from nodes_modules etc.
        packageRoot = path.dirname(require.resolve(packageName + '/package.json'));
    }
    return path.relative(process.cwd(), path.join(packageRoot, assetPath));
}
