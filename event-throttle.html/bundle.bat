echo off
echo 'Starting Typescript transpile'
call tsc -p .
echo 'Finished Typescript transpile'

echo 'Starting browserify (bundle.js)'
call browserify -e ./build/index.js -o ./bundle.js
echo 'Finished browserify (bundle.js)'