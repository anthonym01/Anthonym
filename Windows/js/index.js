/*
    By samuel A. Matheson
    samuelmatheson20@gmail.com
*/

//dependancys, dont add howler
const { ipcRenderer, remote, clipboard } = require('electron');
const main = remote.require('./main');//access export functions in main
const { dialog, Menu, MenuItem, nativeTheme, systemPreferences, shell } = remote;
const fs = require('fs');
const path = require('path');
const wallpaper = require('wallpaper');
/*System wallpaper loactions
/home/samuel/.local/share/wallpapers

*/
const mm = require('music-metadata');
const { Howler } = require('howler');
const thumbnailjs = require('thumbnail-js');
const NodeID3 = require('node-id3');

//const {Howl, Howler} = require('howler');

const my_website = 'https://anthonym01.github.io/Portfolio/?contact=me';//my website
const playbtn = document.getElementById('playbtn');
const nextbtn = document.getElementById('nextbtn');
const previousbtn = document.getElementById('previousbtn');
const main_library_view = document.getElementById('main_library_view');
const song_progress_bar = document.getElementById('song_progress_bar');
const backgroundmaskimg = document.getElementById('backgroundmaskimg');
const backgroundvideo = document.getElementById('backgroundvideo');
const mainmaskcontainer = document.getElementById('mainmaskcontainer');
const Menupannel_main = document.getElementById('Menupannel_main');
const repeatbtn = document.getElementById('repeatbtn');
const shufflebtn = document.getElementById('shufflebtn');
const searchput = document.getElementById('searchput');


let looking = [];//looking timers, only search after stopped typing

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

    if (localStorage.getItem("Anthonymcfg")) { config_manage.load() }
    UI.initalize()
    player.initalize()
    maininitalizer()
})

