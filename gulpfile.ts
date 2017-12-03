"use strict"
import * as gulp from 'gulp';
import * as fs from 'fs';
import * as parsePath from 'parse-filepath';
import * as npm from 'npm';
import * as child_process from 'child_process';
import * as watch from 'gulp-watch';

let listPackage: LinkPackage[] = [];

gulp.task('build:prod', () => {
    console.log('Gulp is running!', process.cwd());
});

gulp.task('load:config', (callback: any) => {
    let config: string[] = JSON.parse(fs.readFileSync('./.linkpkg')).list;
    console.log(listPackage);
    config.forEach((e :string) => {
        listPackage.push(linkPackageFactory(e));
    });
    callback();
});

gulp.task('link:check', ['link:install', 'link:simlink']);

gulp.task('link:install', (callback) => {
    listPackage.forEach((item: LinkPackage) => {
        if (!checkLink(item)) {
            installDepedencyPackage(item);
        }
    });
    callback();
});

gulp.task('link:simlink', (callback) => {
    listPackage.forEach((item: LinkPackage) => {
        if (!checkLink(item)) {
            linkPackage(item);
        }
    });
    callback();
});

gulp.task('link:build', (callback) => {
    listPackage.forEach((item: LinkPackage) => {
        if (!checkLink(item)) {
            buildPackage(item);
        }
    });
    callback();
});

function watchLinkPack () {
    let listPaths: string[] = [];
    listPackage.forEach((item) => {
        listPaths.push(item.basePath + '/src/**/*.*');
    });
    // listPaths.push('node_modules/**/*.*');
    console.log('link:watcher:pkg',listPaths);
    //watch(listPaths, ['link:build','link:simlink']);
    gulp.watch(listPaths, ['link:build','link:simlink']);
};
function watchLinkNodeModules () {
    let listPaths: string[] = [];
    listPackage.forEach((item) => {
        listPaths.push(item.basePath + '/src/**/*.*');
    });
    // listPaths.push('node_modules/**/*.*');
    console.log('watchLinkNodeModules',listPaths);
    //watch(listPaths, ['link:build','link:simlink']);
    gulp.watch('node_modules/**/*.*', ['link']);
};

gulp.task('link:watcher:pkg', watchLinkPack);
gulp.task('link:watcher:modules', watchLinkNodeModules);



gulp.task('link:watcher',['link:watcher:pkg','link:watcher:modules']);
gulp.task('link',['load:config', 'link:check']);
gulp.task('link:watch',['link', 'link:watcher']);

function checkLink(pack: LinkPackage): boolean {
    if(fs.existsSync('node_modules/' + pack.path)) {
        return true;
    }
    return false;
}

function linkPackageFactory(package_path :string): LinkPackage {
    let path = parsePath(package_path + "/package.json");
    let pack = new LinkPackage();
    pack.path = path.path;
    pack.basePath = path.dir;
    pack.config = JSON.parse(fs.readFileSync(pack.path));
    return pack;
}

function installDepedencyPackage(item: LinkPackage) {
    npm.load(item.config, function (er) {
        if (er) {
            console.log('NPM Error:',er);
            return;
        }
        console.log('install dependecies', item.config.devDependencies);

        let packageNames: string[] = Object.keys(item.config.devDependencies);

            packageNames.forEach( (item) => {
                if(!fs.existsSync('node_modules/' + item + '/package.json')) {

                npm.commands.install([item], function (er, data) {
                   if (er) {
                       console.log('NPM Error:',er);
                       return;
                   }
                        console.log('NPM installed dependency', item);
                   // command succeeded, and data might have some info
                })
            }
        });
        // npm.registry.log.on('log', function (message) { ... })
    })
}

function linkPackage(item: LinkPackage) {
    buildPackage(item);
    let path = 'node_modules/' + item.config.name;
    if (fs.existsSync(path)) {
        fs.unlinkSync(path);
    }
    fs.symlinkSync( '../' + item.basePath + '/dist/', path);
}

function buildPackage(item: LinkPackage) {
    console.log('NPM run build', item.config.name);
    child_process.execSync("npm run build --prefix " + item.basePath);
}

class LinkPackage {
    path: string;
    basePath: string;
    config: {
        name: string,
        description?: string,
        version?: string,
        main?: string,
        scripts: {[key: string]: string},
        repository?: {
            type: string,
            url: string
        },
        devDependencies?: {[key: string]: string},
        peerDependencies?: {[key: string]: string},
        dependencies?: {[key: string]: string}
    }
}