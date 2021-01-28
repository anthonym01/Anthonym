const { ipcRenderer, remote } = require('electron');
const main = remote.require('./main');//access export functions in main
const { dialog, Menu, MenuItem, nativeTheme, clipboard, shell } = remote;
const fs = require('fs');//file system
const path = require('path');//path
const wallpaper = require('wallpaper');//Desktop wallpaper
const my_website = 'https://anthonym01.github.io/Portfolio/?contact=me';//my website
const util = require('util');
const mm = require('music-metadata');
//const {Howl, Howler} = require('howler');

//  Taskbar buttons for frameless window
document.getElementById('x-button').addEventListener('click', function () { main.x_button() })
document.getElementById('maximize-button').addEventListener('click', function () { main.maximize_btn() })
document.getElementById('minimize-button').addEventListener('click', function () { main.minimize_btn() })

const playbtn = document.getElementById('playbtn');
const nextbtn = document.getElementById('nextbtn');

window.addEventListener('load', function () {//window loads
    console.log('Running from:', process.resourcesPath)
    create_body_menu()
    //create_text_menus()
    console.log('System preference Dark mode: ', nativeTheme.shouldUseDarkColors)//Check if system is set to dark or light

    if (localStorage.getItem("Anthonymcfg")) { config.load() }
    player.initalize()
    UI.initalize()
    maininitalizer()
})

function maininitalizer() {//Used to start re-startable app functions
    console.log('main initalizer')
}

async function create_text_menus() {
    const text_box_menu = new Menu.buildFromTemplate([//Text box menu (for convinience)
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { role: 'seperator' },
        { role: 'undo' },
        { role: 'redo' },
    ]);
    //add events to text boxes
    textbox.addEventListener('contextmenu', (event) => popupmenu, false)

    //Popup the menu in this window
    function popupmenu(event) {
        event.preventDefault()
        event.stopPropagation()
        text_box_menu.popup({ window: require('electron').remote.getCurrentWindow() })
    }
}

async function create_body_menu() {
    const menu_body = new Menu.buildFromTemplate([//Main body menu
        { role: 'reload' },
        { label: 'Refresh Library', click() { player.getfiles(main.get.musicfolders()); maininitalizer() } },
        { label: 'Contact developer', click() { shell.openExternal(my_website) } },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'resetZoom' },
        { role: 'zoomOut' },
    ]);

    Menu.setApplicationMenu(menu_body)

    window.addEventListener('contextmenu', (e) => {//Body menu attached to window
        e.preventDefault();
        menu_body.popup({ window: remote.getCurrentWindow() })//popup menu
    }, false);
}

window.addEventListener('keydown', function (e) {//keyboard actions
    console.log(e.key)
})

let config = {
    data: {//application data
        key: "Anthonymcfg",
    },
    save: async function () {//Save the config file
        console.table('Configuration is being saved', config.data)
        var stringeddata = JSON.stringify(config.data)
        localStorage.setItem("Anthonymcfg", stringeddata)
        main.write_alt_storage_location(stringeddata)
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
                    config.data = fileout;
                    console.warn('configuration applied from file')
                } else {//no key, not correct file, load from application storage
                    console.warn('The file is not a config file, internal configuration will be used')
                    config.data = JSON.parse(localStorage.getItem("Anthonymcfg"))
                }
            } else {//file does not exist, was moved, deleted or is inaccesible
                config.data = JSON.parse(localStorage.getItem("Anthonymcfg"))
                alert("file does not exist, was moved, deleted or is otherwise inaccesible, please select a new location to save app data ")
                config.selectlocation();
            }
        } else {//load from application storage
            config.data = JSON.parse(localStorage.getItem("Anthonymcfg"))
            console.log('config Loaded from application storage')
        }

        console.table(config.data)
    },
    delete: function () {//Wjipe stowage
        localStorage.clear("Anthonymcfg")//yeet storage key
        main.set.alt_location(false)
        main.set.musicfolders([])
        config.save()
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
                main.write_file(filepath.filePath, JSON.stringify(config.data))//hand off writing the file to main process
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
                            config.data = fileout
                            config.save();
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
        var alt_location = main.get.alt_location()
        if (alt_location != false) {
            var altpath = dialog.showOpenDialog({ properties: ['createDirectory', 'openDirectory'], defaultPath: alt_location })
        } else {
            var altpath = dialog.showOpenDialog({ properties: ['createDirectory', 'openDirectory'], })
        }

        await altpath.then((altpath) => {
            if (altpath.canceled == true) {//user canceled dialogue
                main.set.alt_location(false)
            } else {
                console.warn('Alternate configuration path :', altpath.filePaths[0])

                main.set.alt_location(altpath.filePaths[0])

                if (fs.existsSync(altpath + "/Anthonymcfg config.json")) {//config file already exist there
                    config.load()
                } else {//no config file exist there
                    config.save();
                }
            }
        }).catch((err) => {
            main.set.alt_location(false)
            alert('An error occured ', err.message)
        })
    },
}

