//required
const main = require('electron').remote.require('./main');//access export functions in main
const { dialog, Menu, MenuItem, systemPreferences, nativeTheme, clipboard, shell } = require('electron').remote;
const fs = require('fs');//file system
const my_website = 'https://anthonym01.github.io/Portfolio/?contact=me';

//text box menus
const text_box_menu = new Menu.buildFromTemplate([//Text box menu (for convinience)
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    { role: 'selectAll' },
    { role: 'seperator' },
    { role: 'undo' },
    { role: 'redo' },
]);

async function textboxmenu() {
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
const menu_body = new Menu.buildFromTemplate([//Main body menu
    { label: 'Force refresh UI', click() { maininitalizer() }, accelerator: 'CommandOrControl+F' },
    //{ type: 'separator' },
    { label: 'Contact developer', click() { shell.openExternal(my_website) } },
    //{ role: 'reload' },
    { role: 'toggledevtools' }
]);

window.addEventListener('contextmenu', (event) => {//Body menu attached to window
    event.preventDefault()
    menu_body.popup({ window: require('electron').remote.getCurrentWindow() })//popup menu
}, false);


//Load page
window.addEventListener('load', function () {//window loads
    console.log('Running from:', process.resourcesPath)

    if (typeof (systemPreferences.getAccentColor) == 'function' && typeof (systemPreferences.getAnimationSettings) == 'function') {
        console.log('System preference accent color: ', systemPreferences.getAccentColor())//get system accent color
        console.log('System preference Anime settings: ', systemPreferences.getAnimationSettings().shouldRenderRichAnimation)//check if system prefers animations or not
    }
    console.log('System preference Dark mode: ', nativeTheme.shouldUseDarkColors)//Check if system is set to dark or light
    //textboxmenu()
    Menu.setApplicationMenu(menu_body)

    if (localStorage.getItem("APPnamecfg")) {//check if storage has the item
        config.load()
    } else {
        config.validate()
    }
    maininitalizer()
})

function maininitalizer() {//Used to start re-startable app functions
    console.log('main initalizer')
player.play()
}

let config = {//Application configuration object
    baseconfig: {//base configuration
        use_alt_storage: false,
        alt_location: "",
    },
    data: {//application data
        key: "APPnamecfg",
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
            main.write_object_json_out(config.baseconfig.alt_location + "/APPnamecfg config.json", JSON.stringify(config.data))//hand off writing the file to main process
        }

        function ToStorageAPI() {//Html5 storage API
            console.log('config saved to application storage')
            localStorage.setItem("APPnamecfg", JSON.stringify(config.data))
        }
    },
    load: function () {//Load the config file
        console.warn('Configuration is being loaded')

        if (localStorage.getItem("APPnamecfg_baseconfig")) {//load base config
            config.baseconfig = JSON.parse(localStorage.getItem("APPnamecfg_baseconfig"))
        } else {
            //first startup
            localStorage.setItem("APPnamecfg_baseconfig", JSON.stringify(config.baseconfig))
        }

        if (config.baseconfig.use_alt_storage == true) {//Load from alt location
            //load from alternate storage location
            if (fs.existsSync(config.baseconfig.alt_location.toString() + "/APPnamecfg config.json")) {//Directory exists
                var fileout = fs.readFileSync(config.baseconfig.alt_location.toString() + "/APPnamecfg config.json", { encoding: 'utf8' })//Read from file with charset utf8
                console.warn('config Loaded from: ', config.baseconfig.alt_location.toString(), 'Data from fs read operation: ', fileout)
                fileout = JSON.parse(fileout)//parse the json
                if (fileout.key == "APPnamecfg") {//check if file has key
                    config.data = fileout;
                    console.warn('configuration applied from file')
                } else {//no key, not correct file, load from application storage
                    console.warn('The file is not a config file, internal configuration will be used')
                    config.data = JSON.parse(localStorage.getItem("APPnamecfg"))
                }
            } else {//file does not exist, was moved, deleted or is inaccesible
                config.data = JSON.parse(localStorage.getItem("APPnamecfg"))
                alert("file does not exist, was moved, deleted or is otherwise inaccesible, please select a new location to save app data ")
                config.selectlocation();
            }
        } else {//load from application storage
            config.data = JSON.parse(localStorage.getItem("APPnamecfg"))
            console.log('config Loaded from application storage')
        }

        console.table(config.data)
        this.validate()
    },
    validate: function () {//validate configuration
        console.warn('Config is being validated')
        var configisvalid = true

        /*if (typeof (config.data.usecount) == 'undefined') {
            config.data.usecount = 1
            configisvalid = false
            console.log('"usecount" did not exist and was set to default')
        }*/

        if (!configisvalid) {
            console.log('config was found to be invalid and will be overwritten')
            this.save()//Save new confog because old config is no longer valid
        } else { console.log('config was found to be valid') }

    },
    delete: function () {//Wjipe stowage
        localStorage.clear("APPnamecfg")//yeet storage key
        config.usedefault();//use default location
        console.log('config deleted: ')
        console.table(config.data)
        this.validate()
    },
    backup: async function () {//backup configuration to a file
        console.warn('Configuration backup initiated')

        var date = new Date();
        dialog.showSaveDialog({//electron file save dialogue
            defaultPath: "APPnamecfg backup " + Number(date.getMonth() + 1) + " - " + date.getDate() + " - " + date.getFullYear() + ".json",
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
                        if (fileout.key == "APPnamecfg") {//check if this file is a timetable backup file
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
                localStorage.setItem("APPnamecfg_baseconfig", JSON.stringify(config.baseconfig))//save base config

                if (fs.existsSync(config.baseconfig.alt_location.toString() + "/APPnamecfg config.json")) {//config file already exist there
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
        localStorage.setItem("APPnamecfg_baseconfig", JSON.stringify(config.baseconfig))//save base config
    },
}

let player = {
    playlists: [],
    play: function () {
        var sound = new Howl({//test playback
            src: ['C:\\Users\\samue\\OneDrive - The University of Technology,Jamaica\\Music\\[NCS Release] - Be Together [NCS Release].mp3'],
            autoplay: true,
            loop: true,
            volume: 1,
            onend: function () {
                console.log('Finished!');
            },
            onplayerror: function () {
                sound.once('unlock', function () {
                    sound.play();
                });
            }
        });
        sound.play()
    }
}


function get_url_variables(url) {
    //Yoinked from https://gomakethings.com/getting-all-query-string-values-from-a-url-with-vanilla-js/
    var params = {};
    var parser = document.createElement('a');
    parser.href = url;
    var query = parser.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        params[pair[0]] = decodeURIComponent(pair[1]);
    }
    return params;
    //returns Object { "": "undefined" } if empty
    //Call with getParams(window.location.href);
}

function HEXtoHSL(hex_put) {//Convert  System preference color hex to a form my brain can can use
    var redhex = hex_put.slice(0, 2);
    var greenhex = hex_put.slice(2, 4);
    var bluehex = hex_put.slice(4, 6);
    console.log(hex_put, ' : ', redhex, ' : ', greenhex, ' : ', bluehex)
    if (redhex == 0) { redhex = '00' }
    if (greenhex == 0) { greenhex = '00' }
    if (bluehex == 0) { bluehex = '00' }
    var r = parseInt(redhex, 16)
    var g = parseInt(greenhex, 16)
    var b = parseInt(bluehex, 16)
    r /= 255, g /= 255, b /= 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }
    return { h, s, l, r, g, b };
}