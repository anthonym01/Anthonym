/*
    By samuel A. Matheson
    samuelmatheson15@gmail.com
*/
const my_website = 'https://anthonym01.github.io/Portfolio/?contact=me';

const { ipcRenderer, remote, clipboard } = require('electron');
const { dialog, Menu, MenuItem, nativeTheme, systemPreferences, shell, screen } = remote;
const main = remote.require('./main');

const fs = require('fs');
const path = require('path');
//const sharp = require('sharp');//prebuilt binars incompatible with electron-builder

//const { screenwidth, screenheight } = screen.getPrimaryDisplay().workAreaSize.height;

//const guestimated_best = ~~(screen.getPrimaryDisplay().workAreaSize.height / 14.5);



/*System wallpaper loactions
    - /home/samuel/.local/share/wallpapers
*/
const wallpaper = require('wallpaper');
const utils = require('../Windows/js/utils.js');
//import { rand_number } from './utils.mjs';

//import * as mm from 'music-metadata/lib/core';
const mm = require('music-metadata');
const { Howler } = require('howler');
const thumbnailjs = require('thumbnail-js');
const NodeID3 = require('node-id3');

const playbtn = document.getElementById('playbtn');
const nextbtn = document.getElementById('nextbtn');
const previousbtn = document.getElementById('previousbtn');
const repeatbtn = document.getElementById('repeatbtn');
const shufflebtn = document.getElementById('shufflebtn');
const song_progress_bar = document.getElementById('song_progress_bar');
const backgroundmaskimg = document.getElementById('backgroundmaskimg');
const backgroundvideo = document.getElementById('backgroundvideo');
const mainmaskcontainer = document.getElementById('mainmaskcontainer');
const Menupannel_main = document.getElementById('Menupannel_main');
const main_library_view = document.getElementById('main_library_view');
const searchput = document.getElementById('searchput');
const overpainelm = document.getElementById('overpain');//pannel for queue and search
const searchbox = document.getElementById('searchbox');
const coverartsmall = document.getElementById('coverartsmall');

let looking = [];//looking timers, only search after user stops typing

let actiontimeout = false;

let now_playing_content = {
    duration: 999,
}

//  Taskbar buttons for frameless window
document.getElementById('x-button').addEventListener('click', function () { ipcRenderer.send('x_button'); })
document.getElementById('maximize-button').addEventListener('click', function () { ipcRenderer.send('maximize_btn') })
document.getElementById('minimize-button').addEventListener('click', function () { ipcRenderer.send('minimize_btn') })

//window loads
window.addEventListener('load', async function () {
    main_menus();
    console.log('Running from:', process.resourcesPath)
    console.log('System preference Dark mode: ', nativeTheme.shouldUseDarkColors)//Check if system is set to dark or light

    if (localStorage.getItem("Anthonymcfg")) { config_manage.load() }
    UI.initalize()
    player.initalize()
    maininitalizer()


    console.log("                       dxxxxdoc,.                  ");
    console.log("                       NMMMMMMMMMMXkc.             ");
    console.log("           .:          OMMMMMMMMMMMMMMNd.          ");
    console.log("         ,0MM;         oMMMMMMMMMMMMMMMMMK;        ");
    console.log("       .KMMMMW.        :MMMMMMMMMMMMMMMMMMMK'      ");
    console.log("      oMMMMMMMX        'MMMMMMMMMMMMMMMW0dc'       ");
    console.log("     OMMMMMMMMMO       .MMMMMMMMMMWOo;.            ");
    console.log("    xMMMMMMMMMMMx       MMMMMMKd;.                 ");
    console.log("   .MMMMMMMMMMMMMo      MMWk;                      ");
    console.log("   KMMMMMMMMMMMMMMo    .MM.                        ");
    console.log("   MMMMMMMMMMMMMMMMk   :MMNOxdollloooddxkkO0KXNWM  ");
    console.log("   MMMMMMMMMMMMMMMMMNdoWMMMMWloNMMMMMMMMMMMMMMMMM  ");
    console.log("   WNXK00OkxddoollllllodONMMc   xMMMMMMMMMMMMMMMM  ");
    console.log('                         .WM.    lMMMMMMMMMMMMMMl  ');
    console.log('                       ;kWMM.     lMMMMMMMMMMMMM   ');
    console.log('                  .:dKMMMMMM.      dMMMMMMMMMMM.   ');
    console.log('             .;o0WMMMMMMMMMM.       kMMMMMMMMM.    ');
    console.log("        'cxKWMMMMMMMMMMMMMMM,        KMMMMMMN      ");
    console.log('         MMMMMMMMMMMMMMMMMMMc        .NMMMM.       ');
    console.log("           MMMMMMMMMMMMMMMMMd         'MM          ");
    console.log('              MMMMMMMMMMMMMM0                      ');
    console.log('                  dMMMMMMMMMW                      ');


})

