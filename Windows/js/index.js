/*
    By samuel A. Matheson
    samuelmatheson20@gmail.com
*/

//dependancys, dont add howler
const { ipcRenderer, remote, clipboard } = require('electron');
const main = remote.require('./main');//access export functions in main
const { dialog, Menu, MenuItem, nativeTheme, shell } = remote;
const fs = require('fs');
const path = require('path');
const wallpaper = require('wallpaper');
const mm = require('music-metadata');
//const {Howl, Howler} = require('howler');

const my_website = 'https://anthonym01.github.io/Portfolio/?contact=me';//my website
const playbtn = document.getElementById('playbtn');
const nextbtn = document.getElementById('nextbtn');
const main_library_view = document.getElementById('main_library_view');
const song_progress_bar = document.getElementById('song_progress_bar');
const backgroundmaskimg = document.getElementById('backgroundmaskimg');
const backgroundvideo = document.getElementById('backgroundvideo');
const mainmaskcontainer = document.getElementById('mainmaskcontainer');

//  Taskbar buttons for frameless window
document.getElementById('x-button').addEventListener('click', function () {
    navigator.mediaSession.playbackState = "paused";
    main.x_button();
})
document.getElementById('maximize-button').addEventListener('click', function () { main.maximize_btn() })
document.getElementById('minimize-button').addEventListener('click', function () { main.minimize_btn() })

window.addEventListener('load', async function () {
    main_menus();
    console.log('Running from:', process.resourcesPath)
    console.log('System preference Dark mode: ', nativeTheme.shouldUseDarkColors)//Check if system is set to dark or light

    if (localStorage.getItem("Anthonymcfg")) { await config_manage.load() }
    UI.initalize()
    player.initalize()
    maininitalizer()
    UI.get_desktop_wallpaper().then((wallpaperpath) => { mainmaskcontainer.style.backgroundImage = `url('${wallpaperpath}')` })
    setTimeout(() => {

        //last palyed song
        window.location.href = `#${config.last_played - 2}`;
        player.play(config.last_played, false);
        player.pause();
    }, 500);
})

window.addEventListener('keydown', function (e) {//keyboard actions
    switch (e.key) {
        case " ": case "p": case "enter": e.preventDefault(); player.play(); break;
        case "n": e.preventDefault(); player.next(); break;
        case "b": e.preventDefault(); player.previous(); break;
        case "m": e.preventDefault(); player.mute(); break;
        case "ArrowRight": e.preventDefault(); player.seekforward(); break;
        case "ArrowLeft": e.preventDefault(); player.seekbackward(); break;
        default: console.log(e.key)
    }
})

async function main_menus() {

    //Main body menu
    const menu_body = new Menu.buildFromTemplate([
        { role: 'reload' },
        { label: 'Refresh Library', click() { maininitalizer() } },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'resetZoom' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Contact developer', click() { shell.openExternal(my_website) } },
        { role: 'toggledevtools' },
    ]);
    Menu.setApplicationMenu(menu_body);
    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        menu_body.popup({ window: remote.getCurrentWindow() })
    }, false);

    //text box menu
    const text_box_menu = new Menu.buildFromTemplate([
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { role: 'seperator' },
        { role: 'undo' },
        { role: 'redo' },
    ]);
    //textbox.addEventListener('contextmenu', (event) => popupmenu, false)
    function popupmenu(event) {//Popup the menu in this window
        event.preventDefault()
        event.stopPropagation()
        text_box_menu.popup({ window: require('electron').remote.getCurrentWindow() })
    }
}

async function maininitalizer() {//Used to start re-startable app functions
    console.log('main initalizer')
    //reset players state to default
    player.pause();
    player.stop_seeking();
    player.files = [];//path and other details of song files
    player.playlists = [];//playlist files and details
    player.queue = [];//Play queue randomized from playlist/library
    player.playstate = false;//is (should be) playing music
    player.fetch_library();
}

let config = {

    key: "Anthonymcfg",
    background_blur: 4,//pixels
    last_played: 0,
}

