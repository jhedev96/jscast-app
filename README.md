<div align="center"><img src="https://user-images.githubusercontent.com/36993404/103952144-2aa2c800-5140-11eb-9424-4c6d2a38bb42.png" width="150px"></div>

<br>

# Lum Screen Recorder
🎥💻 Screen recorder with some options like adding your webcam in a circle that you can move around. Build with Electron.

![example](https://user-images.githubusercontent.com/36993404/103951818-a3555480-513f-11eb-8258-ac418fd9b02f.gif)

<br>

## Table of contents
- [Features](#features)
- [Install and run](#install-and-run)
- [Recognitions and libraries used](#recognitions)

## Features
* 💻 Select from multiple desktops.
* 😃 Insert your webcam in a circle that you can move around.
* 🎤 Insert your audio microphone.
* 🔈 Insert your audio system.
* 🎨 Select the quality of the recording.
* 🕐 Countdown when starts the recording.
* 👉 Some useful shortcuts.

<br>

![image](https://user-images.githubusercontent.com/36993404/104153994-06671580-53e4-11eb-97ae-76ed4687fc17.png)

<br>

## Install and run 

### With Node
The app is made through Electron-forge, so you can install and run it with the following commands:

``` javascript
npm install

npm start
```

You can create a build (executable without npm).

Create a distributable:

``` javascript
npm run make
```

Electron-forge creates the `out` folder where your package will be located.

### Executable
If your OS is Windows you can download the executable from the [Release section](https://github.com/javdome/lum-recorder/releases) to install the application.

> During the installation, probably you will see a security alert.
> That is normal, since I have not paid any certifiation for the distribuion.
> So, press "More info" and continue with the installation.

<br>

## Recognitions
- [Paul Kinlan](https://paul.kinlan.me/) - For the code base and explanation of how to record screen and audio at the same time ([link](https://paul.kinlan.me/screen-recorderrecording-microphone-and-the-desktop-audio-at-the-same-time/)).
- garbageoverflow - Where I could see how to insert the webcam in a floating window ([repo](https://github.com/garbageoverflow/AlwaysOnTopCamCorder)).
- Yuri Sitnikov - For the library to add duration metadata to Webm files generated by Chrome ([repo](https://github.com/yusitnikov/fix-webm-duration)).
- Icons from [Phosphor Icons](https://phosphoricons.com/).