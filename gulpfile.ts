/**
 * @file gulpfile 编译文件
 * @author Yu Zong(liuxuanzy@qq.com)
 */

import path from 'path';
import del from 'del';
import glob from 'glob';
import gulp from 'gulp';
import babel from 'gulp-babel';
import ts from 'gulp-typescript';
import isPathCwd from 'is-path-cwd';
import isPathInCwd from 'is-path-in-cwd';
import merge from 'merge2';
import minimist from 'minimist';
import config from './tsconfig.json';

function resolve(p: string) {
    return path.resolve(process.cwd(), p);
}

const params = minimist(process.argv.slice(2));

const files = [
    'packages/*/*/src/**/*.ts',
    'packages/*/*/src/**/*.tsx',
    '!packages/**/__tests__/**'
];

gulp.task('build-ts', () => {

    const realConfig = Object.assign({}, config.compilerOptions, {
        module: 'esnext',
        target: 'es2018',
        rootDir: resolve('.'),
        outDir: resolve('dist/ts'),
        declarationDir: resolve('dist/ts')
    });

    const result = gulp.src(files).pipe(ts(realConfig));

    return merge([
        result.js.pipe(gulp.dest('dist/ts')),
        result.dts.pipe(gulp.dest('dist/js')).pipe(gulp.dest('dist/es'))
    ]);
});

gulp.task('build-ts-dev', () => {

    const realConfig = Object.assign({}, config.compilerOptions, {
        module: 'esnext',
        target: 'es5',
        rootDir: resolve('.'),
        outDir: resolve('dist/ts'),
        declarationDir: resolve('dist/ts')
    });

    const result = gulp.src(files).pipe(ts(realConfig));

    return merge([
        result.js.pipe(gulp.dest('dist/es')).pipe(gulp.dest('dist/js')),
        result.dts.pipe(gulp.dest('dist/js')).pipe(gulp.dest('dist/es'))
    ]);
});

gulp.task('build-js', () => {

    // JSX只翻译成React就行了，Vue Hooks不需要写任何模板文件
    let stream = gulp
        .src('dist/ts/**')
        .pipe(babel({
            presets: [
                [
                    '@babel/preset-env',
                    {
                        modules: 'commonjs',
                        targets: {
                            browsers: [
                                '> 1%',
                                'last 2 versions',
                                'not ie <= 8'
                            ]
                        }
                    }
                ],
                '@babel/preset-react'
            ],
            plugins: [
                [
                    '@babel/plugin-proposal-class-properties',
                    {
                        loose: false
                    }
                ]
            ]
        }));

    return stream.pipe(gulp.dest('dist/js'));
});

gulp.task('build-es', () => {

    let stream = gulp
        .src('dist/ts/**')
        .pipe(babel({
            presets: [
                [
                    '@babel/preset-env',
                    {
                        modules: false,
                        targets: {
                            browsers: [
                                '> 1%',
                                'last 2 versions',
                                'not ie <= 8'
                            ]
                        }
                    }
                ],
                '@babel/preset-react'
            ],
            plugins: [
                [
                    '@babel/plugin-proposal-class-properties',
                    {
                        loose: false
                    }
                ]
            ]
        }));

    return stream.pipe(gulp.dest('dist/es'));
});

gulp.task('del-dist', () => {
    return del(['dist']);
});

function createCopyTask(type: string, name: string) {

    const dev: boolean = !!params.dev;
    const target: string | void = params.target;
    let p: string;

    if (dev) {

        if (typeof target !== 'string' || target === '') {
            throw new Error('dev mode need target option');
        }

        p = resolve(target);

        if (isPathCwd(p) || isPathInCwd(p)) {
            throw new Error('dev mode need target not in current work dir');
        }
    } else {
        p = resolve('packages');
    }

    gulp.task('tsc-' + type + '-' + name, () => {

        const fromPath = type + '/' + name;
        const toPath = (dev ? '@' : '') + fromPath;

        const js = gulp
            .src(['dist/js/' + fromPath + '/src/**'])
            .pipe(gulp.dest(p + '/' + toPath + '/lib'));

        const es = gulp
            .src(['dist/es/' + fromPath + '/src/**'])
            .pipe(gulp.dest(p + '/' + toPath + '/es'));

        if (!dev) {
            return merge([js, es]);
        }

        const other = gulp
            .src(['packages/' + fromPath + '/package.json'])
            .pipe(gulp.dest(p + '/' + toPath));

        return merge([js, es, other]);
    });

    return 'tsc-' + type + '-' + name;
}

const tasks = glob.sync('packages/*/*').map(name => {

    const keys = name.split('/');

    const type = keys[keys.length - 2];

    if (type === params.ignore) {
        return '';
    }

    return createCopyTask(type, keys[keys.length - 1]);
}).filter(item => item);

if (params.dev) {
    gulp.task('default', gulp.series(
        'del-dist',
        'build-ts-dev',
        ...tasks,
        'del-dist'
    ));

} else {
    gulp.task('default', gulp.series(
        'del-dist',
        'build-ts',
        'build-es',
        'build-js',
        ...tasks,
        'del-dist'
    ));
}

gulp.task('watch-ts', () => {
    gulp.watch(files, gulp.series('default'));
});

gulp.task('watch', gulp.series('default', 'watch-ts'));
