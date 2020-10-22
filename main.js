const { app, BrowserWindow, Menu, screen, MenuItem, Tray } = require('electron');
const path = require('path');
const url = require('url');
//const { createPublicKey } = require('crypto');
const fs = require('fs');
const windowStateKeeper = require('electron-window-state');//https://www.npmjs.com/package/electron-window-state
const Store = require('electron-store');//Store objects (https://www.npmjs.com/package/electron-window-state)
const storeinator = new Store;

let mainWindow = null;//defines the window as an abject
let tray = false;

let config = {
	athingy: true,
}

app.on('ready', function () {//App ready to roll
	if (storeinator.get('default')) {
		config = JSON.parse(storeinator.get('default'))
	} else {
		storeinator.set('default',JSON.stringify(config))
	}
	createmainWindow()
	//create_tray()
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
		frame: true,
		center: true,//center the window
		alwaysOnTop: false,
		icon: path.join(__dirname, '/assets/icons/icon.png'),//some linux window managers cant process due to bug
		title: 'Anthonym',
		show: true,
		//titleBarStyle: 'hiddenInset',
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			nodeIntegrationInWorker: true,
			worldSafeExecuteJavaScript: true
		},
		minWidth: 400,
	})

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, '/Windows/MainWindow.html'),
		protocol: 'file:',
		slashes: true
	}))

	mainWindowState.manage(mainWindow);//give window to window manager plugin
}

function create_tray() {//Create tray
	tray = new Tray('assets/icons/icon.png')

	tray.addListener('double-click', check_main_window)//double click tray

	const contextMenu = Menu.buildFromTemplate([//build context menu
		{ id: 'name', label: 'Anthonym', click() { check_main_window() } },
		{ type: 'separator' },//separator
		{ role: 'Quit' },//quit app
	])
	tray.setToolTip('Anthonym')
	tray.setContextMenu(contextMenu)
}

app.on('window-all-closed', () => {//all windows closed
	if (process.platform !== 'darwin' && tray == false) { app.quit() }
})

app.on('activate', () => {//for darwin
	if (BrowserWindow.getAllWindows().length === 0) {
		createmainWindow();
	} else {
		mainWindow.show();
	}
})

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

function check_main_window() {//Checks for main window and creates or shows it
	if (BrowserWindow.getAllWindows().length !== 0) {//if no windows
		mainWindow.show()
	} else {
		createmainWindow()
	}
}

module.exports = {//exported modules
	write_object_json_out: function (filepath, buffer_data) { write_file(filepath, buffer_data) },
	check_main_window: function () { check_main_window() },
	clossapp: function () { app.quit() },//export quit app
	minimize: function () { mainWindow.minimize() },//minimize window
	setontop: function () { mainWindow.setAlwaysOnTop(true) },//always on top the window
	setnotontop: function () { mainWindow.setAlwaysOnTop(false) },//always on top'nt the window
}