let player = {//Playback control
    files: [],//path and other details of song files
    playlists: [],//playlist files and details
    queue: [],//Play queue randomized from playlist/library
    stream1: null,//
    stream2: null,//
    playstate: false,//is (should be) playing music
    now_playing: null,//Song thats currently playing
    initalize: async function () {
        player.getfiles(main.get.musicfolders())

        //  Play\pause button
        playbtn.addEventListener('click', function () {
            console.log('Pause button Pressed')
            player.play()
        })
        ipcRenderer.on('tray_play_pause', () => { player.play() })//listening on channel 'tray_play_pause'

        //  Next button
        nextbtn.addEventListener('click', function () {
            console.log('next button Pressed')
            player.next()
        })
        ipcRenderer.on('tray_next', () => { player.next() })//listening on channel 'tray_next'

        //  Previous button
        document.getElementById('previousbtn').addEventListener('click', function () {
            console.log('Previous button Pressed')
            player.previous()
        })
        ipcRenderer.on('tray_previous', () => { player.previous() })//listening on channel 'tray_previous'

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
                    } else {//file to handle

                        switch (path.parse(fullfilepath).ext) {//check file types

                            case ".mp3": case ".m4a": case ".mpeg": case ".opus": case ".ogg": case ".oga": case ".wav":
                            case ".aac": case ".caf": case ".m4b": case ".mp4": case ".weba":
                            case ".webm": case ".dolby": case ".flac": //playable as music files
                                player.files.push(player.strip_file_details(fullfilepath));
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
        player.build_library();//make after get of files, get of files must be async
    },
    build_library: function () {
        document.getElementById('main_library_view').innerHTML = "";

        for (let fileindex in player.files) { buildsong(fileindex) }
        //player.files.forEach(file => { buildsong(file) })

        async function buildsong(fileindex) {
            var song_bar = document.createElement('div')
            song_bar.classList = "song_bar"
            song_bar.innerHTML = player.files[fileindex].filename;
            song_bar.title = `Play ${player.files[fileindex].filename}`
            document.getElementById('main_library_view').appendChild(song_bar)
            song_bar.addEventListener('click', function () {//hand source to player
                player.play(fileindex)
            })
            fillmetadata(song_bar,fileindex)
        }
        async function fillmetadata(eliment,fileindex){
            var songicon = document.createElement("img")
            songicon.classList= "songicon"
            //set meta properties
            const metadata = await mm.parseFile(player.files[fileindex].path);
            //console.log(metadata)
            const picture = mm.selectCover(metadata.common.picture)
            if (typeof (picture) != 'undefined' && picture != null) {
                songicon.src = `data:${picture.format};base64,${picture.data.toString('base64')}`;
            } else {
                //use placeholder image
                songicon.src = "img/vinyl-record-pngrepo-com-white.png"
            }
            eliment.appendChild(songicon)
        }
    },
    strip_file_details: function (pamth) {//get metadata from music files
        let filename = path.parse(pamth).name;
        return { filename: filename, path: pamth }
    },
    play: async function (fileindex) {
        /* If something is playing resumes playback,
        if nothing is playing plays from the player.files[fileindex],
        if no fileindex assumes playback of the last song, if no last song, unloads playr
        */

        if (player.playstate != false) {//if is playing something
            if (fileindex == undefined) {//pause playback
                player.pause()
                return 0;
            } else {
                if (fileindex != player.now_playing) {
                    player.stream1.unload();//unlock the stream thats gonna be used
                }
            }
        } else {
            if (fileindex == player.now_playing) {
                player.stream1.play()
                console.log('resume : ', player.files[player.now_playing].path);
                return 0;
            }
        }

        if (fileindex == undefined && player.now_playing != null) {
            player.stream1.play()
            console.log('resume : ', player.files[player.now_playing].path);
            return 0;
        }

        if (fileindex == player.now_playing) {
            if (player.playstate == true) {
                player.pause()
            } else {
                player.stream1.play()
            }
            return 0;
        }

        console.log('Attempt to play: ', player.files[fileindex].path);

        player.stream1 = new Howl({
            src: player.files[fileindex].path,//takes an array, or single path
            autoplay: true,
            loop: false,
            volume: 1,
            preload: true,
            onend: function () {//Playback ends
                console.log('Finished playing', player.files[fileindex].path);
                player.playstate = false;
            },
            onplayerror: function () {//Playback fails
                console.warn('fail to play ', player.files[fileindex])
                stream1.once('unlock', function () {//wait for unlock
                    player.play(fileindex);// try to play again
                });
            },
            onload: function () {
                player.stream1.play()//play the sound that was just loaded
            },
            onplay: async function () {
                //playback of loaded song file sucessfull
                player.playstate = true;//now playing and play pause functionality
                player.now_playing = fileindex;

                //set meta properties
                const metadata = await mm.parseFile(player.files[fileindex].path);
                console.log(metadata)
                //console.log(util.inspect(metadata, { showHidden: false, depth: null }));

                const picture = mm.selectCover(metadata.common.picture)
                if (typeof (picture) != 'undefined' && picture != null) {
                    console.log('Cover art info: ', picture)
                    document.getElementById('coverartsmall').src = `data:${picture.format};base64,${picture.data.toString('base64')}`;
                    document.getElementById('coverartsmall').name = "notvibecat"
                } else {
                    //use placeholder image
                    document.getElementById('coverartsmall').src = "img/memes/Cats/vib cat.gif"
                    document.getElementById('coverartsmall').name = "vibecat"
                }


                ipcRenderer.send('Play_msg', player.files[fileindex].filename, 'pause')//Send file name of playing song to main
                document.getElementById('songTitle').innerHTML = player.files[fileindex].filename;

                playbtn.classList = "pausebtn"
                playbtn.title = "pause"
                document.getElementById('titlcon').classList = "titlcon_active"
                console.log('Playing: ', player.files[fileindex]);
            }
        });

    },
    pause: function () {
        console.log('Pause functionaliy');
        if (player.playstate != false) {
            player.stream1.pause()
            player.playstate = false;
            playbtn.classList = "playbtn"
            playbtn.title = "play"
            document.getElementById('titlcon').classList = "titlcon"
            if (document.getElementById('coverartsmall').name == "vibecat") {
                document.getElementById('coverartsmall').src = "img/memes/Cats/sad kajit.png"
            }
            ipcRenderer.send('Play_msg', player.files[player.now_playing].filename, 'Play');
        } else {//assume error
            console.warn('Tried pause functionality with no playback');
        }
    },
    next: function () {//Play next song in que if any
        console.log('Play Next')
    },
    previous: function () {
        console.log('Play Previous')
    },
    mute: function () {
        if (player.stream1.mute == true) {
            player.stream1.mute(false)
        } else {
            player.stream1.mute(true)
        }
    },
    display_metadata: async function () {

    }
}

let UI = {
    initalize: function () {

    },
    settings: {

    },
    get_desktop_wallpaper: async function () {
        wallpaper.get().then((wallpaperpath) => {//gets desktop wallpaper
            if (path.parse(wallpaperpath).ext !== undefined) {//check if file is usable
                //use desktop wallpaper
                wallpaperpath = wallpaperpath.replace(/\\/g, '/');// replace all \\ with /
                console.log('Got desktop wallpaper: ', wallpaperpath)
                return wallpaperpath;
            } else {
                console.log('Failed to get desktop wallpaper')
                return 0;
            }
        }).catch((err) => {
            console.warn('wallpaper error ', err)
            return err;
        })
    },

}
