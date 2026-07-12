# Basma App
This app developed in
* Ionic 6
* Angular 14
* Run `npm i` to install node modules
* Run `ionic serve` to run in browser
# Need installed below items
* Node JS version 14.17.5
* Ionic CLI 6
* ANgular CLI 14 

# Generate Android apk commands
```
ionic build
```
```
npx cap sync android
```
```
npx cap open android
```
# Generate Android apk commands
* Generate key command
```
keytool -genkey -v -keystore BasmaKeyStore.keystore -alias BasmaKeyStore -keyalg RSA -keysize 2048 -validity 20000
```
# This is the real key store. you can find it in project root name BasmaKeyStore.keystore file.
``

``

### If you encounter error while building Android error:Could not find com.commit451:PhotoView:1.2.4.
replace ../node_modules/com-sarriaroman-photoviewer/src/android/photoviewer.gradle to the below line

``
 implementation 'com.github.chrisbanes.photoview:library:1.2.4'
``