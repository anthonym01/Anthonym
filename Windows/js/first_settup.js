//const main = require("../../main");

let folders = [];

async function first_settup() {
    document.getElementById('first_setup_screen').style.display = "block";//hide first settup screen
    document.getElementById('first_finish_btn').addEventListener('click', function () {//finish button in first settup screen
        main.set.musicfolders(folders);//save selected music folders
        document.getElementById('first_setup_screen').style.display = "none";//hide first settup screen
        maininitalizer();
        player.initalize()
    })
    buildfirst_folders()

    function buildfirst_folders() {//rempresent selected folders
        document.getElementById('first_setup_folders').innerHTML = ""

        for (let i=0;i<folders.length;i++) {
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