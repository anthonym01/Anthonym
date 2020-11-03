const main = require('electron').remote.require('./main');//access export functions in main
const { dialog, Menu, MenuItem, nativeTheme, clipboard, shell } = require('electron').remote;
const { ipcRenderer } = require('electron');
const fs = require('fs');//file system
const path = require('path');
const wallpaper = require('wallpaper');
const my_website = 'https://anthonym01.github.io/Portfolio/?contact=me';
//const {Howl, Howler} = require('howler');

let slash;//slash for file path consistency in windows and linux
if (process.platform == 'win32') { slash = '\\' } else { slash = '/' }

//Taskbar buttons for frameless windows
document.getElementById('x-button').addEventListener('click', function () {//Frameless X button
    console.log('\'X\' Button clicked');
    main.x_button();
})
document.getElementById('maximize-button').addEventListener('click', function () {//Frameless maximize button
    console.log('Maximize Button clicked');
    main.maximize_btn()
})
document.getElementById('minimize-button').addEventListener('click', function () {//Frameless minimize button
    console.log('Minimize Button clicked');
    main.minimize_btn()
})

const text_box_menu = new Menu.buildFromTemplate([//Text box menu (for convinience)
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { role: 'selectAll' },
    { role: 'seperator' },
    { role: 'undo' },
    { role: 'redo' },
]);

const menu_body = new Menu.buildFromTemplate([//Main body menu
    { role: 'reload' },
    { label: 'Force refresh UI', click() { maininitalizer() } },
    { label: 'Contact developer', click() { shell.openExternal(my_website) } },
    { role: 'toggledevtools' },
    { type: 'separator' },
    { role: 'zoomIn' },
    { role: 'resetZoom' },
    { role: 'zoomOut' },
]);

window.addEventListener('contextmenu', (event) => {//Body menu attached to window
    event.preventDefault()
    menu_body.popup({ window: require('electron').remote.getCurrentWindow() })//popup menu
}, false);

window.addEventListener('load', function () {//window loads
    console.log('Running from:', process.resourcesPath)

    //textbox menus
    //textbox.addEventListener('contextmenu', (event) => popupmenu, false)
    //Popup the menu in this window
    /*function popupmenu(event) {
        event.preventDefault()
        event.stopPropagation()
        text_box_menu.popup({ window: require('electron').remote.getCurrentWindow() })
    }*/
    console.log('System preference Dark mode: ', nativeTheme.shouldUseDarkColors)//Check if system is set to dark or light

    if (localStorage.getItem("Anthonymcfg")) {//check if storage has the item
        document.getElementById('first_setup_screen').style.display = "none";//hide first settup screen
        config.load()
        if (config.data.music_folders.length < 1) {
            first_settup.start()
        } else {
            player.getfiles(config.data.music_folders)
            maininitalizer()
        }
    } else {
        config.validate()
        if (config.data.music_folders[0] == undefined) {//show first setup screen
            console.warn('no music folders')
            first_settup.start()
        }
    }
})

function maininitalizer() {//Used to start re-startable app functions
    console.log('main initalizer')
}

