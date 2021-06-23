const fs = require('fs');

/* Random numeber for playback selection */
function rand_number(max, min, cant_be) {
    let randowm = Math.floor(Math.random() * (max - min + 1)) + min;
    if (randowm == cant_be) {
        return rand_number(max, min, cant_be);
    } else {
        return randowm;
    }
}

/* rework to be module */
/*let config_manage = {
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
}*/

module.exports = {
    rand_number
}