window.addEventListener('keydown', function (e) {//keyboard actions
    switch (e.key) {
        case " ": case "p": case "enter": e.preventDefault(); player.play(); break;
        case "f": e.preventDefault(); UI.show_search(); break;
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
    background_blur: 2,//pixels
    last_played: 0,
    animations: true,
    shuffle: false,
    playbar_icons: true,
    video_icons: true,
    repeat: 1,//0 no repeat, 1 repeat all, 2 replay current song
    favourites: ["I can be the one"]
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

        setTimeout(async () => {
            //last palyed song
            player.play(config.last_played, false);
            player.pause();
            window.location.href = `#${config.last_played - 2}`;
        }, 500);

        document.getElementById('coverartsmall').addEventListener('click', function () { player.scroll_to_current() })

        //searchput
        searchput.addEventListener('keydown', function (e) {//keyboard actions
            e.stopImmediatePropagation();
            //setTimeout(() => {
            //console.log(this.value)
            player.lookup(this.value);
            //}, 0);
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
        let mp4count = 0;
        player.files = [];
        if (main.get.musicfolders() == [] || main.get.musicfolders() == undefined || main.get.musicfolders() < 1) {
            first_settup()//run first settup
        } else {
            await getfiles(main.get.musicfolders())//wait for recursive file checks
            setTimeout(() => { build_library() }, 0)//imediatly after file checks
            var hold = setInterval(() => {
                if (main_library_view.childElementCount < player.files.length) {
                    build_library()
                    console.warn('recheck library');

                    //warn the bokens
                    if (process.platform == 'win32') {

                        UI.notify.new(
                            'Slow file access',
                            'took more than 10ms to gain acces to files, this could be due to another application such as a antivirus or a cloud storage providor using those files'
                        );

                    } else {

                        UI.notify.new(
                            'Slow file access',
                            'took more than 10ms to gain acces to files, this could be due to the way your OS handles files on that drive, the drive may be slow, your cpu curve could be set to conserve power, or another application could be using that disk heavily'
                        );

                    }
                } else {
                    clearInterval(hold)
                }
            }, 1000);//retry over and over, again and again-gen
        }

        async function getfiles(muzicpaths) {//gets files form array of music folder paths
            console.log('Searching directory: ', muzicpaths)

            muzicpaths.forEach(folder => {//for each folder in the array

                fs.readdir(folder, function (err, files) {//read the files within the directory
                    try {
                        if (err) { throw err }
                        files.forEach(file => {//for each file in the folder

                            var fullfilepath = path.join(folder, file);
                            if (fs.statSync(fullfilepath).isDirectory()) {//sud-directory to search
                                getfiles([fullfilepath]);
                                return 0;
                            } else {//file to handle

                                switch (path.parse(fullfilepath).ext) {//check file types
                                    case ".mp4": mp4count++;
                                    case ".mp3": case ".mpeg": case ".opus": case ".ogg": case ".oga": case ".wav":
                                    case ".aac": case ".caf": case ".m4b": case ".m4v": case ".weba":
                                    case ".webm": case ".dolby": case ".flac": //playable as music files
                                        player.files.push({ filename: path.parse(fullfilepath).name, path: fullfilepath });
                                        break;

                                    case ".m3u": case ".pls": case ".xml"://playlist files {M3U , plain text PLS Audio Playlist , XML Shareable Playlist Format}
                                        player.playlists.push({ path: fullfilepath });
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

            for (let fileindex in player.files) { buildsong(fileindex) }
            songTitle.innerText = "Ready to Vibe";
            function buildsong(fileindex) {
                var song_bar = document.createElement('div');
                song_bar.classList = "song_bar";
                song_bar.id = fileindex;
                var song_title = document.createElement('div')
                song_title.className = "song_title";
                song_title.innerHTML = player.files[fileindex].filename;
                song_bar.title = `Play ${player.files[fileindex].filename}`;
                song_bar.appendChild(song_title);
                main_library_view.appendChild(song_bar);
                functionality(song_bar, fileindex);
                setTimeout(async () => { fillmetadata(song_bar, fileindex, song_title) }, fileindex * 5);

            }

            async function fillmetadata(eliment, fileindex, song_title) {//set meta properties
                try {
                    var song_duration = document.createElement('div')
                    song_duration.className = "song_duration"
                    mm.parseFile(player.files[fileindex].path, { duration: false }).then(async (metadata) => {

                        //metadata song title
                        if (metadata.common.title != undefined) { song_title.innerHTML = metadata.common.title }

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
                        if (path.extname(player.files[fileindex].path) == ".mp4" && mp4count < 200) {
                            setTimeout(() => {
                                thumbnailjs.getVideoThumbnail(player.files[fileindex].path, 1, 0.1, "image/jpg").then((thumnaildata) => {
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
                        click() { player.play(fileindex); }
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
                    {
                        label: "edit tags",
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
        }

    },
    play: async function (fileindex, load) {
        /* If something is playing resumes playback,
        if nothing is playing plays from the player.files[fileindex],
        if no fileindex assumes playback of the last song, if no last song, unloads playr
        */
        console.log('Attempt to play: ', fileindex);

        //UI.hide_search();

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
                console.log('resume : ', player.files[player.now_playing].path);
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
            //await player.stream1.unload();//unlock the stream thats gonna be used
            //Howler.unload()
            /*backgroundvideo.src = "";
            backgroundvideo.style.display = "none"*/
        }

        try {
            //await player.stream1.unload();//unlock the stream thats gonna be used
            Howler.unload()//unload playing track if any

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
                    config_manage.save();
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
            player.stop_seeking();
            player.playstate = false;//stop playstate 
            navigator.mediaSession.playbackState = "paused";
            playbtn.classList = "playbtn";
            playbtn.title = "play";
            ipcRenderer.send('Play_msg', player.files[player.now_playing].filename, 'Play');
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
            nextsong = rand_number(player.files.length - 1, 0, player.now_playing);
        } else {
            nextsong = player.files[player.now_playing + 1] ? Number(player.now_playing + 1) : 0;
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
            song_progress_bar.max = player.files[player.now_playing].duration;
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
        navigator.mediaSession.setActionHandler('stop', function () { console.log('External stop command') });
        navigator.mediaSession.setActionHandler('seekbackward', function () { });
        navigator.mediaSession.setActionHandler('seekforward', function () { });
        //navigator.mediaSession.setActionHandler('shuffle', function () { });
        navigator.mediaSession.setActionHandler('seekto', function () { });
        navigator.mediaSession.setActionHandler('previoustrack', function () { console.log('External previous command'); player.previous() });
        navigator.mediaSession.setActionHandler('nexttrack', function () { console.log('External next command'); player.next() });

        /* pull file data */
        const metadata = await mm.parseFile(player.files[fileindex].path);
        console.log(metadata)
        document.getElementById('songTitle').innerText = metadata.common.title ? metadata.common.title : player.files[fileindex].filename;
        document.getElementById('songArtist').innerText = metadata.common.artist ? `by ${metadata.common.artist}` : "unknown";

        //picture
        const picture = mm.selectCover(metadata.common.picture) || undefined;
        const processed_picture = picture ? `data:${picture.format};base64,${picture.data.toString('base64')}` : './img/icon.png';
        if (typeof (picture) != 'undefined' && picture != undefined) {
            console.log('Cover art info: ', picture)
            document.getElementById('coverartsmall').src = processed_picture;
            backgroundmaskimg.src = processed_picture;
            backgroundmaskimg.style.display = "block";

            //backgroundmaskimg.style.filter = `blur(${config.background_blur}px)`;
            repeatbtn.style.filter = `blur(${config.background_blur}px)`;
            playbtn.style.filter = `blur(${config.background_blur}px)`;
            nextbtn.style.filter = `blur(${config.background_blur}px)`;
            previousbtn.style.filter = `blur(${config.background_blur}px)`;
            shufflebtn.style.filter = `blur(${config.background_blur}px)`;

            if (document.getElementById('searchbox').style.display != "block") {//hide it if its not in use
                document.getElementById('tbuttonholder').className = "tbuttonholder"
            }

            if (config.background_blur == 0) {
                document.getElementById('songdetailcontainer').classList = "songdetailcontainer_alt";
            } else {
                document.getElementById('songdetailcontainer').classList = "songdetailcontainer";

            }


            //let imgscr = `data:${picture.format};base64,${picture.data.toString('base64')}`;
            //let imgscr = new Blob([picture.data], { type: picture.format });
            let imgscr = URL.createObjectURL(new Blob([picture.data], { type: picture.format }))

            ipcRenderer.send('new_icon', imgscr)
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

            repeatbtn.style.filter = `blur(0)`;
            playbtn.style.filter = `blur(0)`;
            nextbtn.style.filter = `blur(0)`;
            previousbtn.style.filter = `blur(0)`;
            shufflebtn.style.filter = `blur(0)`;

            document.getElementById('tbuttonholder').className = "tbuttonholder_locked"
            document.getElementById('songdetailcontainer').classList = "songdetailcontainer_alt";
            UI.get_desktop_wallpaper().then((wallpaperpath) => {
                mainmaskcontainer.style.backgroundImage = `url('${wallpaperpath}')`
            });
            navigator.mediaSession.metadata = new MediaMetadata({
                title: metadata.common.title || player.files[fileindex].filename,
                artist: metadata.common.artist || "unknown",
                //artist: metadata.common.artist ? metadata.common.artist : "unknown",
                album: metadata.common.album || "unknown",
                //album: metadata.common.album ? metadata.common.album : "unknown",
            });
        }
        if (backgroundvideo.style.display == "block") { document.getElementById('tbuttonholder').className = "tbuttonholder" }

        //notification if hidden
        if (remote.getCurrentWindow().isFocused() == false || remote.getCurrentWindow().isVisible() != true) {
            const playnotification = new Notification(
                `${metadata.common.title || player.files[fileindex].filename}`,
                {
                    body: `Playing ${metadata.common.title || player.files[fileindex].filename} by ${metadata.common.artist || "unknown"}`,
                    icon: processed_picture,
                    image: './img/icon.png',
                    silent: true,
                }
            );
            playnotification.onclick = () => {
                console.log('Notification clicked')
                main.Show_window()
            }
        }

    },
    lookup: async function (pattern) {//match any pattern to local file name
        console.log('Look for ', pattern)


        for (let i in looking) { clearInterval(looking.pop()) }//prevent rappid researching

        let lookafor = setTimeout(() => {

            if (pattern == "") {
                return "empty"
            } else {
                document.getElementById('searchbox').innerHTML = ""
            }

            for (let fileindex in player.files) {
                if (player.files[fileindex].filename.toLowerCase().search(pattern.toLowerCase()) != -1) { buildsong(fileindex) }
            }

            function buildsong(fileindex) {
                var song_bar = document.createElement('div');
                song_bar.classList = "song_bar";
                var song_title = document.createElement('div')
                song_title.className = "song_title";
                song_title.innerHTML = player.files[fileindex].filename;
                song_bar.title = `Play ${player.files[fileindex].filename}`;
                song_bar.appendChild(song_title);
                document.getElementById('searchbox').appendChild(song_bar);
                functionality(song_bar, fileindex);
                setTimeout(async () => { fillmetadata(song_bar, fileindex, song_title) }, fileindex * 2);

            }
        }, 500);
        looking.push(lookafor)

        /*if (looking != true) {//prevent rapid researching
            looking = true
        }*/


        async function fillmetadata(eliment, fileindex, song_title) {//set meta properties
            try {
                var song_duration = document.createElement('div')
                song_duration.className = "song_duration"
                mm.parseFile(player.files[fileindex].path, { duration: false }).then(async (metadata) => {

                    //metadata song title
                    if (metadata.common.title != undefined) { song_title.innerHTML = metadata.common.title; }

                    //file duration
                    song_duration.title = `${metadata.format.duration} seconds`;
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

            eliment.addEventListener('click', function () {
                player.play(fileindex);
                setTimeout(() => { window.location.href = `#${player.now_playing - 2}` }, 300);

            })//click to play
        }
    },
    lift_coverart: async function (fileindex) {
        try {

            if (path.extname(player.files[fileindex].path) == ".mp4") {
                console.warn('mp4 file detected')

                thumbnailjs.getVideoThumbnail(player.files[fileindex].path, 1, 3, "image/jpg").then((thumnaildata) => {
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
            if (document.getElementById('searchbox').style.display == "block") {//hide it
                UI.hide_search()
            } else {//show it
                UI.show_search()
            }
        })

        document.getElementById('Menupannel_main').addEventListener('mouseenter', function () { UI.hide_search() })
        document.getElementById('main_library_view').addEventListener('mouseenter', function () { UI.hide_search() })
        document.getElementById('Playbar').addEventListener('mouseenter', function () { UI.hide_search() })
        document.getElementById('setting_view').addEventListener('mouseenter', function () { UI.hide_search() })

        //background blur
        backgroundmaskimg.style.filter = `blur(${config.background_blur}px)`;
        document.getElementById('background_blur_put').value = config.background_blur;
        document.getElementById('background_blur_put').addEventListener('change', function () {
            let puts = this.value;
            backgroundmaskimg.style.filter = `blur(${puts}px)`;
            repeatbtn.style.filter = `blur(${puts}px)`;
            playbtn.style.filter = `blur(${puts}px)`;
            nextbtn.style.filter = `blur(${puts}px)`;
            previousbtn.style.filter = `blur(${puts}px)`;
            shufflebtn.style.filter = `blur(${puts}px)`;
            config.background_blur = puts;
            config_manage.save()
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
    hide_search: async function () {
        //if (searchput.value != "" || document.getElementById('searchbox').style.display == "block") {
        if (backgroundmaskimg.style.display == "none" && backgroundvideo.style.display == "none") {
            document.getElementById('tbuttonholder').className = "tbuttonholder_locked"
        } else {
            document.getElementById('tbuttonholder').className = "tbuttonholder"
        }
        searchput.style.display = ""
        document.getElementById('searchbox').style.display = ""

        document.getElementById('main_library_view').style.filter = ""
        document.getElementById('searchbox').style.width = ""
        /*} else {

            document.getElementById('tbuttonholder').className = "tbuttonholder_locked"


            document.getElementById('searchbox').style.display = ""
        }*/
    },
    show_search: async function () {
        document.getElementById('tbuttonholder').className = "tbuttonholder_locked"
        document.getElementById('searchbox').style.display = "block"
        setTimeout(() => { searchput.focus(); searchput.select() }, 100);
        searchput.style.display = "block";
        document.getElementById('main_library_view').style.filter = `blur(${config.background_blur}px)`;
        document.getElementById('searchbox').style.width = `calc(100% - 15rem + ${config.background_blur})`;
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

function rand_number(max, min, cant_be) {
    let randowm = Math.floor(Math.random() * (max - min + 1)) + min;
    if (randowm == cant_be) {
        return rand_number(max, min, cant_be);
    } else {
        return randowm;
    }
}