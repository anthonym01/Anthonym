const { app, BrowserWindow, Menu, screen, MenuItem, Tray, clipboard, ipcMain, shell, nativeTheme, dialog, systemPreferences } = require('electron');
const path = require('path')
const url = require('url')
const fs = require('fs')
const windowStateKeeper = require('electron-window-state')
const Store = require('electron-store')
const storeinator = new Store
const mm = require('music-metadata')
const ffmetadata = require("ffmetadata")
//const { info } = require('console')

//const NodeID3 = require('node-id3');
//const tray = require('./tray.js');

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


console.log('Running from:', process.resourcesPath)

let localtable = []

let playlist_files = [//playlist_files
	/*{
		path: "path  to playlist file, if any",
		files: [0, 5, 23, 6, 7]//file indexes
	}*/
];

/* Configuration, application properties or persistent user settings */
let config = {
	data: {
		alt_location: false,
		minimize_to_tray: true,
		quiton_X: true,
		use_tray: true,
		music_folders: [],
	},
	save: async function () {
		storeinator.set('default', JSON.stringify(config.data))
	},
	load: function () {
		config.data = JSON.parse(storeinator.get('default'))
	}
}

if (!app.requestSingleInstanceLock()) { //stop app if other instence is running
	app.quit();
} else {

	app.name = "Anthonym";

	if (storeinator.get('default')) { config.load() }

	app.on('ready', function () { //App ready to roll
		app.allowRendererProcessReuse = true; //Allow render processes to be reused
		mainWindow.create();
		if (process.platform != "win32") {
			wallpaper_Window.create()
		}
		if (config.data.use_tray == true) { tray.create() }
	})

	app.on('window-all-closed', () => {//kill app immediatly if window closed
		if (tray.body == null) {
			app.quit()
		}
	})

	app.on('second-instance', (event) => {
		mainWindow.show();
	});


	//Menu.setApplicationMenu(menu_body);

	Menu.setApplicationMenu(null);

	fetch_local_library()

}

let mainWindow = {
	body: null, //defines the window as an abject
	create: function () {
		console.log('crat main app Window')
		const {
			screenwidth,
			screenheight
		} = screen.getPrimaryDisplay().workAreaSize //gets screen size

		let mainWindowState = windowStateKeeper({
			defaultWidth: screenwidth,
			defaultHeight: screenheight
		})

		mainWindow.body = new BrowserWindow({ //make main window
			x: mainWindowState.x, //x position
			y: mainWindowState.y, //y position 
			width: mainWindowState.width,
			height: mainWindowState.height,
			backgroundColor: '#000000',
			frame: false,
			center: true, //center the window
			//alwaysOnTop: false,
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
			},
			minWidth: 400,
			minHeight: 300,
		})

		mainWindow.body.loadURL(url.format({
			pathname: path.join(__dirname, '/Windows/MainWindow.html'),
			protocol: 'file:',
			slashes: true
		}))

		mainWindowState.manage(mainWindow.body); //give window to window manager plugin

		mainWindow.body.on('minimize', function (event) {

			if (config.data.minimize_to_tray == true && tray.body != null) {
				mainWindow.hide()
			}
		})
	},
	close: async function () { },
	hide: async function () {
		console.log('hide main window')
		//if (process.platform == 'linux') { create_tray(); }
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
			//center: true, //center the window
			//alwaysOnTop: false,
			//icon: path.join(__dirname, '/build/icons/256x256.png'), //some linux window managers cant process due to bug
			//title: 'Anthonym',
			show: true,
			skipTaskbar: true,
			fullscreen: true,
			//titleBarStyle: 'hiddenInset',
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
			console.log('tray clicked');
			console.log("Focused: ", mainWindow.body.isFocused(), " Visible: ", mainWindow.body.isVisible())
			if (mainWindow.body.isVisible() == true) {
				mainWindow.hide()
			} else {
				mainWindow.show()
			}
		}) //Single click

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
			{ label: "Quit", click() { app.quit() } }
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
			alert("An error occurred creating the file" + err.message)
		} else {
			console.log("The file has been successfully saved to: ", filepath);
		}
	})
}

