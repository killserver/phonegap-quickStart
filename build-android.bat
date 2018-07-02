@echo off
cd ./project && cordova platform add android && phonegap build android --release && if exist "platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk" (copy /Y "platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk" "../andoid.apk") else echo "something wrong"
pause