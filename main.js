

const { app, BrowserWindow, Menu, screen, Tray, clipboard, ipcMain, shell, nativeTheme, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const windowStateKeeper = require('electron-window-state');

const mm = require('music-metadata');
const ffmetadata = require("ffmetadata");
const my_website = 'https://anthonym01.github.io/Portfolio/?contact=me';

let verbose = true;//yes

if (verbose) { console.log('Running from:', process.resourcesPath) }

setTimeout(() => {
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
	console.log('By samuel A. Matheson (samuelmatheson15@gmail.com) Anthonym')
	console.log('Musick player that only sucks a little')

}, 4000)

//Main application menu
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
])

//text menu
const text_box_menu = new Menu.buildFromTemplate([
	{ role: 'cut' },
	{ role: 'copy' },
	{ role: 'paste' },
	{ role: 'selectAll' },
	{ role: 'undo' },
	{ role: 'redo' },
])

//editor menu 
const editor_menu = new Menu.buildFromTemplate([
	{ role: 'reload' },
	{ type: 'separator' },
	{ role: 'zoomIn' },
	{ role: 'resetZoom' },
	{ role: 'zoomOut' },
	{ type: 'separator' },
	{ role: 'toggledevtools' },
]);

let localtable = []//local song file paths]

let playlist_files = []//paths to any playlist files within paths specified in config.data.music_folders

const Store = require('electron-store');
const storeinator = new Store;

let config = {//configuration data
	data: {
		alt_location: false,
		minimize_to_tray: true,
		quiton_X: true,
		use_tray: true,
		use_wallpapers: true,
		music_folders: [],
	},
	save: async function () {
		storeinator.set('default', JSON.stringify(config.data))
		if (verbose) {
			console.log('Save configuration to, ', storeinator.path)
		}
	},
	load: function () {
		config.data = JSON.parse(storeinator.get('default'))
		config.data.use_wallpapers = true;
		if (verbose) {
			console.log('configuration load from, ', storeinator.path)
		}
	}
}

if (!app.requestSingleInstanceLock()) {
	//stop app if other instence is running
	app.quit();
} else {

	app.name = "Anthonym";

	if (storeinator.get('default')) { config.load() }

	app.on('ready', function () {
		app.allowRendererProcessReuse = true;

		mainWindow.create();
		if (process.platform != "win32" && config.data.use_wallpapers == true) { wallpaper_Window.create() }
		if (config.data.use_tray == true) { tray.create() }
	})

	app.on('window-all-closed', () => {
		if (tray.body == null) {
			app.quit()
		}
	})

	app.on('second-instance', (event) => {
		mainWindow.show();
	});

	Menu.setApplicationMenu(Menu.buildFromTemplate([
		{
			label: "menu placeholder", submenu: [
				{ label: 'remove dupicate favourites', click() { mainWindow.body.webContents.send('remove_dupicate_favourites') } },
				{ label: 'export favourites', click() { mainWindow.body.webContents.send('export_favourites') } },
			]
		},
	]));

	//Menu.setApplicationMenu(null);

	fetch_local_library()

}

let mainWindow = {
	body: null, //defines the window as an abject
	create: function () {
		if (verbose) { console.log('crate main app Window') }

		const { screenwidth, screenheight } = screen.getPrimaryDisplay().workAreaSize //gets screen size
		const mainWindowState = windowStateKeeper({ defaultWidth: screenwidth, defaultHeight: screenheight })

		mainWindow.body = new BrowserWindow({ //make main window
			x: mainWindowState.x, //x position
			y: mainWindowState.y, //y position 
			width: mainWindowState.width,
			height: mainWindowState.height,
			minWidth: 400,
			minHeight: 300,
			backgroundColor: '#000000',
			frame: false,
			center: true, //center the window
			icon: path.join(__dirname, '/build/icons/256x256.png'), //some linux window managers cant process due to bug
			title: 'Anthonym',
			show: true,
			skipTaskbar: false,
			//titleBarStyle: 'hiddenInset',
			webPreferences: {
				nodeIntegration: true,
				enableRemoteModule: true,
				nodeIntegrationInWorker: true,
				worldSafeExecuteJavaScript: true,
				contextIsolation: false
			}
		})

		mainWindow.body.loadURL(url.format({
			pathname: path.join(__dirname, '/Windows/MainWindow.html'),
			protocol: 'file:',
			slashes: true
		}))

		mainWindowState.manage(mainWindow.body); //give window to window manager plugin

		mainWindow.body.on('minimize', function () {
			if (config.data.minimize_to_tray == true && tray.body != null) {
				mainWindow.hide()
			}
		})

	},
	close: async function () { mainWindow.body.close() },
	hide: async function () {
		console.log('hide main window')
		mainWindow.body.hide();
		mainWindow.body.setSkipTaskbar(true);
	},
	minimize: async function () {
		mainWindow.body.minimize();
		if (config.data.minimize_to_tray == true && tray.body != null) {
			mainWindow.hide()
		}
	},
	show: async function () {
		console.log('Show main window')
		if (mainWindow.body != undefined) {
			mainWindow.body.show();
			mainWindow.body.focus()
			mainWindow.body.focusOnWebView()
			mainWindow.body.setSkipTaskbar(false);
		} else {
			mainWindow.create()
		}

		//if (process.platform == 'linux') { tray.destroy(); }
	}
};

