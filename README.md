# travian-inject
seed project for web (typescript + babel + sass)

## env dep (os package)
 - git
 - npm

## script
 - install.sh
    - default
        install npm local packages
    - --full-install
        install npm global packages and local packages

## build flow
 - compile script
    1. compile typescript to ES6
    2. compile ES6 js to ES5
 - compile stylesheet
    1. compile scss to css
 - update html
    1. update library path (update relative path from root to dist)

## watch flow
1. watch the build targets (html; scss, css; ts, js) separately
2. fire up compile task separately
3. trigger reload after compile complete

## usage
copy the dist/bundle.js into console on travian page
