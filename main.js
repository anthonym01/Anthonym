const { app, BrowserWindow, Menu, screen, MenuItem, Tray } = require('electron');
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
	Menu.setApplicationMenu(null)
	createmainWindow()
})

app.on('window-all-closed', () => {//all windows closed
	if (tray == null) { app.quit() }
})

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
		icon: path.join(__dirname, '/assets/icons/icon.png'),//some linux window managers cant process due to bug
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
	create_tray();
	mainWindow.hide();
	mainWindow.setSkipTaskbar(true);
}

async function showmainwwindow() {
	mainWindow.show();
	mainWindow.focusOnWebView()
	mainWindow.setSkipTaskbar(false);
	tray.destroy();//yeets tray into the void must be done last
}

function create_tray() {//Create tray
	tray = new Tray('assets/icons/icon.png')

	tray.on('click', showmainwwindow)//double click tray
	//tray.on('double-click', check_main_window)//double click tray

	const contextMenu = Menu.buildFromTemplate([//build context menu
		{ id: 'name', label: 'Current song', toolTip: 'Open Player', click() { showmainwwindow() } },
		{ type: 'separator' },
		{
			id: 'name', label: 'Next', click() {
				console.log('Play next song')
			}
		},
		{
			id: 'name', label: 'Play/Pause', click() {
				console.log('PlayPause')
			}
		},
		{
			id: 'name', label: 'Previous', click() {
				console.log('Play Previous song')
			}
		},
		{ type: 'separator' },
		{ role: 'Quit' },//quit app
	])
	tray.setContextMenu(contextMenu)
	tray.setToolTip('Anthonym')
}

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
	check_main_window: function () { check_main_window() },
	clossapp: function () { app.quit() },//export quit app
	minimize: function () { mainWindow.minimize() },//minimize window
	setontop: function () { mainWindow.setAlwaysOnTop(true) },//always on top the window
	setnotontop: function () { mainWindow.setAlwaysOnTop(false) },//always on top'nt the window
	Stash_window: function () { hidemainwwindow() },
	set_minimize_to_tray: function (minimize_to_tray) {
		config.minimize_to_tray = minimize_to_tray;
		storeinatorset()
	},
	get_minimize_to_tray: function () { return config.minimize_to_tray },
	minimize_btn: function () {
		if (config.minimize_to_tray == true) {
			hidemainwwindow()
		} else {
			mainWindow.minimize();
		}
	},
	maximize_btn: function () {
		if (config.minimize_to_tray == true) {
			showmainwwindow
		}
		if (mainWindow.isMaximized()) {
			//minimize
			mainWindow.restore()
		} else {
			//maximize
			mainWindow.maximize()
		}
	},
	x_button: function () {
		if (config.minimize_to_tray == true && config.quiton_X == true) {
			app.quit()
		} else {
			hidemainwwindow()
		}
	}
}
