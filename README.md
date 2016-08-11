# webseed
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