window.addEventListener('keydown', function (e) {//keyboard actions
    console.log('Keypress: ', e.key)
    switch (e.key) {
        case " ": case "p": case "enter": e.preventDefault(); player.play(); break;
        case "Escape":
            e.preventDefault();
            if (overpainelm.classList == "overpain_active") {
                UI.overpain.hide()
            }
            break;
        case "f": e.preventDefault(); UI.overpain.show(); break;
        case "n":
            e.preventDefault();
            console.log('Seekforward on keypress');
            player.next(); break;
        case "b":
            e.preventDefault();
            console.log('previous on keypress');
            player.previous(); break;
        case "m":
            e.preventDefault();
            console.log('mute on keypress');
            player.mute();
            break;
        case "ArrowRight":
            e.preventDefault();
            console.log('Seek forward on keypress');
            player.seekforward();
            break;
        case "ArrowLeft":
            e.preventDefault();
            console.log('Seek backward on keypress');
            player.seekbackward();
            break;
        default: console.log('No action')
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
    //Menu.setApplicationMenu(menu_body);
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
        //{ role: 'seperator' },
        { role: 'undo' },
        { role: 'redo' },
    ]);
    document.getElementById('background_blur_put').addEventListener('contextmenu', (event) => { popupmenu(event) }, false)
    searchput.addEventListener('contextmenu', (event) => { popupmenu(event) }, false)

    function popupmenu(event) {//Popup the menu in this window
        event.preventDefault()
        event.stopPropagation()
        text_box_menu.popup({ window: require('electron').remote.getCurrentWindow() })
    }
}

async function maininitalizer() {//Used to start re-startable app functions
    console.log('main initalizer')
    //reset players state to default
    main_library_view.innerHTML = ""
    player.pause();
    player.stop_seeking();
    files = [];//path and other details of song files
    playlists = [];//playlist files and details
    player.queue = [];//Play queue randomized from playlist/library
    player.playstate = false;//is (should be) playing music
    player.fetch_library();
}

let config = {
    key: "Anthonymcfg",
    background_blur: 2,//pixels
    last_played: 0,
    animations: true,
    shuffle: false,
    playbar_icons: true,
    video_icons: true,
    repeat: 1,//0 no repeat, 1 repeat all, 2 replay current song
    favourites: ["I can be the one"]
}

/* rework to be module */
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
}

let files = [];

let playlists = [//playlists
    /*{
        path: "path  to playlist file, if any",
        files: [0, 5, 23, 6, 7]//file indexes
    }*/
];