let config_manage = {
    save: async function () {//Save the config file
        console.table('Configuration is being saved', config);
        var stringeddata = JSON.stringify(config);
        localStorage.setItem("Anthonymcfg", stringeddata);
        main.write_alt_storage_location(stringeddata);
    },
    load: function () {//Load the config file
        console.warn('Configuration is being loaded')
        var alt_location = main.get.alt_location();
        if (alt_location != false) {//Load from alt location
            //load from alternate storage location
            if (fs.existsSync(alt_location + "/Anthonymcfg config.json")) {//Directory exists
                var fileout = fs.readFileSync(alt_location + "/Anthonymcfg config.json", { encoding: 'utf8' })//Read from file with charset utf8
                console.warn('config Loaded from: ', alt_location, 'Data from fs read operation: ', fileout)
                fileout = JSON.parse(fileout)//parse the json
                if (fileout.key == "Anthonymcfg") {//check if file has key
                    config = fileout;
                    console.warn('configuration applied from file')
                } else {//no key, not correct file, load from application storage
                    console.warn('The file is not a config file, internal configuration will be used')
                    config = JSON.parse(localStorage.getItem("Anthonymcfg"))
                }
            } else {//file does not exist, was moved, deleted or is inaccesible
                config = JSON.parse(localStorage.getItem("Anthonymcfg"))
                alert("file does not exist, was moved, deleted or is otherwise inaccesible, please select a new location to save app data ")
                config_manage.selectlocation();
            }
        } else {//load from application storage
            config = JSON.parse(localStorage.getItem("Anthonymcfg"))
            console.log('config Loaded from application storage')
        }

        console.table(config)
    },
    delete: function () {//Wjipe stowage
        localStorage.clear("Anthonymcfg")//yeet storage key
        main.set.alt_location(false)
        main.set.musicfolders([])
        config_manage.save()
    },
    backup: async function () {//backup configuration to a file
        console.warn('Configuration backup initiated')

        var date = new Date();
        dialog.showSaveDialog({//electron file save dialogue
            defaultPath: "Anthonymcfg backup " + Number(date.getMonth() + 1) + " - " + date.getDate() + " - " + date.getFullYear() + ".json",
            buttonLabel: "Save"
        }).then((filepath) => {
            console.log(filepath)
            if (filepath.canceled == true) {//the file save dialogue was canceled my the user
                console.warn('The file dialogue was canceled by the user')
            } else {
                main.write_file(filepath.filePath, JSON.stringify(config))//hand off writing the file to main process
            }
        }).catch((err) => {//catch error
            alert('An error occured ', err.message);
        })

    },
    restore: async function () {//restore configuration from a file
        console.warn('Configuration restoration initiated')

        dialog.showOpenDialog({
            buttonLabel: "open", filters: [
                { name: 'Custom File Type', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        }).then((filepath) => {
            console.log(filepath)
            if (filepath.canceled == true) {//diologue ccanceled
                console.log("diologue ccanceled");
            } else {
                fs.readFile(filepath.filePaths[0], 'utf-8', (err, data) => {//load data from file
                    if (err) {
                        alert("An error ocurred reading the file :" + err.message)
                    } else {
                        console.log("The file content is : " + data);
                        var fileout = JSON.parse(data)
                        if (fileout.key == "Anthonymcfg") {//check if this file is a timetable backup file
                            config = fileout
                            config_manage.save();
                            maininitalizer()
                        } else {
                            console.warn(filepath.filePaths[0] + ' is not a backup file')
                        }
                    }
                })
            }
        }).catch((err) => {
            alert('An error occured, ', err)
        })
    },
    selectlocation: async function () {//select location for configuration storage
        console.log('Select config location')
        var altpath

        var alt_location = main.get.alt_location()
        if (alt_location != false) {
            altpath = dialog.showOpenDialog({ properties: ['createDirectory', 'openDirectory'], defaultPath: alt_location })
        } else {
            altpath = dialog.showOpenDialog({ properties: ['createDirectory', 'openDirectory'], })
        }

        await altpath.then((altpath) => {
            if (altpath.canceled == true) {//user canceled dialogue
                main.set.alt_location(false)
            } else {
                console.warn('Alternate configuration path :', altpath.filePaths[0])

                main.set.alt_location(altpath.filePaths[0])

                if (fs.existsSync(altpath + "/Anthonymcfg config.json")) {//config file already exist there
                    config_manage.load()
                } else {//no config file exist there
                    config_manage.save();
                }
            }
        }).catch((err) => {
            main.set.alt_location(false)
            alert('An error occured ', err.message)
        })
    },
}

let player = {//Playback control
    files: [//path and other details of song files
        { filename: "basename", path: "path in file system", duration: "song duration in seconds" }
    ],
    playlists: [//playlist files and details
        {
            path: "path  to playlist file, if any",
            files: [
                { name: "Name of file saved from last run", index: "index of file in current player.files array" },
            ]
        }
    ],
    queue: [],//Play queue randomized from playlist/library
    stream1: null,//stream for howler
    seekterval: null,//looping seek time update
    playstate: false,//is (should be) playing music or video
    now_playing: null,//Song thats currently playing
    initalize: async function () {
        //set configurations
        backgroundmaskimg.style.filter = config.background_blur ? `blur(${config.background_blur}px)` : `blur(0px)`

        //  Play\pause button
        playbtn.addEventListener('click', function () { player.play() })
        ipcRenderer.on('tray_play_pause', () => { player.play() })//listening on channel 'tray_play_pause'

        //  Next button
        nextbtn.addEventListener('click', function () { player.next() })
        ipcRenderer.on('tray_next', () => { player.next() })//listening on channel 'tray_next'

        //  Previous button
        document.getElementById('previousbtn').addEventListener('click', function () { player.previous() })
        ipcRenderer.on('tray_previous', () => { player.previous() })//listening on channel 'tray_previous'

        //seek controls
        song_progress_bar.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('seek to :', this.value);
            player.stop_seeking();
            player.stream1.seek(this.value);
            backgroundvideo.currentTime = this.value;
        })
        song_progress_bar.addEventListener('mouseenter', function () { player.stop_seeking() })
        song_progress_bar.addEventListener('mouseleave', function (e) {
            if (player.playstate == true && player.seekterval == null) {
                player.start_seeking()
            }
        })
    },
    fetch_library: async function () {
        //build library inteligentlly
        player.files = [];
        if (main.get.musicfolders() == []) {
            first_settup()
        } else {
            await player.getfiles(main.get.musicfolders())//wait for file checks
            setTimeout(() => { player.build_library() }, 0)//imediatly after file checks
            var hold = setInterval(() => {
                if (main_library_view.childElementCount < player.files.length) {
                    player.build_library()
                    console.warn('recheck library');
                    notify.new(
                        'Slow disk',
                        'Your songs are stored on a slow storage media, you may have a bad expeience using this application'
                    );
                } else {
                    clearInterval(hold)
                }
            }, 1000);//retry again and again
        }
    },
    getfiles: async function (muzicpaths) {//gets files form array of music folder paths
        console.log('Searching directory: ', muzicpaths)

        muzicpaths.forEach(folder => {//for each folder in the array

            fs.readdir(folder, function (err, files) {//read the files within the directory

                if (err) { console.warn('File error', err) }//error accessing directory due to it not existing or locked permissions

                files.forEach(file => {//for each file in the folder

                    var fullfilepath = path.join(folder, file);
                    if (fs.statSync(fullfilepath).isDirectory()) {//sud-directory to search
                        player.getfiles([fullfilepath]);
                        return 0;
                    } else {//file to handle

                        switch (path.parse(fullfilepath).ext) {//check file types

                            case ".mp3": case ".m4a": case ".mpeg": case ".opus": case ".ogg": case ".oga": case ".wav":
                            case ".aac": case ".caf": case ".m4b": case ".mp4": case ".m4v": case ".weba":
                            case ".webm": case ".dolby": case ".flac": //playable as music files
                                player.files.push({ filename: path.parse(fullfilepath).name, path: fullfilepath });
                                break;

                            case ".m3u": case ".pls": case ".xml"://playlist files {M3U , plain text PLS Audio Playlist , XML Shareable Playlist Format}
                                player.playlists.push({ path: fullfilepath });
                                break;

                            default: console.warn('Cannot handle (not supported): ', fullfilepath);//not supported music file
                        }
                    }
                })
            })
        })
        //player.build_library();//make after get of files, get of files must be async
    },
    build_library: async function () {
        main_library_view.innerHTML = "";

        for (let fileindex in player.files) { buildsong(fileindex); }

        function buildsong(fileindex) {
            var song_bar = document.createElement('div')
            song_bar.classList = "song_bar"
            song_bar.id = fileindex
            var song_title = document.createElement('div')
            song_title.className = "song_title"
            song_title.innerHTML = player.files[fileindex].filename;
            song_bar.title = `Play ${player.files[fileindex].filename}`
            song_bar.appendChild(song_title)
            main_library_view.appendChild(song_bar)
            functionality(song_bar, fileindex);

            /*if(process.platform == 'linux'){
 
            }*/
            setTimeout(() => {//artificial delay to prevent all files from being accessed within 20ms of each other, will slow down webview when drawing images from metadata
                fillmetadata(song_bar, fileindex, song_title)
            }, fileindex * 5);

        }

        async function fillmetadata(eliment, fileindex, song_title) {//set meta properties
            try {
                var song_duration = document.createElement('div')
                song_duration.className = "song_duration"
                mm.parseFile(player.files[fileindex].path).then((metadata) => {
                    //console.log(metadata)

                    //metadata song title
                    if (metadata.common.title != undefined) { song_title.innerHTML = metadata.common.title; }

                    //file duration
                    player.files[fileindex].duration = metadata.format.duration;//raw duration
                    song_duration.title = `${metadata.format.duration.toPrecision(2)} seconds`;
                    if (Number(metadata.format.duration % 60) >= 10) {
                        song_duration.innerHTML = `${Number((metadata.format.duration - metadata.format.duration % 60) / 60)}:${Number(metadata.format.duration % 60).toPrecision(2)}`;//seconds to representation of minutes and seconds
                    } else {
                        song_duration.innerHTML = `${Number((metadata.format.duration - metadata.format.duration % 60) / 60)}:0${Number(metadata.format.duration % 60).toPrecision(1) % 1}`;//seconds to representation of minutes and seconds
                    }
                    eliment.appendChild(song_duration)

                    //cover art
                    const picture = mm.selectCover(metadata.common.picture)
                    if (typeof (picture) != 'undefined' && picture != null) {
                        var songicon = document.createElement("img")
                        songicon.className = "songicon"
                        songicon.src = `data:${picture.format};base64,${picture.data.toString('base64')}`;
                        eliment.appendChild(songicon)
                    }
                    else {
                        //use placeholder image
                        var songicon = document.createElement("div")
                        songicon.className = "songicon_dfault"
                        eliment.appendChild(songicon)
                    }


                });
            } catch (err) {
                console.warn("Metadata error : ", err)
            }
        }

        async function functionality(eliment, fileindex) {//context menu and playback on click

            let contextMenu = new Menu.buildFromTemplate([
                {//play button
                    label: "Play",
                    type: "normal",
                    click() { player.play(fileindex) }
                },
                {
                    label: "add to favourites",
                    type: "normal",
                    click() { }
                },
                {
                    label: "add to playlist",
                    type: "normal",
                    click() { }
                },
                { type: "separator" },
                {
                    label: "copy file name",
                    click() { clipboard.writeText(player.files[fileindex].filename) }
                },
                {//open song file in default external application
                    label: "show in folder",
                    click() { shell.showItemInFolder(player.files[fileindex].path) }
                },
                {//copy file path
                    label: "copy file location",
                    toolTip: `${player.files[fileindex].path}`,
                    click() { clipboard.write(player.files[fileindex].path); }
                }
            ])

            eliment.addEventListener('contextmenu', (e) => {//Body menu attached to window
                e.preventDefault();
                e.stopPropagation();//important
                contextMenu.popup({ window: remote.getCurrentWindow() })//popup menu
            }, false);

            eliment.addEventListener('click', function () { player.play(fileindex) })//click to play
        }
    },
    play: async function (fileindex, load) {
        /* If something is playing resumes playback,
        if nothing is playing plays from the player.files[fileindex],
        if no fileindex assumes playback of the last song, if no last song, unloads playr
        */
        console.log('Attempt to play: ', fileindex);
        

        if (player.playstate != false) {//if is playing something
            if (fileindex == undefined) {//pause playback
                player.pause()
                return 0;
            }
        } else {//playing something
            if (fileindex == player.now_playing) {
                player.stream1.play();
                if(backgroundvideo.src!=""){
                    backgroundvideo.play();
                    backgroundvideo.currentTime = player.stream1.seek()
                }
                console.log('resume : ', player.files[player.now_playing].path);
                return 0;
            }
        }

        if (fileindex == undefined && player.now_playing != null) {//resume playback
            player.stream1.play();
            if(backgroundvideo.src!=""){
                backgroundvideo.play();
                backgroundvideo.currentTime = player.stream1.seek()
            }
            console.log('resume : ', player.files[player.now_playing].path);
            return 0;
        }

        if (fileindex == player.now_playing) {//pause playback
            if (player.playstate == true) {
                player.pause()
            } else {
                player.stream1.play()
            }
            return 0;
        }

        if (fileindex != player.now_playing && player.playstate != false) {
            await player.stream1.unload();//unlock the stream thats gonna be used
            backgroundvideo.src = "";
        }

        try {
            player.stream1 = new Howl({
                src: player.files[fileindex].path,//takes an array, or single path
                autoplay: true,
                loop: false,
                volume: 1,
                preload: false,
                html5: true,
                onend: function () {//Playback ends
                    console.log('Finished playing', player.files[fileindex].path);
                    player.playstate = false;
                    //place repeat chck here
                    player.next()
                },
                onplayerror: function () {//Playback fails
                    console.warn('fail to play ', player.files[fileindex])
                    stream1.once('unlock', function () {//wait for unlock
                        player.play(fileindex);// try to play again
                        notify.new('Error', `Could not access file: ${player.files[fileindex]}`, 'a file access error occured for some reason, could be anything from a bad disk to improper file permissions')
                    });
                },
                onload: function () {
                    console.log('loaded: ', player.files[fileindex].path)
                    document.getElementById('songTitle').innerText = player.files[fileindex].filename;
                    //player.stream1.play()//play the sound that was just loaded
                    //Handle background video (if any)
                    song_progress_bar.value = 0;
                    song_progress_bar.max = player.files[fileindex].duration;
                    switch (path.parse(player.files[fileindex].path).ext) {//check file types

                        case ".mp4": case ".m4v": case ".webm": case ".mov"://playable as music files
                            backgroundvideo.src = player.files[fileindex].path;
                            backgroundvideo.play();
                            break;
                        default: backgroundvideo.src = "";

                    }
                    backgroundvideo.currentTime = 0;
                },
                onplay: async function () {
                    //playback of loaded song file sucessfull
                    player.playstate = true;//now playing and play pause functionality
                    player.now_playing = Number(fileindex);//remove if you want a brain ache
                    config.last_played = Number(fileindex);
                    config_manage.save();
                    player.updatemetadata(fileindex);
                    ipcRenderer.send('Play_msg', player.files[fileindex].filename, 'pause')//Send playing song to main
                    playbtn.classList = "pausebtn"
                    playbtn.title = "pause"
                    player.start_seeking()
                    console.log('Playing: ', player.files[fileindex]);
                }
            });
            if (load != false) { player.stream1.load() }
        } catch (err) {
            console.warn('howl error ', err)
        } finally {
            document.querySelectorAll('.song_bar_active').forEach((song_bar) => { song_bar.className = "song_bar" })
            document.getElementById(fileindex).className = 'song_bar_active'
        }
    },
    pause: function () {
        console.log('Pause functionaliy');
        if (player.playstate != false) {
            player.stream1.pause();
            backgroundvideo.pause();
            player.stop_seeking()
            player.playstate = false;//stop playstate 
            navigator.mediaSession.playbackState = "paused";
            playbtn.classList = "playbtn"
            playbtn.title = "play"
            ipcRenderer.send('Play_msg', player.files[player.now_playing].filename, 'Play');
        } else {//assume error
            console.warn('Tried pause functionality with no playback');
        }
    },
    next: async function () {//Play next song in que if any
        console.log('Play Next');
        //check shuffle and skip
        const nextsong = player.files[player.now_playing + 1] ? Number(player.now_playing + 1) : 0;
        player.play(nextsong)
        document.querySelectorAll('.song_bar_active').forEach((song_bar) => { song_bar.className = "song_bar" })
        document.getElementById(`${nextsong}`).className = "song_bar_active"
        song_progress_bar.value = 0;//reset seek value
        player.now_playing = nextsong;
        window.location.href = `#${nextsong - 2}`;
    },
    previous: async function () {
        console.log('Play Previous');

        if (player.playstate == true) {
            if (player.stream1.seek() > 3) {//reset seek on back if less 
                player.stream1.seek(0)
                return 0;
            }
        }

        player.play(player.now_playing - 1)
        document.querySelectorAll('.song_bar_active').forEach((song_bar) => { song_bar.className = "song_bar" })
        document.getElementById(`${player.now_playing - 1}`).className = "song_bar_active"
        window.location.href = `#${player.now_playing - 2}`
        song_progress_bar.value = 0;//reset seek value
        player.now_playing = player.now_playing - 1;
    },
    mute: async function () {
        if (player.stream1.mute == true) {
            player.stream1.mute(false)
        } else {
            player.stream1.mute(true)
        }
    },
    start_seeking: async function () {
        console.warn('start seeking')
        player.stop_seeking();
        player.seekterval = setInterval(() => {
            let seeked = player.stream1.seek()
            song_progress_bar.value = seeked;
            navigator.mediaSession.setPositionState({
                duration: player.files[player.now_playing].duration,//player.files[player.now_playing].duration,
                playbackRate: 1,
                position: seeked,
            });
        }, 1000)
    },
    stop_seeking: function () {
        console.warn('stop seeking')
        clearInterval(player.seekterval)
        player.seekterval = null;
    },
    seekforward: function () {
        console.log('seek forward')
        var seeked = player.stream1.seek() + 5
        player.stream1.seek(seeked)
        backgroundvideo.currentTime = seeked;

    },
    seekbackward: function () {
        console.log('seek backwards')
        var seeked = player.stream1.seek() - 5
        player.stream1.seek(seeked)
        backgroundvideo.currentTime = seeked
    },
    updatemetadata: async function (fileindex) {

        navigator.mediaSession.playbackState = "playing";
        navigator.mediaSession.metadata = new MediaMetadata({ title: player.files[fileindex].filename });
        navigator.mediaSession.setActionHandler('play', function () { console.log('External play command'); player.play() });
        navigator.mediaSession.setActionHandler('pause', function () { console.log('External pause command'); player.pause() });
        //navigator.mediaSession.setActionHandler('stop', function () { console.log('External stop command') });
        //navigator.mediaSession.setActionHandler('seekbackward', function () { });
        //navigator.mediaSession.setActionHandler('seekforward', function () { });
        navigator.mediaSession.setActionHandler('seekto', function () { });
        navigator.mediaSession.setActionHandler('previoustrack', function () { console.log('External previous command'); player.previous() });
        navigator.mediaSession.setActionHandler('nexttrack', function () { console.log('External next command'); player.next() });

        /* pull file data */
        const metadata = await mm.parseFile(player.files[fileindex].path);
        console.log(metadata)
        document.getElementById('songTitle').innerText = metadata.common.title ? metadata.common.title : player.files[fileindex].filename;

        //picture
        const picture = mm.selectCover(metadata.common.picture)
        if (typeof (picture) != 'undefined' && picture != null) {
            console.log('Cover art info: ', picture)
            document.getElementById('coverartsmall').src = `data:${picture.format};base64,${picture.data.toString('base64')}`;
            backgroundmaskimg.src = `data:${picture.format};base64,${picture.data.toString('base64')}`;
            backgroundmaskimg.style.display = "block";

            //let imgscr = `data:${picture.format};base64,${picture.data.toString('base64')}`;
            //let imgscr = new Blob([picture.data], { type: picture.format });
            let imgscr = URL.createObjectURL(new Blob([picture.data], { type: picture.format }))
            console.log(imgscr)
            navigator.mediaSession.metadata = new MediaMetadata({
                title: metadata.common.title ? metadata.common.title : player.files[fileindex].filename,
                artist: metadata.common.artist ? metadata.common.artist : "unknown",
                album: metadata.common.album ? metadata.common.album : "unknown",
                artwork: picture ? [{ src: imgscr }] : null,
            });
        } else {
            //use placeholder image
            document.getElementById('coverartsmall').src = "img/vinyl-record-pngrepo-com-white.png"
            document.getElementById('coverartsmall').name = "vibecat"
            backgroundmaskimg.src = "";
            backgroundmaskimg.style.display = "none";
            UI.get_desktop_wallpaper().then((wallpaperpath) => {
                mainmaskcontainer.style.backgroundImage = `url('${wallpaperpath}')`
            });
            navigator.mediaSession.metadata = new MediaMetadata({
                title: metadata.common.title ? metadata.common.title : player.files[fileindex].filename,
                artist: metadata.common.artist ? metadata.common.artist : "unknown",
                album: metadata.common.album ? metadata.common.album : "unknown",
            });
        }
    },
}

