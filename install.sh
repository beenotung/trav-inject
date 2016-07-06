#!/usr/bin/env bash
# Name
#   install.sh
#
# Usage
#   ./install.sh [Option]
#
# Help
#   ./install.sh --help
#
# Convention
#   the packages are concat line by line for better source control (e.g. git)

if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  echo "Name : install.sh";
  echo "";
  echo "Usage : ./install.sh [Option]";
  echo "";
  echo "Default : install npm local packages";
  echo "";
  echo "Options";
  echo "  -h | --help           show this help message";
  echo "  -f | --full-install   install npm global and local packages";
  exit 0;
fi;

if [ ! -f package.json ]; then
  echo "Warning : there is no package.json";
  echo "  you might use 'npm init' to create it";
  echo -n "continue? (y/n): ";
  read line;
  if [ "$line" != "y" ]; then
    # do not continue
    exit 1;
  fi;
fi;

function hasCommand {
  if hash $1 2>/dev/null; then
    echo "1"
  else
    echo "0"
  fi
}

function checkCommand {
  res=$(hasCommand "$1");
  if [ "$res" == "0" ]; then
    echo "Error : missing $1";
    echo "  Please install $1 and add the path";
    exit 1;
  fi
};

if [ "$1" == "-f" ] || [ "$1" == "--full-install" ]; then
  checkCommand "npm";
  checkCommand "git";
  echo "installing npm global packages...";
  cmd="";
  res=$(hasCommand sudo)
  if [ "$res" == 1 ]; then
    cmd="sudo npm";
  else
    cmd="npm";
  fi
  cmd="$cmd install -g";
  # concat a list of npm global packages
  cmd="$cmd gulp";
  cmd="$cmd bower";
#  cmd="$cmd http-server";
  # install the npm global packages
  echo "$cmd"; # to let use know why need sudo (if need to enter password)
  echo "$cmd" | sh;
  echo "finish, installed npm global packages";
fi

echo "installing npm local packages...";
cmd="npm install --save-dev";
# concat a list of npm local packages
cmd="$cmd gulp";
cmd="$cmd gulp-clean";
cmd="$cmd gulp-filesize";
cmd="$cmd gulp-sourcemaps";
cmd="$cmd gulp-babel";
cmd="$cmd babel";
cmd="$cmd babel-preset-es2015";
#cmd="$cmd babel-plugin-transform-runtime";
#cmd="$cmd babel-plugin-transform-es2015-modules-amd";
#cmd="$cmd babel-plugin-transform-es2015-modules-umd";
cmd="$cmd gulp-concat";
cmd="$cmd merge2";
cmd="$cmd gulp-typescript";
#cmd="$cmd bower";
cmd="$cmd http-server";
echo "$cmd";
echo "$cmd" | sh;
echo "finish, installed npm local packages";

echo "installing bower packages...";
cmd="bower install --save"
# concat a list of bower packages
cmd="$cmd babel-polyfill";
echo "$cmd";
echo "$cmd" | sh;
echo "finish, installed bower packages...";

echo "All finished.";