let player = {//Playback control
    queue: [],//Play queue randomized from playlist/library
    stream1: null,//stream for howler
    seekterval: null,//looping seek time update
    playstate: false,//is (should be) playing music or video
    now_playing: null,//Song thats currently playing
    initalize: async function () {

        navigator.mediaSession.playbackState = "none";
        //navigator.mediaSession.metadata = new MediaMetadata({ title: path.basename(files[fileindex]) });
        navigator.mediaSession.setActionHandler('play', function () {
            console.log('External play command');
            if (!actiontimeout) {
                actiontimeout = true;
                setTimeout(() => { actiontimeout = false }, 20)
                player.play();
            } else {
                console.warn('Hit action timeout')
            }

        });
        navigator.mediaSession.setActionHandler('pause', function () {
            console.log('External pause command');
            /*          if (!actiontimeout) {
                          actiontimeout = true;
                          setTimeout(() => { actiontimeout = false }, 500)
                          player.pause()
                      } else {
                          console.warn('Hit action timeout')
                      }
          */
            player.pause()
        });
        navigator.mediaSession.setActionHandler('stop', function () { console.log('External stop command') });
        navigator.mediaSession.setActionHandler('seekbackward', function () { });
        navigator.mediaSession.setActionHandler('seekforward', function () { });
        //navigator.mediaSession.setActionHandler('shuffle', function () { });
        navigator.mediaSession.setActionHandler('seekto', function () { });
        navigator.mediaSession.setActionHandler('previoustrack', function () {
            console.log('External previous command');
            if (!actiontimeout) {
                actiontimeout = true;
                setTimeout(() => { actiontimeout = false }, 20)
                player.previous();
            } else {
                console.warn('Hit action timeout')
            }


        });
        navigator.mediaSession.setActionHandler('nexttrack', function () {
            console.log('External next command');
            if (!actiontimeout) {
                actiontimeout = true;
                setTimeout(() => { actiontimeout = false }, 20)
                player.next()
            } else {
                console.warn('Hit action timeout')
            }

        });

        /*setTimeout(async () => {//set last palyed song
            player.play(config.last_played, false);
            player.pause();
            if (config.last_played < 2) {
                window.location.href = `#${config.last_played}`;
            } else {
                window.location.href = `#${config.last_played - 2}`;
            }

        }, 5000);*/

        coverartsmall.addEventListener('click', function () { player.scroll_to_current() })

        //search input
        searchput.addEventListener('keydown', function (e) {//keyboard actions
            e.stopImmediatePropagation();
            if (e.key == "Escape") {
                UI.overpain.hide()
            } else {
                player.lookup();
            }
        })

        //shuffle button
        switch (config.shuffle) {
            case false://no shuffle
                shufflebtn.className = "shufflebtn"
                shufflebtn.title = "no shuffle"
                break;
            case true:// shuffle
                shufflebtn.className = "shufflebtn_on"
                shufflebtn.title = "shuffle"
                break;
            default: config.shuffle = false; config_manage.save();

        }
        shufflebtn.addEventListener('click', function () {
            switch (config.shuffle) {
                case false://no shuffle
                    shufflebtn.className = "shufflebtn_on"
                    shufflebtn.title = "shuffle"
                    config.shuffle = true;
                    config_manage.save();
                    break;
                case true:// shuffle
                    shufflebtn.className = "shufflebtn";
                    shufflebtn.title = "no shuffle"
                    config.shuffle = false;
                    config_manage.save();
                    break;
                default: config.shuffle = false; config_manage.save();
            }
        })

        //repeat button
        switch (config.repeat) {
            case 0://no repeat
                repeatbtn.className = "repeatbtn_no"
                repeatbtn.title = "no repeat"
                break;
            case 1:// repeat all
                repeatbtn.className = "repeatbtn_all"
                repeatbtn.title = "repeat all"
                break;
            case 2://replay current song
                repeatbtn.className = "repeatbtn_lock"
                repeatbtn.title = "repeat current song"
                break;
            default: config.repeat = 0; config_manage.save();

        }

        repeatbtn.addEventListener('click', function () {
            switch (config.repeat) {
                case 0://no repeat
                    repeatbtn.className = "repeatbtn_all"
                    repeatbtn.title = "repeat all"
                    config.repeat = 1;
                    config_manage.save();
                    break;
                case 1:// repeat all
                    repeatbtn.className = "repeatbtn_lock";
                    repeatbtn.title = "repeat current song"
                    config.repeat = 2;
                    config_manage.save();
                    break;
                case 2://replay current song
                    repeatbtn.className = "repeatbtn_no"
                    repeatbtn.title = "no repeat"
                    config.repeat = 0;
                    config_manage.save();
                    break;
                default: config.repeat = 0; config_manage.save();

            }
        })

        //  Play\pause button
        playbtn.addEventListener('click', function () { player.play() })
        ipcRenderer.on('tray_play_pause', () => { player.play() })//listening on channel 'tray_play_pause'

        //  Next button
        nextbtn.addEventListener('click', function () { player.next() })
        ipcRenderer.on('tray_next', () => { player.next() })//listening on channel 'tray_next'

        //  Previous button
        previousbtn.addEventListener('click', function () { player.previous() })
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
        //let mp4count = 0;
        files = [];
        if (main.get.musicfolders() == [] || main.get.musicfolders() == undefined || main.get.musicfolders() < 1) {
            first_settup()//run first settup
        } else {
            await getfiles(main.get.musicfolders())//wait for recursive file checks
            setTimeout(() => { build_library() }, 500)//imediatly after file checks
            let hold = setInterval(() => {
                if (main_library_view.childElementCount < files.length) {
                    build_library()
                    console.warn('recheck library');
                    //warn the bokens
                    UI.notify.new('Slow file access', 'took more than 10ms to gain acces to files');
                } else {
                    clearInterval(hold)
                }
            }, 1000);//retry over and over, again and again-gen
            setTimeout(() => { clearInterval(hold); console.error('Could not gain some files') }, 10000)
        }

        async function getfiles(muzicpaths) {//gets files form array of music folder paths
            console.log('Searching directory: ', muzicpaths)

            muzicpaths.forEach(folder => {//for each folder in the array

                fs.readdir(folder, function (err, dfiles) {//files from the directory
                    try {
                        if (err) { throw err }//yeet

                        dfiles.forEach(file => {//for each file in the folder

                            var fullfilepath = path.join(folder, file);
                            if (fs.statSync(fullfilepath).isDirectory()) {//sud-directory to search
                                getfiles([fullfilepath]);
                                return 0;
                            } else {//file to handle

                                switch (path.parse(fullfilepath).ext) {//check file types
                                    case ".mp4": case ".mp3": case ".mpeg": case ".opus": case ".ogg": case ".oga": case ".wav":
                                    case ".aac": case ".caf": case ".m4b": case ".m4v": case ".m4a": case ".weba":
                                    case ".webm": case ".dolby": case ".flac": //playable as music files
                                        files.push(fullfilepath);
                                        break;

                                    case ".m3u": case ".pls": case ".xml"://playlist files {M3U , plain text PLS Audio Playlist , XML Shareable Playlist Format}
                                        playlists.push(fullfilepath);
                                        break;

                                    default: console.warn('not supported: ', fullfilepath);//not supported music file
                                }
                            }
                        })

                    }//error accessing directory due to it not existing or locked permissions
                    catch (err) {
                        console.warn('File error', err)
                        UI.notify.new('Error', `Could not access ${folder}`)
                    }
                })
            })
        }

        async function build_library() {
            main_library_view.innerHTML = "";

            for (let fileindex in files) {
                player.build_songbar(fileindex).then((builtbar) => {
                    builtbar.id = fileindex;
                    main_library_view.appendChild(builtbar)
                })
            }

        }

    },
    play: async function (fileindex, load) {
        /* If something is playing resumes playback,
        if nothing is playing plays from the files[fileindex],
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
                if (backgroundvideo.style.display != "none") {
                    backgroundvideo.play();
                    backgroundvideo.currentTime = player.stream1.seek()
                } else {
                    backgroundvideo.muted = true;
                    backgroundvideo.pause()
                }
                console.log('resume : ', files[player.now_playing]);
                return 0;
            }
        }

        if (fileindex == undefined && player.now_playing != null) {//resume playback
            player.stream1.play();
            if (backgroundvideo.style.display != "none") {

                backgroundvideo.play();
                backgroundvideo.currentTime = player.stream1.seek()
            } else {
                backgroundvideo.muted = true;
                backgroundvideo.pause()
            }
            console.log('resume : ', files[player.now_playing]);
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

        /*if (fileindex != player.now_playing && player.playstate != false) {
            //await player.stream1.unload();//unlock the stream thats gonna be used
            //Howler.unload()
            /*backgroundvideo.src = "";
            backgroundvideo.style.display = "none"
        }*/

        try {
            //await player.stream1.unload();//unlock the stream thats gonna be used
            Howler.unload()//unload playing track if any

            player.stream1 = new Howl({
                src: files[fileindex],//takes an array, or single path
                autoplay: true,
                loop: false,
                volume: 1,
                preload: false,
                html5: true,
                onend: function () {//Playback ends
                    console.log('Finished playing', files[fileindex]);
                    player.playstate = false;
                    //place repeat chck here
                    player.next()
                },
                onplayerror: function () {//Playback fails
                    console.warn('fail to play ', files[fileindex])
                    stream1.once('unlock', function () {//wait for unlock
                        player.play(fileindex);// try to play again
                        notify.new('Error', `Could not access file: ${files[fileindex]}`, 'a file access error occured for some reason, could be anything from a bad disk to improper file permissions')
                    });
                },
                onload: function () {
                    console.log('loaded: ', files[fileindex])
                    document.getElementById('songTitle').innerText = path.basename(files[fileindex]);
                    //player.stream1.play()//play the sound that was just loaded
                    //Handle background video (if any)
                    song_progress_bar.value = 0;
                    //song_progress_bar.max = files[fileindex].duration;
                    switch (path.extname(files[fileindex])) {//check file types

                        case ".mp4": case ".m4v": case ".webm": case ".mov"://playable as music files
                            backgroundvideo.src = files[fileindex];
                            backgroundvideo.style.display = "block"
                            backgroundvideo.play();
                            document.getElementById('tbuttonholder').className = "tbuttonholder"//allow to be hidden
                            break;
                        default:
                            backgroundvideo.src = "";
                            backgroundvideo.style.display = "none"
                            backgroundvideo.muted = true;
                            backgroundvideo.pause()


                    }
                    backgroundvideo.currentTime = 0;
                },
                onplay: async function () {
                    //playback of loaded song file sucessfull
                    player.playstate = true;//now playing and play pause functionality
                    player.now_playing = Number(fileindex);//remove if you want a brain ache
                    config.last_played = Number(fileindex);
                    player.updatemetadata(fileindex);
                    ipcRenderer.send('Play_msg', path.basename(files[fileindex]), 'pause')//Send playing song to main
                    playbtn.classList = "pausebtn"
                    playbtn.title = "pause"
                    player.start_seeking()
                    console.log('Playing: ', files[fileindex]);
                    config_manage.save();
                }
            });

            if (load != false) { player.stream1.load() }

        } catch (err) {
            console.warn('howl error ', err)
        } finally {
            document.querySelectorAll('.song_bar_active').forEach((song_bar) => { song_bar.className = "song_bar" })
            document.getElementById(fileindex).className = 'song_bar_active'
            player.build_songbar(fileindex).then((songbar) => { document.getElementById('playhistory').appendChild(songbar) })
        }
    },
    external_play: async function () {//fix for a bug on a specific linux dde
        player.stream1.play();
    },
    pause: function () {
        console.log('Pause functionaliy');
        if (player.playstate != false) {
            player.stream1.pause();
            backgroundvideo.pause();
            player.stop_seeking();
            player.playstate = false;//stop playstate 
            navigator.mediaSession.playbackState = "paused";
            playbtn.classList = "playbtn";
            playbtn.title = "play";
            ipcRenderer.send('Play_msg', path.basename(files[player.now_playing]), 'Play');
        } else {//assume error
            console.warn('Tried pause functionality with no playback');
        }
    },
    next: async function () {//Play next song in que if any
        console.log('Play Next');

        switch (config.repeat) {
            case 0://no repeat
                break;
            case 1:// repeat all
                break;
            case 2://replay current song
                break;
            default:
        }

        //prototype shuffle
        let nextsong;
        if (config.shuffle == true) {
            nextsong = utils.rand_number(files.length - 1, 0, player.now_playing);
        } else {
            nextsong = files[player.now_playing + 1] ? Number(player.now_playing + 1) : 0;
        }
        player.play(nextsong)
        player.now_playing = nextsong;
        song_progress_bar.value = 0;//reset seek value
        player.scroll_to_current()

    },
    previous: async function () {
        console.log('Play Previous');

        if (player.playstate == true) {
            if (player.stream1.seek() > 3) {//reset seek on back if less 
                player.stream1.seek(0)
                backgroundvideo.currentTime = 0
                return 0;
            }
        }

        player.play(player.now_playing - 1)
        song_progress_bar.value = 0;//reset seek value
        player.now_playing = player.now_playing - 1;

        player.scroll_to_current()
    },
    mute: async function () {
        if (Howler._muted == true) {
            Howler.mute(false)
        } else {
            Howler.mute(true)
        }
    },
    start_seeking: async function () {
        console.warn('start seeking')
        player.stop_seeking();
        player.seekterval = setInterval(() => {
            let seeked = player.stream1.seek()
            song_progress_bar.value = seeked;
            /*navigator.mediaSession.setPositionState({
                duration: now_playing_content.duration,
                playbackRate: 1,
                position: seeked,
            });*/
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
    updatemetadata: async function (fileindex) {//Bste the UI with metadata about the song that is currently playing

        navigator.mediaSession.playbackState = "playing";

        /* pull file data */
        const metadata = await mm.parseFile(files[fileindex]);

        console.log(metadata)
        document.getElementById('songTitle').innerText = metadata.common.title ? metadata.common.title : path.basename(files[fileindex]);
        document.getElementById('songArtist').innerText = metadata.common.artist ? `by ${metadata.common.artist}` : "unknown";
        now_playing_content.duration = metadata.format.duration;
        song_progress_bar.max = metadata.format.duration;
        //picture
        const picture = mm.selectCover(metadata.common.picture) || undefined;
        const processed_picture = picture ? `data:${picture.format};base64,${picture.data.toString('base64')}` : './img/icon.png';
        if (typeof (picture) != 'undefined' && picture != undefined) {
            console.log('Cover art info: ', picture)
            document.getElementById('coverartsmall').src = processed_picture;
            backgroundmaskimg.src = processed_picture;
            backgroundmaskimg.style.display = "block";

            UI.blurse()

            if (overpainelm.className != "overpain_active") {//hide titlebar buttons if overpain isnt visible
                document.getElementById('tbuttonholder').className = "tbuttonholder"
            }

            if (config.background_blur == 0) {//strech song totle as needed
                document.getElementById('songdetailcontainer').classList = "songdetailcontainer_alt";
            } else {
                document.getElementById('songdetailcontainer').classList = "songdetailcontainer";

            }


            //let imgscr = `data:${picture.format};base64,${picture.data.toString('base64')}`;
            //let imgscr = new Blob([picture.data], { type: picture.format });
            /*let imgscr = URL.createObjectURL(
                new Blob([picture.data], { type: picture.format })
            );*/

            let imgscr = URL.createObjectURL(
                new Blob([picture.data], { type: picture.format })
            );

            ipcRenderer.send('new_icon', imgscr)
            console.log(imgscr)

            navigator.mediaSession.metadata = new MediaMetadata({
                title: metadata.common.title ? metadata.common.title : path.basename(files[fileindex]),
                artist: metadata.common.artist ? metadata.common.artist : "unknown",
                album: metadata.common.album ? metadata.common.album : "unknown",
                artwork: [
                    { src: 'https://raw.githubusercontent.com/anthonym01/Anthonym/main/icon.png', size: "1024x1024", type: 'image/png' }
                ],
                //artwork: picture ? [{ src: imgscr,sizes: '96x96',type: picture.format }] : null,
            });

        } else {
            //use placeholder image
            document.getElementById('coverartsmall').src = "img/vinyl-record-pngrepo-com-white.png"
            document.getElementById('coverartsmall').name = "vibecat"
            backgroundmaskimg.src = "";
            backgroundmaskimg.style.display = "none";

            UI.unblurse()

            document.getElementById('tbuttonholder').className = "tbuttonholder_locked"
            document.getElementById('songdetailcontainer').classList = "songdetailcontainer_alt";
            UI.get_desktop_wallpaper().then((wallpaperpath) => {
                mainmaskcontainer.style.backgroundImage = `url('${wallpaperpath}')`
            });
            /*navigator.mediaSession.metadata = new MediaMetadata({
                title: metadata.common.title || path.basename(files[fileindex]),
                artist: metadata.common.artist || "unknown artist",
                //artist: metadata.common.artist ? metadata.common.artist : "unknown",
                album: metadata.common.album || "unknown",
                //album: metadata.common.album ? metadata.common.album : "unknown",
            });*/
        }
        if (backgroundvideo.style.display == "block") { document.getElementById('tbuttonholder').className = "tbuttonholder" }

        //notification if hidden
        if (remote.getCurrentWindow().isVisible() == false) {
            new Notification(
                `${metadata.common.title || path.basename(files[fileindex])}`,
                {
                    body: `Playing ${metadata.common.title || path.basename(files[fileindex])} by ${metadata.common.artist || "unknown"}`,
                    icon: processed_picture,
                    image: './img/icon.png',
                    silent: true,
                }
            ).onclick = () => {
                console.log('Notification clicked')
                main.Show_window()
            }
        }

    },
    lookup: async function () {//match any pattern to local file name

        for (let i in looking) { clearInterval(looking.pop()) }//prevent rappid researching

        let lookafor = setTimeout(() => {

            let pattern = searchput.value;
            console.log('Look for ', pattern)
            if (pattern != "") { searchbox.innerHTML = "" }

            for (let fileindex in files) {
                if (path.basename(files[fileindex]).toLowerCase().search(pattern.toLowerCase()) != -1) {
                    player.build_songbar(fileindex).then((songbar) => { searchbox.appendChild(songbar); })
                }
            }

        }, 500);

        looking.push(lookafor)

    },
    lift_coverart: async function (fileindex) {
        try {

            if (path.extname(files[fileindex]) == ".mp4") {
                console.warn('mp4 file detected')

                thumbnailjs.getVideoThumbnail(files[fileindex], 1, 3, "image/jpg").then((thumnaildata) => {
                    //console.log(thumnaildata)
                    var songicon = document.createElement("img")
                    songicon.className = "songicon"
                    songicon.src = thumnaildata;
                    eliment.appendChild(songicon)
                })

            } else {

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
            }
        } catch (err) {

        } finally {

        }

    },
    scroll_to_current: async function () {
        document.querySelectorAll('.song_bar_active').forEach((song_bar) => { song_bar.className = "song_bar" })
        document.getElementById(`${player.now_playing}`).className = "song_bar_active"
        if (document.getElementById(`#${player.now_playing - 2}`)) {
            window.location.href = `#${player.now_playing - 2}`
        } else {
            window.location.href = `#${player.now_playing - 1}`
        }

    },

    build_songbar: async function (fileindex) {
        //console.log('Song bar for :', files[fileindex])

        let songbar = buildsong(fileindex);

        return songbar;

        function buildsong(fiso) {
            var song_bar = document.createElement('div');
            song_bar.classList = "song_bar";
            var song_title = document.createElement('div')
            song_title.className = "song_title";
            song_title.innerHTML = path.basename(files[fiso]);
            song_bar.title = `Play ${path.basename(files[fiso])}`;
            song_bar.appendChild(song_title);

            functionality(song_bar, fiso);
            fillmetadata(song_bar, fiso, song_title);

            //            setTimeout(() => { fillmetadata(song_bar, fiso, song_title); }, 5 * fiso);
            return song_bar;

        }

        async function fillmetadata(eliment, fileindex, song_title) {//set meta properties
            try {
                var song_duration = document.createElement('div')
                song_duration.className = "song_duration"
                mm.parseFile(files[fileindex], { duration: false }).then(async (metadata) => {

                    //metadata song title
                    if (metadata.common.title != undefined) { song_title.innerHTML = metadata.common.title; }

                    //file duration
                    song_duration.title = `${metadata.format.duration} seconds`;
                    /*if (Number(metadata.format.duration % 60) >= 10) {
                        song_duration.innerHTML = `${Number((metadata.format.duration - metadata.format.duration % 60) / 60)}:${Number(metadata.format.duration % 60).toPrecision(2)}`;//seconds to representation of minutes and seconds
                    } else {
                        song_duration.innerHTML = `${Number((metadata.format.duration - metadata.format.duration % 60) / 60)}:0${Number(metadata.format.duration % 60).toPrecision(1) % 1}`;//seconds to representation of minutes and seconds
                    }*/
                    song_duration.innerHTML = `${~~(Number((metadata.format.duration - metadata.format.duration % 60) / 60))}:${~~(Number(metadata.format.duration % 60))}`;

                    eliment.appendChild(song_duration)


                    if (path.extname(files[fileindex]) == ".mp4") {
                        setTimeout(() => {
                            thumbnailjs.getVideoThumbnail(files[fileindex], 0.2, 3, "image/jpg").then((thumnaildata) => {
                                var songicon = document.createElement("img")
                                songicon.className = "songicon"
                                songicon.src = thumnaildata;

                                eliment.appendChild(songicon)
                            });
                        }, fileindex * 500);
                    } else {
                        const picture = mm.selectCover(metadata.common.picture)
                        if (typeof (picture) != 'undefined' && picture != null) {
                            var songicon = document.createElement("img")
                            songicon.className = "songicon"

                            eliment.appendChild(songicon)

                            /*const shapimg = await sharp(picture.data).resize(guestimated_best, guestimated_best).toFormat('webp').toBuffer();

                            songicon.src = URL.createObjectURL(
                                new Blob([shapimg], { type: 'image/webp' })
                            );*/
                            songicon.src = URL.createObjectURL(
                                new Blob([picture.data], { type: picture.format })
                            );
                            //songicon.src = `data:${picture.format};base64,${picture.data.toString('base64')}`;
                            eliment.appendChild(songicon)
                        }
                        else {
                            //use placeholder image
                            var songicon = document.createElement("div")
                            songicon.className = "songicon_dfault"
                            eliment.appendChild(songicon)
                        }
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
                    click() {
                        player.play(fileindex);
                        setTimeout(() => { window.location.href = `#${player.now_playing - 2}` }, 300);
                    }
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
                    click() { clipboard.writeText(path.basename(files[fileindex])) }
                },
                {//open song file in default external application
                    label: "show in folder",
                    click() { shell.showItemInFolder(files[fileindex]) }
                },
                {//copy file path
                    label: "copy file location",
                    //toolTip: `${player.files[fileindex].path}`,
                    click() { clipboard.write(files[fileindex]); }
                }
            ])

            eliment.addEventListener('contextmenu', (e) => {//Body menu attached to window
                e.preventDefault();
                e.stopPropagation();//important
                contextMenu.popup({ window: remote.getCurrentWindow() })//popup menu
            }, false);

            eliment.addEventListener('click', function () {
                player.play(fileindex);
                //eliment.classList = "song_bar_active";
                //setTimeout(() => { window.location.href = `#${player.now_playing - 2}` }, 300);
            })//click to play
        }
    }
}

let UI = {
    initalize: function () {

        UI.settings.animation.setpostition()
        UI.settings.minimize_to_tray.setpostition()
        UI.settings.quiton_X.setpostition()
        UI.settings.use_tray.setpostition()
        //grab desktop wallpaper
        UI.get_desktop_wallpaper().then((wallpaperpath) => { mainmaskcontainer.style.backgroundImage = `url('${wallpaperpath}')` })

        //animations switch trigger
        document.getElementById('Animations_btn').addEventListener('click', function () { UI.settings.animation.flip() })

        //tray switch trigger
        document.getElementById('tray_btn').addEventListener('click', function () { UI.settings.use_tray.flip() })

        //minimize to tray switch trigger
        document.getElementById('minimize_to_tray_btn').addEventListener('click', function () { UI.settings.minimize_to_tray.flip() })

        //close to tray switch trigger
        document.getElementById('close_to_tray_btn').addEventListener('click', function () { UI.settings.quiton_X.flip() })

        //setting navitation trigger
        document.getElementById('setting_btn').addEventListener('click', function () { UI.navigate.setting_view() })

        //search trigger
        document.getElementById('search_btn').addEventListener('click', function () {
            if (overpainelm.className == "overpain_active") {//hide it
                UI.overpain.hide()
            } else {//show it
                UI.overpain.show()
            }
        })

        document.getElementById('Menupannel_main').addEventListener('mouseenter', function () { UI.overpain.hide() })
        document.getElementById('main_library_view').addEventListener('mouseenter', function () { UI.overpain.hide() })
        document.getElementById('Playbar').addEventListener('mouseenter', function () { UI.overpain.hide() })
        document.getElementById('setting_view').addEventListener('mouseenter', function () { UI.overpain.hide() })

        //background blur
        backgroundmaskimg.style.filter = `blur(${config.background_blur}px)`;
        document.getElementById('background_blur_put').value = config.background_blur;
        document.getElementById('background_blur_put').addEventListener('change', function () {
            config.background_blur = this.value;
            config_manage.save();
            UI.blurse()
        })
    },
    navigate: {
        main_library_view: function () {
            console.log('Navigate main library')
            document.getElementById('setting_view').style.display = "none";
            main_library_view.style.display = "block";
            Menupannel_main.style.display = "block";
        },
        setting_view: function () {
            console.log('Navigate settings')
            if (main_library_view.style.display == "none") { this.main_library_view(); return 0; }
            document.getElementById('setting_view').style.display = "block";
            main_library_view.style.display = "none";
            Menupannel_main.style.display = "none";
        }
    },
    settings: {
        animation: {
            flip: function () {
                console.log('animation switch triggered');
                if (process.platform != "linux" && systemPreferences.getAnimationSettings().shouldRenderRichAnimation == false) {//animations preffered OFF by system
                    notify.new('System over-rule', 'Animations dissabled by Your Systems devices preferences');
                } else {
                    if (config.animations == true) {
                        //turn off the switch
                        config.animations = false
                        console.warn('animations dissabled');
                    } else {
                        //turn on the witch
                        config.animations = true
                        console.warn('animations enabled');
                    }
                }

                config_manage.save();
                this.setpostition();
            },
            setpostition: function () {
                switch (process.platform) {
                    case "linux"://Linux && free BSD
                        if (config.animations == true) { mation() }
                        else { nomation() }
                        break;
                    default://Mac OS && windows
                        if (systemPreferences.getAnimationSettings().shouldRenderRichAnimation == true) {//animations preffered by system only works on windows and wackOS
                            if (config.animations == true) { mation() } else { nomation() }
                        } else { nomation() }//system preffers no animations
                }
                function mation() {
                    document.getElementById('anime_put').checked = true;
                    document.getElementById('nomation_box').innerText = "";
                }
                function nomation() {
                    document.getElementById('anime_put').checked = false;
                    document.getElementById('nomation_box').innerText = "*{transition: none !important;animation: none !important;}";
                }
            },
        },
        use_tray: {
            flip: function () {
                console.log('use tray switch triggered');

                if (main.get.use_tray() == true) {//turn off the switch
                    main.set.use_tray(false)
                    main.remove_tray()
                    console.warn('use tray  dissabled');
                } else {//turn on the witch
                    main.set.use_tray(true)
                    main.reamake_tray()
                    console.warn('use tray enabled');
                }
                this.setpostition();
            },
            setpostition: function () {
                if (main.get.use_tray() == true) {
                    document.getElementById('tray_put').checked = true;
                } else {
                    document.getElementById('tray_put').checked = false;
                }
            },
        },
        minimize_to_tray: {
            flip: function () {
                console.log('use tray switch triggered');
                if (main.get.minimize_to_tray() == true) {//turn off the switch
                    main.set.minimize_to_tray(false)
                    //main.remove_tray()
                    console.warn('use minimize_to_tray dissabled');
                } else {//turn on the witch
                    main.set.minimize_to_tray(true)
                    //main.reamake_tray()
                    console.warn('use minimize_to_tray enabled');
                }
                this.setpostition();
            },
            setpostition: function () {
                if (main.get.minimize_to_tray() == true) {
                    document.getElementById('minimize_to_tray_put').checked = true;
                } else {
                    document.getElementById('minimize_to_tray_put').checked = false;
                }
            },
        },
        quiton_X: {
            flip: function () {
                console.log('use tray switch triggered');
                if (main.get.quiton_X() == true) {//turn off the switch
                    main.set.quiton_X(false)
                    //main.remove_tray()
                    console.warn('use minimize_to_tray dissabled');
                } else {//turn on the witch
                    main.set.quiton_X(true)
                    //main.reamake_tray()
                    console.warn('use minimize_to_tray enabled');
                }
                this.setpostition();
            },
            setpostition: function () {
                if (main.get.quiton_X() == true) {
                    document.getElementById('close_to_tray_put').checked = true;
                } else {
                    document.getElementById('close_to_tray_put').checked = false;
                }
            },
        }
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
    overpain: {
        hide: async function () {
            //if (searchput.value != "" || document.getElementById('searchbox').style.display == "block") {
            if (backgroundmaskimg.style.display == "none" && backgroundvideo.style.display == "none") {
                document.getElementById('tbuttonholder').className = "tbuttonholder_locked"
            } else {
                document.getElementById('tbuttonholder').className = "tbuttonholder"
            }
            searchput.style.display = ""
            overpainelm.className = "overpain"
            main_library_view.style.filter = ""
            /*document.getElementById('searchbox').style.width = ""*/
            /*} else {
    
                document.getElementById('tbuttonholder').className = "tbutaintonholder_locked"
    
    
                document.getElementById('searchbox').style.display = ""
            }*/
        },
        show: async function () {
            document.getElementById('tbuttonholder').className = "tbuttonholder_locked"
            overpainelm.className = "overpain_active"
            setTimeout(() => { searchput.focus(); searchput.select() }, 100);
            searchput.style.display = "block";
            document.getElementById('main_library_view').style.filter = `blur(${config.background_blur}px)`;
            //document.getElementById('searchbox').style.width = `calc(100% - 15rem + ${config.background_blur})`;
        },
    },
    blurse: async function () {
        backgroundmaskimg.style.filter = `blur(${config.background_blur}px)`;
        /*repeatbtn.style.filter = `blur(${config.background_blur}px)`;
        playbtn.style.filter = `blur(${config.background_blur}px)`;
        nextbtn.style.filter = `blur(${config.background_blur}px)`;
        previousbtn.style.filter = `blur(${config.background_blur}px)`;
        shufflebtn.style.filter = `blur(${config.background_blur}px)`;*/
    },
    unblurse: async function () {
        backgroundmaskimg.style.filter = `blur(0)`;
        /*repeatbtn.style.filter = `blur(0)`;
        playbtn.style.filter = `blur(0)`;
        nextbtn.style.filter = `blur(0)`;
        previousbtn.style.filter = `blur(0)`;
        shufflebtn.style.filter = `blur(0)`;*/
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


/* Rework to be a module */

let folders = [];

async function first_settup() {
    document.getElementById('first_setup_screen').style.display = "block";//hide first settup screen
    document.getElementById('first_finish_btn').addEventListener('click', function () {//finish button in first settup screen
        main.set.musicfolders(folders);//save selected music folders
        document.getElementById('first_setup_screen').style.display = "none";//hide first settup screen
        maininitalizer();
    })
    buildfirst_folders()

    function buildfirst_folders() {//rempresent selected folders
        document.getElementById('first_setup_folders').innerHTML = ""

        for (let i = 0; i < folders.length; i++) {
            individual_folder(i);
        }
        //folders.forEach(folder => { individual_folder(folder) })

        function individual_folder(index) {
            let parsed_folder = path.parse(folders[index])

            let folder_first = document.createElement('div')
            folder_first.classList = "folder_first"
            folder_first.title = folders[index];
            let first_icon = document.createElement('div')
            first_icon.classList = "first_icon"
            let first_title = document.createElement('div')
            first_title.classList = "first_title"

            if (parsed_folder.name == "") {//root drive on windows
                first_title.innerText = folders[index];
                first_title.style.color = 'rgb(255,0,0)';
                folder_first.title = 'Scanning whole drives not recommended';
            } else {
                first_title.innerText = parsed_folder.name;
            }

            let first_select_cancel_btn = document.createElement('div')
            first_select_cancel_btn.classList = "first_select_cancel_btn"
            first_select_cancel_btn.title = "Remove"

            first_select_cancel_btn.addEventListener('click', function () {
                console.log(folders)
                console.log('Removing first folder: ', index)
                folders.splice(index, 1);//yeets the index i and closes the hole left behind
                buildfirst_folders()
            })

            folder_first.appendChild(first_select_cancel_btn)
            folder_first.appendChild(first_title)
            folder_first.appendChild(first_icon)
            document.getElementById('first_setup_folders').appendChild(folder_first)
        }

        //build add new folder functionality
        var addnew_first = document.createElement('div')
        addnew_first.classList = "folder_first"
        addnew_first.title = " click to add new folders, you can select more than one";
        var first_icon = document.createElement('div')
        first_icon.classList = "folder_add_new"
        var first_title = document.createElement('div')
        first_title.classList = "first_title"
        first_title.innerHTML = "Add folders"

        addnew_first.appendChild(first_title)
        addnew_first.appendChild(first_icon)
        document.getElementById('first_setup_folders').appendChild(addnew_first)
        addnew_first.addEventListener('click', function () {//click add new button
            dialog.showOpenDialog({//dialog in directory selection mode
                buttonLabel: 'Select music folder',
                properties: ['openDirectory', 'multiSelections'],
            }).then((filepath) => {//get filepaths
                console.log(filepath.filePaths)
                filepath.filePaths.forEach(mpath => { folders.push(mpath) })//push them into temporary local folder variable
            }).finally(() => { buildfirst_folders() })//rebuild folders with new data
        })
    }
}