let config = {//Application configuration object
    baseconfig: {//base configuration
        use_alt_storage: false,
        alt_location: "",

    },
    data: {//application data
        key: "Anthonymcfg",
        music_folders: [],
        /*usecount: 0,*/
    },
    save: async function () {//Save the config file
        console.table('Configuration is being saved', config.data)

        ToStorageAPI();//save to application storage reguardless incase the file gets removed by the user, because users are kinda dumb
        if (config.baseconfig.use_alt_storage == true) {//save to alternate storage location
            ToFileSystem();
        }

        function ToFileSystem() {//save config to directory defined by the user
            console.log('saving to File system: ', config.baseconfig.alt_location)
            main.write_object_json_out(config.baseconfig.alt_location + "/Anthonymcfg config.json", JSON.stringify(config.data))//hand off writing the file to main process
        }

        function ToStorageAPI() {//Html5 storage API
            console.log('config saved to application storage')
            localStorage.setItem("Anthonymcfg", JSON.stringify(config.data))
        }
    },
    load: function () {//Load the config file
        console.warn('Configuration is being loaded')

        if (localStorage.getItem("Anthonymcfg_baseconfig")) {//load base config
            config.baseconfig = JSON.parse(localStorage.getItem("Anthonymcfg_baseconfig"))
        } else {
            //first startup
            localStorage.setItem("Anthonymcfg_baseconfig", JSON.stringify(config.baseconfig))
        }

        if (config.baseconfig.use_alt_storage == true) {//Load from alt location
            //load from alternate storage location
            if (fs.existsSync(config.baseconfig.alt_location.toString() + "/Anthonymcfg config.json")) {//Directory exists
                var fileout = fs.readFileSync(config.baseconfig.alt_location.toString() + "/Anthonymcfg config.json", { encoding: 'utf8' })//Read from file with charset utf8
                console.warn('config Loaded from: ', config.baseconfig.alt_location.toString(), 'Data from fs read operation: ', fileout)
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
        this.validate()
    },
    validate: function () {//validate configuration
        console.warn('Config is being validated')
        var configisvalid = true

        if (typeof (config.data.music_folders) == 'undefined' || typeof (config.data.music_folders) != 'object') {//array is type of object
            config.data.music_folders = []
            configisvalid = false
            console.log('"music_folders" did not exist and was set to default')
        }

        if (!configisvalid) {
            console.log('config was found to be invalid and will be overwritten')
            this.save()//Save new confog because old config is no longer valid
        } else { console.log('config was found to be valid') }

    },
    delete: function () {//Wjipe stowage
        localStorage.clear("Anthonymcfg")//yeet storage key
        config.usedefault();//use default location
        console.log('config deleted: ')
        console.table(config.data)
        this.validate()
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
                main.write_object_json_out(filepath.filePath, JSON.stringify(config.data))//hand off writing the file to main process
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
        if (config.baseconfig.alt_location != undefined) {
            var path = dialog.showOpenDialog({ properties: ['createDirectory', 'openDirectory'], defaultPath: config.baseconfig.alt_location.toString() })
        } else {
            var path = dialog.showOpenDialog({ properties: ['createDirectory', 'openDirectory'], defaultPath: null })
        }

        await path.then((path) => {
            if (path.canceled == true) {//user canceled dialogue
                config.usedefault()
            } else {
                console.warn('Alternate configuration path :', path.filePaths[0])

                config.baseconfig.use_alt_storage = true
                config.baseconfig.alt_location = path.filePaths[0]
                localStorage.setItem("Anthonymcfg_baseconfig", JSON.stringify(config.baseconfig))//save base config

                if (fs.existsSync(config.baseconfig.alt_location.toString() + "/Anthonymcfg config.json")) {//config file already exist there
                    config.load()
                } else {//no config file exist there
                    config.save();
                }
            }
        }).catch((err) => {
            config.usedefault()
            alert('An error occured ', err.message)
        })
    },
    usedefault: function () {//use default storage location
        config.baseconfig.use_alt_storage = false
        localStorage.setItem("Anthonymcfg_baseconfig", JSON.stringify(config.baseconfig))//save base config
    },
}

let player = {//Playback control
    files: [],//array filled with music files
    playlist_files: [],
    playlists: [],
    queue: [],//Play queue randomized from playlist/library
    stream1: null,//For howler to use
    playstate: false,//is (should be) playing music
    now_playing:null,
    getfiles: async function (muzicpaths) {//gets files form array of music folder paths
        console.log('Searching directory: ', muzicpaths)

        muzicpaths.forEach(folder => {//for each folder in the array
            fs.readdir(folder + slash, function (err, files) {//read the files within the directory

                if (err) { console.warn('File error', err) }//error accessing directory due to it not existing or locked permissions

                files.forEach(filel1 => {//for each file in this folder
                    var parsedfilel1 = path.parse(folder + slash + filel1)

                    switch (parsedfilel1.ext) {//check file types
                        case ".mp3":
                        case ".m4a":
                        case ".mpeg":
                        case ".opus":
                        case ".ogg":
                        case ".oga":
                        case ".wav":
                        case ".aac":
                        case ".caf":
                        case ".m4b":
                        case ".mp4":
                        case ".weba":
                        case ".webm":
                        case ".dolby":
                        case ".flac"://playable as music file
                            player.files.push(player.strip_file_details(folder + slash + filel1, parsedfilel1));
                            break;
                        case ""://Subfolder to search
                            if (parsedfilel1.base.slice(0, 1) != "." && parsedfilel1.ext == "") {//.files are a files with no extension
                                player.getfiles([folder + slash + filel1]);
                            }
                            break;
                        case ".m3u"://playlist file
                            player.playlist_files.push(folder + slash + filel1);
                            break;
                        default: console.warn('Cannot handle (not supported): ', folder + slash + filel1);//not supported music file
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
        if(fileindex == undefined && player.now_playing!=null){
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
                player.now_playing=fileindex;
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
    strip_file_details: function (pamth, parsedpamth) {//get metadata from music files
        let filename = parsedpamth.name;
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

//First settup (need to fix, folder removal)
let first_settup = {
    folders: [],
    start: function () {
        document.getElementById('first_setup_screen').style.display = "block";//hide first settup screen
        document.getElementById('first_finish_btn').addEventListener('click', function () {//finish button in first settup screen
            config.data.music_folders = first_settup.folders;//save selected music folders
            document.getElementById('first_setup_screen').style.display = "none";//hide first settup screen
            config.save()
            player.getfiles();
            maininitalizer();
        })
        buildfirst_folders()

        function buildfirst_folders() {//rempresent selected folders
            document.getElementById('first_setup_folders').innerHTML = ""

            for (let i in first_settup.folders) {
                individual_folder(i);
            }
            //folders.forEach(folder => { individual_folder(folder) })

            function individual_folder(index) {
                let parsed_folder = path.parse(first_settup.folders[index] + slash)

                let folder_first = document.createElement('div')
                folder_first.classList = "folder_first"
                folder_first.title = first_settup.folders[index];
                let first_icon = document.createElement('div')
                first_icon.classList = "first_icon"
                let first_title = document.createElement('div')
                first_title.classList = "first_title"
                if (parsed_folder.name == "") {
                    first_title.innerHTML = first_settup.folders[index]
                } else {
                    first_title.innerHTML = parsed_folder.name;
                }
                let first_select_cancel_btn = document.createElement('div')
                first_select_cancel_btn.classList = "first_select_cancel_btn"
                first_select_cancel_btn.title = "Remove"

                first_select_cancel_btn.addEventListener('click', function () {
                    console.log(first_settup.folders)
                    console.log('Removing first folder: ', index)
                    first_settup.folders.splice(index, 1);//yeets the index i and closes the hole left behind
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
                    filepath.filePaths.forEach(mpath => { first_settup.folders.push(mpath) })//push them into temporary local folder variable
                }).finally(() => { buildfirst_folders() })//rebuild folders with new data
            })
        }
    }
}

//Play/pause button
document.getElementById('playbtn').addEventListener('click', function () {
    console.log('Pause button Pressed')
    player.play()
})
ipcRenderer.on('tray_play_pause', () => { player.play() })//listening on channel 'tray_play_pause'

//Next button
document.getElementById('nextbtn').addEventListener('click', function () {
    console.log('next button Pressed')
    player.next()
})
ipcRenderer.on('tray_next', () => { player.next() })//listening on channel 'tray_next'

//Previous button
document.getElementById('previousbtn').addEventListener('click', function () {
    console.log('Previous button Pressed')
    player.previous()
})
ipcRenderer.on('tray_previous', () => { player.previous() })//listening on channel 'tray_previous'