const { ipcRenderer } = require('electron')
const thumbnailjs = require('thumbnail-js');
const backgroundmaskimg = document.getElementById('backgroundmaskimg')


//optimize to remove double read later
ipcRenderer.on('wallpaper_in', async (event, fileindex) => {
    const metadata = await ipcRenderer.invoke('pullmetadata', fileindex);
    if (metadata.image != null) {
        backgroundmaskimg.src = metadata.image;
        backgroundmaskimg.style.display = "block";

    } else {
        //use placeholder image
    }
})