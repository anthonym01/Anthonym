const { ipcRenderer, remote, Main } = require('electron');
const main = remote.require('./main');//access export functions in main
const { dialog, Menu, MenuItem, nativeTheme, clipboard, shell } = remote;

const fs = require('fs');//file system
const path = require('path');//path
const wallpaper = require('wallpaper');//Desktop wallpaper

const my_website = 'https://anthonym01.github.io/Portfolio/?contact=me';//my website
//const { Howl, Howler } = require('howler');




window.addEventListener('load', function () {//window loads
    console.log('Running from:', process.resourcesPath)
    create_body_menu()
    create_text_menus()
    player.getfiles(main.get.musicfolders())

    console.log('System preference Dark mode: ', nativeTheme.shouldUseDarkColors)//Check if system is set to dark or light

    if (localStorage.getItem("Anthonymcfg")) {//check if storage has the item
        config.load()
        player.getfiles(main.get.musicfolders())
        maininitalizer()
    }

    if (main.get.musicfolders().length < 1) { first_settup() }
})

function maininitalizer() {//Used to start re-startable app functions
    console.log('main initalizer')
}

//text box menus
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

//Body menu
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

let config = {//Application configuration object
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
    files: [],//array filled with music files
    playlist_files: [],
    playlists: [],
    queue: [],//Play queue randomized from playlist/library
    stream1: null,//For howler to use
    playstate: false,//is (should be) playing music
    now_playing: null,
    getfiles: async function (muzicpaths) {//gets files form array of music folder paths
        console.log('Searching directory: ', muzicpaths)

        muzicpaths.forEach(folder => {//for each folder in the array
            fs.readdir(folder, function (err, files) {//read the files within the directory

                if (err) { console.warn('File error', err) }//error accessing directory due to it not existing or locked permissions

                files.forEach(filel1 => {//for each file in this folder
                    var parsedfilel1 = path.parse(path.join(folder, filel1))

                    switch (parsedfilel1.ext) {//check file types
                        case ".mp3": case ".m4a": case ".mpeg": case ".opus": case ".ogg": case ".oga": case ".wav":
                        case ".aac": case ".caf": case ".m4b": case ".mp4": case ".weba":
                        case ".webm": case ".dolby": case ".flac":
                            //playable as music files
                            player.files.push(player.strip_file_details(path.join(folder, filel1)));
                            break;
                        case ""://Subfolder to search
                            if (parsedfilel1.base.slice(0, 1) != "." && parsedfilel1.ext == "") {//.files are a files with no extension
                                player.getfiles([path.join(folder, filel1)]);
                            }
                            break;
                        case ".m3u"://playlist file
                            player.playlist_files.push(path.join(folder, filel1));
                            break;
                        default: console.warn('Cannot handle (not supported): ', path.join(folder, filel1));//not supported music file
                    }
                })
            })
        })
        player.build_library();
    },
    play: function (fileindex) {
        /* If something is playing resumes playback,
        if nothing is playing plays from the player.files[fileindex],
        if not fileindex assumes playback of the last song
        */
        console.log('Playing: ', player.files[fileindex]);
        if (player.playstate != false) {//is playing something
            if (fileindex == undefined) {
                player.pause()
                return 0;
            } else {
                player.stream1.unload();
            }
        }
        if (fileindex == undefined && player.now_playing != null) {
            player.stream1.play()
            return 0;
        }
        player.stream1 = new Howl({
            src: player.files[fileindex].path,//takes an array, or single path
            autoplay: true,
            loop: false,
            volume: 1,
            onend: function () {//Playback ends
                console.log('Finished playing', player.files[fileindex]);
                player.playstate = false;
            },
            onplayerror: function () {//Playback fails
                stream1.once('unlock', function () {//wait for unlock
                    player.play(fileindex);// try to play again
                });
            },
            onplay: function () {//playback of loaded song file sucessfull
                player.playstate = true;//now playing and play pause functionality
                player.now_playing = fileindex;
            }
        });

        player.stream1.play()//play the sound that was just loaded

        ipcRenderer.send('Play_msg', player.files[fileindex].filename)//Send file name of playing song to main

        document.getElementById('songTitle').innerHTML = player.files[fileindex].filename;

    },
    pause: function () {
        console.log('Pause functionaliy');
        if (player.playstate != false) {
            player.stream1.pause()
            player.playstate = false;
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
    build_library: function () {
        console.log('Building main library from', config.data.music_folders)
        document.getElementById('main_library_view').innerHTML = "";

        for (let fileindex in player.files) { buildsong(fileindex) }
        //player.files.forEach(file => { buildsong(file) })

        function buildsong(fileindex) {
            var song_bar = document.createElement('div')
            song_bar.classList = "song_bar"
            song_bar.innerHTML = player.files[fileindex].filename;
            song_bar.title = player.files[fileindex].filename;

            document.getElementById('main_library_view').appendChild(song_bar)
            song_bar.addEventListener('click', function () {//hand source to player
                player.play(fileindex)
            })
        }
    },
    strip_file_details: function (pamth) {//get metadata from music files
        let filename = path.parse(pamth).name;
        return { filename: filename, path: pamth }
    }
}

let UI = {
    initalize: function () {

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

//  Play\pause button
document.getElementById('playbtn').addEventListener('click', function () {
    console.log('Pause button Pressed')
    player.play()
})
ipcRenderer.on('tray_play_pause', () => { player.play() })//listening on channel 'tray_play_pause'

//  Next button
document.getElementById('nextbtn').addEventListener('click', function () {
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

//  Taskbar buttons for frameless windows
document.getElementById('x-button').addEventListener('click', function () { main.x_button() })
document.getElementById('maximize-button').addEventListener('click', function () { main.maximize_btn() })
document.getElementById('minimize-button').addEventListener('click', function () { main.minimize_btn() })