async function fetch_local_library() {
	console.log('Getting local library from: ', config.data.music_folders)

	localtable = [];

	if (config.data.music_folders == [] || config.data.music_folders == undefined || config.data.music_folders.length < 1) {
		first_settup()//run first settup
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
async function pullmetadata(information) {

}*/
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

ipcMain.handle('pullmetadata', async (event, information) => {

	console.log('Pull metadat for :', information)

	if (!isNaN(information)) {
		information = localtable[information]
		console.log('is point to: ', information)
	}
	try {
		let metadata = await mm.parseFile(information, { duration: false, skipCovers: false })

		console.log(metadata)
		var thumnaildata = null;
		let rawpic = null;
		if (path.extname(information) != ".mp4") {
			rawpic = mm.selectCover(metadata.common.picture) || null;
			thumnaildata = rawpic ? `data:${rawpic.format};base64,${rawpic.data.toString('base64')}` : null;

		}

		return {
			title: metadata.common.title || path.basename(information),//title as a string
			artist: metadata.common.artist || "unknown",
			album: metadata.common.album || "unknown",
			duration: metadata.format.duration,//durration in seconds
			image: thumnaildata,//thumbnail data as a string
			//rawpic,
		}

	} catch (err) {
		console.log(err);
		return {
			title: "cannot acess" + information,//title as a string
			artist: "unknown",
			album: "unknown",
			duration: 0,//durration in seconds
			image: 'img/error-pngrepo-com-white.png',//thumbnail data as a string
			//rawpic,
		}

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
	return false
})

ipcMain.on('menu_body', () => { menu_body.popup({ window: mainWindow }) })

ipcMain.on('textbox', () => { text_box_menu.popup({ window: mainWindow }) })

ipcMain.handle('get.localfile', async (event, id) => { return localtable[id] })

ipcMain.on('Play_msg', (event, index, state) => { //Receive Song data from mainwindow and apply to tray
	let now_playing = path.basename(localtable[index])
	console.log('now playing: ', now_playing, state, /*event*/);
	if (tray.body != null) {
		tray.update(now_playing, state)
	}
})

ipcMain.on('wallpaper', (event, fileindex, blurse) => {
	wallpaper_Window.body.webContents.send('wallpaper_in', fileindex, blurse);
})

ipcMain.handle('get.localtable_length', () => { return localtable.length })

ipcMain.handle('get.localtable', () => { return localtable })

module.exports = { //exported modules
	//pullmetadata,
	write_file,
	writemetadata,
	//pullrawmetadata,
	//id3read,
	setontop: async function () {
		mainWindow.body.setAlwaysOnTop(true)//always on top the window
	},
	setnotontop: async function () {
		mainWindow.body.setAlwaysOnTop(false)
	}, //always on top'nt the window
	Stash_window: async function () {
		mainWindow.hide()
	},
	Show_window: async function () {
		mainWindow.show()
	},
	reamake_tray: function () {
		tray.create()
	},
	remove_tray: function () {
		tray.destroy()
	},
	resynclocal: function () { },
	get: {
		localtable: function () {
			return localtable
		},
		localfile: function (id) {
			return localtable[id]
		},
		localtable_length: function () {
			return localtable.length
		},
		musicfolders: function () {
			return config.data.music_folders
		},
		alt_location: function () {
			return config.data.alt_location
		},
		minimize_to_tray: function () {
			return config.data.minimize_to_tray
		},
		quiton_X: function () {
			return config.data.quiton_X
		},
		use_tray: function () {
			return config.data.use_tray
		}
	},
	set: {
		musicfolders: async function (music_folders) {

		},
		minimize_to_tray: async function (minimize_to_tray) {
			config.data.minimize_to_tray = minimize_to_tray;
			config.save();
		},
		quiton_X: async function (quiton_X) {
			config.data.quiton_X = quiton_X;
			config.save();
		},
		use_tray: async function (use_tray) {
			config.data.use_tray = use_tray;
			config.save();
		},
	}

}