let UI = {
    initalize: function () {

    },
    settings: {

    },
    notify: {//notification function house
        clap: window.addEventListener('resize', async () => { UI.notify.clearall() }),
        new: async function (title, body, hover_title, ifunction) {

            let notification = document.createElement("div")
            notification.classList = "notification"

            let notification_title = document.createElement("div")
            notification_title.classList = "title"
            notification_title.innerHTML = title
            notification.title = hover_title ? hover_title : "click to dismiss"

            let nbody = document.createElement("div")//body
            nbody.classList = "notifbody"
            nbody.innerHTML = body;

            notification.appendChild(notification_title)
            notification.appendChild(nbody)
            document.body.appendChild(notification)

            if (typeof (ifunction) == 'function') { //imbedded function
                notification.addEventListener('click', ifunction);
                let xbutton = document.createElement('div');//Close button
                xbutton.setAttribute('class', 'x-button')
                notification.appendChild(xbutton)
                xbutton.title = 'click to dismiss';
                xbutton.addEventListener('click', async function (e) { removethis(e, notification) })
            } else {
                notification.addEventListener('click', async function (e) { removethis(e, notification) })
            }

            //Timing effects
            setTimeout(async () => {
                notification.style.transform = 'translateX(0)'
                //UI.notify.shove()
            }, 50);

            setTimeout(async () => { notification.style.opacity = '0.0' }, 10000); //dissapear

            setTimeout(async () => { try { document.body.removeChild(notification) } catch (err) { console.warn(err) } }, 11000); //remove from document

            async function removethis(e, rnotification) {
                e.stopImmediatePropagation();
                rnotification.style.transform = 'translateX(22rem)';
                setTimeout(() => { rnotification.style.opacity = '0.0'; }, 100)
                setTimeout(() => { try { document.body.removeChild(notification) } catch (err) { console.warn(err) } }, 1000)
            }

        },
        shove: async function () {
            var notifications = document.querySelectorAll(".notification")
            var reverse = notifications.length - 1;
            for (let i in notifications) {
                notifications[i].style.transform = 'translateY(' + -reverse * 9 + 'rem)';//9 rem., height of notification
                reverse--;//get it, because oposite
            }
        },
        clearall: async function () {
            document.querySelectorAll(".notification").forEach((notification) => {
                try {
                    notification.style.opacity = '0.0';
                    notification.style.transform = 'translate(0,0)'
                } catch (err) { console.warn(err) }
            })
        }
    },
    get_desktop_wallpaper: async function () {
        let returned = await wallpaper.get()
            .then((wallpaperpath) => {//gets desktop wallpaper
                if (path.parse(wallpaperpath).ext !== undefined) {
                    wallpaperpath = wallpaperpath.replace(/\\/g, '/');// replace all \\ with /
                    return wallpaperpath;
                } else {
                    console.error('Failed to get desktop wallpaper')
                    return 'fail'
                }
            }).catch((err) => {
                console.warn('wallpaper error ', err)
                return err;
            })
        return returned;
    },

}