let wallpaper_Window = {
	body: null, //defines the window as an abject
	create: function () {
		const { screenwidth, screenheight } = screen.getPrimaryDisplay().workAreaSize //gets screen size

		wallpaper_Window.body = new BrowserWindow({ //make main window
			x: 0,
			y: 0,
			width: screenwidth,
			height: screenheight,
			backgroundColor: '#000000',
			frame: false,
			type: "desktop",
			alwaysOnTop: false,
			show: true,
			skipTaskbar: true,
			fullscreen: true,
			webPreferences: {
				nodeIntegration: true,
				enableRemoteModule: true,
				nodeIntegrationInWorker: true,
				worldSafeExecuteJavaScript: true,
				contextIsolation: false
			},
			/*minWidth: 400,
			minHeight: 300,*/
		})

		wallpaper_Window.body.loadURL(url.format({
			pathname: path.join(__dirname, '/Windows/desktop.html'),
			protocol: 'file:',
			slashes: true
		}))

	},
	splash: function () {

	}
};

let tray = {
	body: null, //tray value
	create: async function () {
		console.log('Create tray')

		tray.body = new Tray(path.join(__dirname, '/build/icons/256x256.png'))

		tray.body.on('click', function () {
			console.log("Focused: ", mainWindow.body.isFocused(), " Visible: ", mainWindow.body.isVisible())
			if (mainWindow.body.isFocused() == true) {
				mainWindow.hide()
			} else {
				mainWindow.show()
			}
		})

		tray.update('Click to open', 'Play') //First menu

	},
	update: async function (now_playing, state) {
		const contextMenu = new Menu.buildFromTemplate([
			{ label: `Playing: ${now_playing}`, toolTip: 'Open Player', click() { mainWindow.show() } },
			{ type: 'separator' },
			{ label: 'Next', click() { tray.next() } },
			{ label: state, click() { tray.playpause() } },
			{ label: 'Previous', click() { tray.previous() } },
			{ type: 'separator' },
			{
				label: "quit", click() {
					setTimeout(() => { app.quit() }, 1000);
					mainWindow.body.destroy();
					if (process.platform == 'linux') {
						wallpaper_Window.body.hide();
						wallpaper_Window.body.destroy();
					}
				}
			},
		])
		tray.body.setContextMenu(contextMenu) //Set tray menu
		tray.body.setToolTip(`Playing: ${now_playing}`) //Set tray tooltip
	},
	playpause: async function () {
		mainWindow.body.webContents.send('tray_play_pause')
	},
	next: async function () {
		mainWindow.body.webContents.send('tray_next')
	},
	previous: async function () {
		mainWindow.body.webContents.send('tray_previous')
	},
	destroy: async function () {
		tray.body.destroy()
		tray.body == null;
	}
}

//clap an entire file buffer down
async function write_file(filepath, data) {
	console.log(filepath, data)
	fs.writeFile(filepath, data, (err) => { //write config to file as json
		if (err) {
			alert("An error occurred creating the file" + err.message)
		} else {
			console.log("The file has been successfully saved to: ", filepath);
		}
	})
}

