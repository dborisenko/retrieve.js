#!/bin/bash

test_bin=test-bin
test_out=test-reports
lib=lib

##############################
echo "Cleaning folders..."

rm -rf $test_bin
rm -rf $test_out
rm -rf $lib

##############################
echo "Compiling tests..."

mkdir $test_bin

tsc test/*.ts test/**/*.ts --out $test_bin/retrieve_test.js

##############################
echo "Testing..."

mkdir $test_out

# Browsers
browser_firefox="/Applications/Firefox.app/Contents/MacOS/firefox"
browser_chrome="/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"
browser_opera="/Applications/Opera.app/Contents/MacOS/Opera"
browser_safari="/Applications/Safari.app/Contents/MacOS/Safari"

java -Xms512m -Xmx1024m -jar bin/JsTestDriver-1.3.5.jar --port 4224 --browser $browser_firefox --tests all --testOutput $test_out

if [ $? -ne 0 ]
then
    echo "[ERROR]: Tests are failed"
    exit $?
fi

rm -rf $test_bin

##############################
echo "Compiling library..."

mkdir $lib

tsc src/*.ts src/**/*.ts --declaration --out lib/retrieve.js

