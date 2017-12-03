Gulp wathc and link package
add package.json:

     "scripts": {
	    "pkg-link": "gulp --gulpfile ./node_modules/pkg-link/gulpfile.js link --cwd",
	    "watch-pkg-link": "gulp ./node_modules/pkg-link/gulpfile.js link:watch --cwd"
    }
  Added root direcory you project config file .linkpkg:


    {
	"list": [
	      "../path-to-npm-module"
	  ]
	}