async function fetch_local_library() {
	console.log('Getting local library from: ', config.data.music_folders)

	localtable = [];

	if (config.data.music_folders == [] || config.data.music_folders == undefined || config.data.music_folders.length < 1) {
		/*requires first settup
		first_settup()//run first settup
		*/
		setTimeout(() => {
			mainWindow.body.webContents.send('do_first_settup')
		}, 7000);
	} else {
		await getfiles(config.data.music_folders)
		//		console.log('Local library ', localtable)
		console.log('Sending package')
		try {
			mainWindow.body.webContents.send('got_local_library', localtable)
		} catch (error) {
			console.warn('mainwindow not ready to receive')
		}
	}

	async function getfiles(muzicpaths) {//gets files form array of music folder paths
		console.log('Searching directory: ', muzicpaths)

		try {
			muzicpaths.forEach(folder => {//for each folder in the array
				//progression_view.innerText = `searching: ${folder}`
				console.log('Searching: ', folder)
				//mainWindow.body.webContents.send('progression_view', folder)

				fs.readdir(folder, async function (err, dfiles) {//files from the directory
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
										localtable.push(fullfilepath);
										/*player.build_songbar(files.length - 1).then((builtbar) => {


											main_library_view.appendChild(builtbar)
										})*/
										break;

									case ".m3u": case ".pls": case ".xml"://playlist files {M3U , plain text PLS Audio Playlist , XML Shareable Playlist Format}
										playlist_files.push(fullfilepath);
										break;

									default: console.warn('not supported: ', fullfilepath);//not supported music file
								}
							}

							//build library part here



						})

					}//error accessing directory due to it not existing or locked permissions
					catch (err) {
						console.warn('File error', err)
						//UI.notify.new('Error', `Could not access ${folder}`)

						//better warning

					} finally {
						//build_library()

					}
				})
			})
		} catch (err) {
			console.warn(err)
		} finally {

		}
	}
}

async function writemetadata(filepath, dataobj) {
	console.log('Writing: ', dataobj, ' to ', filepath)
	ffmetadata.write(filepath, dataobj, function (err) {
		if (err) console.error("Error writing metadata", err);
		else console.log("Data written");
	});
}

async function edilocalfile(findex) {
	console.log('Edit: ', localtable[findex])

	const { screenwidth, screenheight } = screen.getPrimaryDisplay().workAreaSize //gets screen size

	let Editor_window = new BrowserWindow({ //make main window
		width: screenwidth / 2,
		height: screenheight / 2,
		minWidth: 400,
		minHeight: 300,
		backgroundColor: '#000000',
		frame: true,
		center: true,
		alwaysOnTop: true,
		icon: path.join(__dirname, '/build/icons/256x256.png'), //some linux window managers cant process due to bug
		title: `Edit ${localtable[findex]}`,
		show: true,
		skipTaskbar: false,
		//type: "toolbar",
		//titleBarStyle: 'hiddenInset',
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			nodeIntegrationInWorker: true,
			worldSafeExecuteJavaScript: true,
			contextIsolation: false
		},
	})

	Editor_window.loadURL(url.format({
		pathname: path.join(__dirname, '/Windows/editor.html'),
		protocol: 'file:',
		slashes: true
	})).then(() => { Editor_window.webContents.send('editpath', localtable[findex]) })
}

ipcMain.handle('get_minimize_to_tray', (event) => { return config.data.minimize_to_tray })
ipcMain.on('minimize_to_tray_flip', (event) => {

	if (config.data.minimize_to_tray) {//turn off the switch
		config.data.minimize_to_tray = false;
		console.log('use minimize_to_tray dissabled');
	} else {//turn on the switch (not too much tho :d)
		config.data.minimize_to_tray = true;
		console.log('use minimize_to_tray enabled');
	}
	config.save()
})
/*
async function id3read(information) {
	console.log('Pull id3 for :', information)

	if (!isNaN(information)) {
		information = localtable[information]
		console.log('is point to: ', information)
	}

	return NodeID3.read(information)

}*/

/*
	Handles trigering menu for song_bar (s) in mainWindow
*/
ipcMain.on('songbarmenu', (event, fileindex) => {

	const contextMenu = new Menu.buildFromTemplate([
		{//play button
			label: "Play",
			type: "normal",
			click() {
				//player.play(fileindex);
				mainWindow.body.webContents.send('playthis', fileindex)
				//setTimeout(() => { window.location.href = `#${now_playing_content.id - 2}` }, 300);
			}
		},
		{
			label: "add to favourites",
			type: "normal",
			click() { mainWindow.body.webContents.send('favouritethis', fileindex); }
		},
		{
			label: "add to playlist",
			type: "normal",
			click() { }
		},
		{ type: "separator" },
		{
			label: "Edit properties",
			click() { edilocalfile(fileindex) }
		},
		{
			label: "copy file name",
			click() { clipboard.writeText(path.basename(localtable[fileindex])) }
		},
		{//open song file in default external application
			label: "show in folder",
			click() { shell.showItemInFolder(localtable[fileindex]) }
		},
		{//copy file path
			label: "copy file location",
			//toolTip: `${player.files[fileindex].path}`,
			click() { clipboard.writeText(localtable[fileindex]); }
		}
	])
	contextMenu.popup({ window: mainWindow.body })//popup menu
})

