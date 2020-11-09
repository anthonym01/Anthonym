const { app, BrowserWindow, Menu, screen, MenuItem, Tray, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const windowStateKeeper = require('electron-window-state');
const Store = require('electron-store'); const storeinator = new Store;

let mainWindow = null;//defines the window as an abject
let tray = null;

let config = { minimize_to_tray: true, quiton_X: true }

app.on('ready', function () {//App ready to roll
	if (storeinator.get('default')) {
		config = JSON.parse(storeinator.get('default'))
	} else {
		storeinator.set('default', JSON.stringify(config))
	}
	//Menu.setApplicationMenu(null)
	createmainWindow();

	if (config.minimize_to_tray == true) {
		create_tray()
	}
})

app.on('window-all-closed', () => {//all windows closed
	if (tray == null) { app.quit() }
})


/* Main window stuff */
function createmainWindow() {//Creates the main render process
	app.allowRendererProcessReuse = true;//Allow render processes to be reused

	//window manager plugin stuff
	const { screenwidth, screenheight } = screen.getPrimaryDisplay().workAreaSize //gets screen size
	let mainWindowState = windowStateKeeper({
		defaultWidth: screenwidth,
		defaultHeight: screenheight
	})

	mainWindow = new BrowserWindow({//make main window
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
			worldSafeExecuteJavaScript: true
		},
		minWidth: 400,
		minHeight: 300,
	})

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, '/Windows/MainWindow.html'),
		protocol: 'file:',
		slashes: true
	}))

	mainWindowState.manage(mainWindow);//give window to window manager plugin
}

async function hidemainwwindow() {
	if (process.platform == 'linux') {//keep tray persistent on windows
		create_tray();
	}
	mainWindow.hide();
	mainWindow.setSkipTaskbar(true);
}

async function showmainwwindow() {
	mainWindow.show();
	mainWindow.focusOnWebView()
	mainWindow.setSkipTaskbar(false);
	if (process.platform == 'linux') {//keep tray persistent on windows
		tray.destroy();//yeets tray into the void must be done last
	}
}

/* Tray  functionality */
async function create_tray() {//Create Tray
	tray = new Tray('icon.png')
	tray.on('click', showmainwwindow)//Single click
	update_tray_menu('Anthonym')//First menu
}

async function update_tray_menu(now_playing) {//Updates tray menu with new info
	let contextMenu = new Menu()//menu

	contextMenu.append(new MenuItem({ label: now_playing, toolTip: 'Open Player', click() { showmainwwindow() } }))
	contextMenu.append(new MenuItem({ type: 'separator' }))
	contextMenu.append(new MenuItem({ label: 'Next', click() { tray_next() } }))
	contextMenu.append(new MenuItem({ label: 'Play/Pause', click() { tray_playpause() } }))
	contextMenu.append(new MenuItem({ label: 'Previous', click() { tray_previous() } }))
	contextMenu.append(new MenuItem({ type: 'separator' }))
	contextMenu.append(new MenuItem({ role: 'quit' }))

	tray.setContextMenu(contextMenu)//Set tray menu
	tray.setToolTip(now_playing)//Set tray tooltip
}

ipcMain.on('Play_msg', (event, now_playing) => {//Receive Song data from mainwindow and apply to tray
	console.log('Set tray now playing to: ', now_playing, event);
	update_tray_menu(now_playing)
})

async function tray_playpause(){//Tray play/pause action
	mainWindow.webContents.send('tray_play_pause')//fire channel to mainwindow
}
async function tray_next(){//Tray Next action
	mainWindow.webContents.send('tray_next')//fire channel
}
async function tray_previous(){//Tray previous action
	mainWindow.webContents.send('tray_previous')//fire channel
}


//Schortcut to write changes to files because i keep forgetting the fs writefile
async function write_file(filepath, buffer_data) {
	console.log(filepath, buffer_data)
	fs.writeFile(filepath, buffer_data, 'utf8', (err) => {//write config to file as json
		if (err) {
			alert("An error occurred creating the file" + err.message)
		} else {
			console.log("The file has been successfully saved to: ", filepath);
		}
	})
}

async function storeinatorset() {
	storeinator.set('default', JSON.stringify(config))
}

module.exports = {//exported modules
	write_object_json_out: function (filepath, buffer_data) { write_file(filepath, buffer_data) },
	setontop: async function () { mainWindow.setAlwaysOnTop(true) },//always on top the window
	setnotontop: async function () { mainWindow.setAlwaysOnTop(false) },//always on top'nt the window
	Stash_window: async function () { hidemainwwindow() },
	set_minimize_to_tray: async function (minimize_to_tray) {
		config.minimize_to_tray = minimize_to_tray;
		storeinatorset()
	},
	get_minimize_to_tray: function () { return config.minimize_to_tray },
	minimize_btn: async function () {
		if (config.minimize_to_tray == true) {
			hidemainwwindow()
		} else {
			mainWindow.minimize();
		}
	},
	maximize_btn: async function () {
		if (config.minimize_to_tray == true) {
			showmainwwindow()
		}
		if (mainWindow.isMaximized()) {
			//minimize
			mainWindow.restore()
		} else {
			//maximize
			mainWindow.maximize()
		}
	},
	x_button: async function () {
		if (config.minimize_to_tray == true && config.quiton_X == true) {
			app.quit()
		} else {
			hidemainwwindow()
		}
	}
}
