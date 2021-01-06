const { app, BrowserWindow, Menu, screen, MenuItem, Tray, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const windowStateKeeper = require('electron-window-state');
const Store = require('electron-store'); const storeinator = new Store;
//const tray = require('./tray.js');

let config = {
	data: {
		alt_location: false,
		minimize_to_tray: true,
		quiton_X: true,
		music_folders: [],
	},
	save: async function () { storeinator.set('default', JSON.stringify(config.data)) },
	load: function () { config.data = JSON.parse(storeinator.get('default')) }
}

if (storeinator.get('default')) { config.load() }//load config

app.on('ready', function () {//App ready to roll
	app.allowRendererProcessReuse = true;//Allow render processes to be reused
	mainWindow.create();
	if (config.data.minimize_to_tray == true) { tray.create() }
})

app.on('window-all-closed', () => { if (tray.body == null) { app.quit() } })

let mainWindow = {
	body: null,//defines the window as an abject
	create: function () {
		console.log('crat main app Window')
		const { screenwidth, screenheight } = screen.getPrimaryDisplay().workAreaSize //gets screen size
		let mainWindowState = windowStateKeeper({
			defaultWidth: screenwidth,
			defaultHeight: screenheight
		})

		mainWindow.body = new BrowserWindow({//make main window
			x: mainWindowState.x,//x position
			y: mainWindowState.y,//y position
			width: mainWindowState.width,
			height: mainWindowState.height,
			backgroundColor: '#000000',
			frame: false,
			center: true,//center the window
			alwaysOnTop: false,
			icon: path.join(__dirname, '/icon.png'),//some linux window managers cant process due to bug
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

		mainWindowState.manage(mainWindow.body);//give window to window manager plugin
	},
	hide: async function () {
		console.log('hide main window')
		//if (process.platform == 'linux') { create_tray(); }
		mainWindow.body.hide();
		mainWindow.body.setSkipTaskbar(true);
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

let tray = {
	body: null,//tray value
	Play_msg: ipcMain.on('Play_msg', (event, now_playing, state) => {//Receive Song data from mainwindow and apply to tray
		console.log('Set tray now playing to: ', now_playing, state, /*event*/);
		tray.update(now_playing, state)
	}),
	create: async function () {
		console.log('Create tray')
		tray.body = new Tray('icon.png')
		tray.body.on('click', function () { console.log('tray clicked'); mainWindow.show() })//Single click
		tray.update('Click to open','Play')//First menu
	},
	update: async function (now_playing, state) {
		let contextMenu = new Menu()//menu

		contextMenu.append(new MenuItem({ label: `Playing: ${now_playing}`, toolTip: 'Open Player', click() { mainWindow.show() } }))
		contextMenu.append(new MenuItem({ type: 'separator' }))
		contextMenu.append(new MenuItem({ label: 'Next', click() { tray.next() } }))
		//contextMenu.append(new MenuItem({ label: state ? 'Play' : 'Pause', click() { tray.playpause() } }))
		contextMenu.append(new MenuItem({ label: state, click() { tray.playpause() } }))
		contextMenu.append(new MenuItem({ label: 'Previous', click() { tray.previous() } }))
		contextMenu.append(new MenuItem({ type: 'separator' }))
		contextMenu.append(new MenuItem({ role: 'quit' }))

		tray.body.setContextMenu(contextMenu)//Set tray menu
		tray.body.setToolTip(now_playing)//Set tray tooltip
	},
	playpause: async function () { mainWindow.body.webContents.send('tray_play_pause') },
	next: async function () { mainWindow.body.webContents.send('tray_next') },
	previous: async function () { mainWindow.body.webContents.send('tray_previous') }
}

//Schortcut to write changes to files because i keep forgetting the fs writefile
async function write_file(filepath, data) {
	console.log(filepath, data)
	fs.writeFile(filepath, data, 'utf8', (err) => {//write config to file as json
		if (err) {
			alert("An error occurred creating the file" + err.message)
		} else {
			console.log("The file has been successfully saved to: ", filepath);
		}
	})
}

module.exports = {//exported modules
	write_file: async function (filepath, buffer_data) { write_file(filepath, buffer_data) },
	write_alt_storage_location: async function (data) {//write data to alt storage location
		if (config.data.alt_location != false) { write_file(config.data.alt_location + "/Anthonymcfg config.data.json", data) }
	},
	setontop: async function () { mainWindow.body.setAlwaysOnTop(true) },//always on top the window
	setnotontop: async function () { mainWindow.body.setAlwaysOnTop(false) },//always on top'nt the window
	Stash_window: async function () { mainWindow.hide() },

	minimize_btn: async function () {
		if (config.data.minimize_to_tray == true) {
			mainWindow.hide()
		} else {
			mainWindow.body.minimize();
		}
	},
	maximize_btn: async function () {
		if (config.data.minimize_to_tray == true) { mainWindow.show() }

		if (mainWindow.body.isMaximized()) {//minimize
			mainWindow.body.restore()
		} else {//maximize
			mainWindow.body.maximize()
		}
	},
	x_button: async function () {
		if (config.data.minimize_to_tray == true && config.data.quiton_X == true) {
			app.quit()
		} else {
			mainWindow.hide()
		}
	},
	get: {
		musicfolders: function () { return config.data.music_folders },
		alt_location: function () { return config.data.alt_location },
		minimize_to_tray: function () { return config.data.minimize_to_tray },
	},
	set: {
		musicfolders: async function (music_folders) {
			config.data.music_folders = music_folders;
			config.save();
		},
		alt_location: async function (alt_location) {
			config.data.alt_location = alt_location;
			config.save();
		},
		minimize_to_tray: async function (minimize_to_tray) {
			config.data.minimize_to_tray = minimize_to_tray;
			config.save();
		},
	}

}