ipcMain.on('x_button', () => {//close button signal
	if (config.data.quiton_X != true) {
		app.quit()
	} else {
		if (tray.body != null) {
			mainWindow.hide()
		} else {
			app.quit()
		}
	}
})

ipcMain.on('maximize_btn', () => {
	if (config.data.minimize_to_tray == true) {
		mainWindow.show()
	}

	if (mainWindow.body.isMaximized()) { //minimize
		mainWindow.body.restore()
	} else { //maximize
		mainWindow.body.maximize()
	}
})

ipcMain.on('minimize_btn', () => { mainWindow.minimize() })

ipcMain.on('Ready_for_action', () => { mainWindow.body.webContents.send('got_local_library', localtable) })//mainwindow is ready for action

ipcMain.on('raisemainwindow', () => { mainWindow.show() })

ipcMain.on('export_playlist', async (event, filedata) => {
	const filepath = await dialog.showSaveDialog(mainWindow.body, {//dialog in directory selection mode
		buttonLabel: 'Save playlist file',
	})

	console.log('Export playlist file to: ' + filepath.filePath + '. With data: ' + filedata);

	if (path.extname(filepath.filePath) == '.m3u') {
		write_file(filepath.filePath, filedata);
	} else {
		write_file(`${filepath.filePath}`.m3u, filedata);
	}
})

// metadata
let lastpool = null;
let metadatachae = {}
ipcMain.handle('pullmetadata', async (event, information) => {

	console.log('Pull metadat for :', information)

	if (!isNaN(information)) {
		information = localtable[information]
		console.log('is point to: ', information)
	}

	if (lastpool == information) {
		if (verbose) {
			console.log("Metadata from chae")
		}
		return metadatachae;
	}

	lastpool = information;

	try {
		let metadata = await mm.parseFile(information, { duration: false, skipCovers: false })

		if (verbose) {
			console.log(metadata)
		}

		var thumnaildata = null;
		let rawpic = null;

		if (path.extname(information) != ".mp4") {
			rawpic = mm.selectCover(metadata.common.picture) || null;
			thumnaildata = rawpic ? `data:${rawpic.format};base64,${rawpic.data.toString('base64')}` : null;

		}

		metadatachae = {
			title: metadata.common.title || path.basename(information),//title as a string
			artist: metadata.common.artist || "unknown artist",
			album: metadata.common.album || "unknown album",
			duration: metadata.format.duration,//durration in seconds
			image: thumnaildata,//thumbnail data as a string
			rawpic,
		}
		return metadatachae;

	} catch (err) {
		console.log(err);

		metadatachae = {
			title: "cannot acess" + information,
			artist: "unknown artist",
			album: "unknown album",
			duration: 0,//durration in seconds
			image: null,//thumbnail data as a string
			//rawpic,
		}

		return metadatachae;

	}
})
/*
async function pullrawmetadata(information){
	
}
*/
ipcMain.handle('Selectmusicfolder', async (event) => {

	const filepath = await dialog.showOpenDialog({//dialog in directory selection mode
		buttonLabel: 'Select music folder',
		properties: ['openDirectory', 'multiSelections'],
	})

	console.log(filepath.filePaths)

	return filepath.filePaths;
})

ipcMain.on('newmusicfolders', (event, mfolders) => {

	config.data.music_folders = mfolders;
	config.save();
	fetch_local_library()
})

ipcMain.on('restart', (event) => { app.relaunch(); app.quit() })

ipcMain.handle('playback_notificationchk', () => {
	//notification if hidden
	if (mainWindow.body.isVisible() == false || mainWindow.body.isFocused() == false) {
		return true;
	}
	return false;
})

ipcMain.on('editor_body', () => { editor_menu.popup() })

ipcMain.on('menu_body', () => { menu_body.popup() })

ipcMain.on('textboxmain', () => { text_box_menu.popup() })

ipcMain.handle('get.localfile', async (event, id) => { return localtable[id] })

ipcMain.on('Play_msg', (event, index, state) => { //Receive Song data from mainwindow and apply to tray
	let now_playing = path.basename(localtable[index])
	console.log('now playing: ', now_playing, state, /*event*/);
	if (tray.body != null) {
		tray.update(now_playing, state)
	}
})

ipcMain.on('wallpaper', (event, fileindex, blurse) => {
	if (process.platform == 'linux') {
		wallpaper_Window.body.webContents.send('wallpaper_in', fileindex, blurse);
	}
})

ipcMain.handle('get.localtable_length', () => { return localtable.length })

ipcMain.handle('get.localtable', () => { return localtable })

ipcMain.on('write_to_file', (event, filepath, filedata) => {
	write_file(filepath, filedata);
})