
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

const { ipcRenderer } = require('electron')

const path = require('path')
const wallpaper = require('wallpaper')
const utils = require('../Windows/js/utils.js')
const { Howler } = require('howler')
const thumbnailjs = require('thumbnail-js');

const playbtn = document.getElementById('playbtn')
const nextbtn = document.getElementById('nextbtn')
const previousbtn = document.getElementById('previousbtn')
const repeatbtn = document.getElementById('repeatbtn')
const shufflebtn = document.getElementById('shufflebtn')
const song_progress_bar = document.getElementById('song_progress_bar')
const backgroundmaskimg = document.getElementById('backgroundmaskimg')
const backgroundvideo = document.getElementById('backgroundvideo')
const mainmaskcontainer = document.getElementById('mainmaskcontainer')
const Menupannel_main = document.getElementById('Menupannel_main')
const main_library_view = document.getElementById('main_library_view')
const searchput = document.getElementById('searchput')
const overpainelm = document.getElementById('overpain')//pannel for queue and search
const searchbox = document.getElementById('searchbox')
const coverartsmall = document.getElementById('coverartsmall')


//window loads
window.addEventListener('load', async function () {

    setTimeout(() => {
        document.body.removeChild(document.getElementById('loading_screen'))
        document.getElementById('songTitle').innerHTML = "Ready to Vibe"
        console.warn('Clapped loading screen after 10 second timeout')
    }, 10000);//close loading screen



    //console.log('System preference Dark mode: ', nativeTheme.shouldUseDarkColors)//Check if system is set to dark or light

    if (localStorage.getItem("Anthonymcfg")) { config.load() }
    UI.initalize()
    player.initalize()

    maininitalizer()

})

//let localfiles = []

let looking = [];//lookup timers, only search after user stops typing

let actiontimeout = false;//boolean set when actions cannot happen twice

let now_playing_content = {//relivant details abou the song thats playing now
    duration: 999,
    id: null
}

//  Taskbar buttons for frameless window
document.getElementById('x-button').addEventListener('click', function () { ipcRenderer.send('x_button'); })
document.getElementById('maximize-button').addEventListener('click', function () { ipcRenderer.send('maximize_btn') })
document.getElementById('minimize-button').addEventListener('click', function () { ipcRenderer.send('minimize_btn') })

window.addEventListener('contextmenu', (e) => {//invoke mainbody window
    e.preventDefault();
    ipcRenderer.send('menu_body');
}, false);

searchput.addEventListener('contextmenu', (e) => {
    e.stopPropagation();
    e.preventDefault();
    ipcRenderer.send('textboxmain');
}, false)



window.addEventListener('keydown', async function (e) {//keyboard actions
    console.log('Keypress: ', e.key)
    switch (e.key) {
        case " ": case "p": case "enter":
            e.preventDefault();
            player.play();
            break;
        case "Escape":
            e.preventDefault();
            if (overpainelm.classList == "overpain_active") {
                UI.overpain.hide()
            } else if (document.getElementById('setting_view').classList == "setting_view_active") {
                UI.navigate.main_library_view()
            }
            break;
        case "f": e.preventDefault(); UI.overpain.show(); break;
        case "n":
            e.preventDefault();
            console.log('Seekforward on keypress');
            player.next(); break;
        case "b":
            e.preventDefault();
            console.log('previous on keypress');
            player.previous(); break;
        case "m":
            e.preventDefault();
            console.log('mute on keypress');
            player.mute();
            break;
        case "ArrowRight":
            e.preventDefault();
            console.log('Seek forward on keypress');
            player.seekforward();
            break;
        case "ArrowLeft":
            e.preventDefault();
            console.log('Seek backward on keypress');
            player.seekbackward();
            break;
        default: console.log('No action')
    }
}, false)

async function maininitalizer() {//Used to start re-startable app functions
    console.log('main initalizer')

    //reset players state to default
    main_library_view.innerHTML = ""
    player.pause();
    player.stop_seeking();
    player.queue = [];//Play queue randomized from playlist/library
    player.playstate = false;//is (should be) playing music
    ipcRenderer.send('Ready_for_action')
}

let config = {
    data: {
        key: "Anthonymcfg",
        background_blur: 2,//pixels
        last_played: 0,
        animations: true,
        shuffle: false,
        playbar_icons: true,
        video_icons: true,
        repeat: 1,//0 no repeat, 1 repeat all, 2 replay current song
        favourites: ["I can be the one"]
    },
    save: async function () {//Save the config file
        console.table('Configuration is being saved', config.data);
        localStorage.setItem("Anthonymcfg", JSON.stringify(config.data));
    },
    load: function () {//Load the config file
        console.warn('Configuration is being loaded')
        config.data = JSON.parse(localStorage.getItem("Anthonymcfg"))
        console.table(config.data)
    },
    delete: function () { localStorage.clear("Anthonymcfg") },
}

ipcRenderer.on('got_local_library', (event, sentarray) => {//listening on channel 'tray_play_pause'

    //0console.warn('building local library ', sentarray)
    //localfiles = sentarray;

    main_library_view.innerHTML = "";

    for (let fileindex in sentarray) {
        //progression_view.innerHTML=`${fileindex/sentarray.length*100}%`
        player.build_songbar(fileindex).then((builtbar) => {
            builtbar.id = fileindex;
            main_library_view.appendChild(builtbar)
        })
    }
    setTimeout(async () => {
        document.body.removeChild(document.getElementById('loading_screen'));
        document.getElementById('songTitle').innerHTML = "Ready to Vibe"
        coverartsmall.src = "img/memes/Cats/headphone cat.gif"
        console.warn('Clapped loading screen after leading files')
    }, 0);
})

ipcRenderer.on('playthis', (event, fileindex) => { player.play(fileindex) })
ipcRenderer.on('favouritethis', (event, fileindex) => { playlistmanager.addtofavourite(fileindex) })

let player = {//Playback control
    queue: [],//Play queue randomized from playlist/library
    stream1: null,//stream for howler
    seekterval: null,//looping seek time update
    playstate: false,//is (should be) playing music or video
    initalize: async function () {

        coverartsmall.addEventListener('click', function () { player.scroll_to_current() })

        //search input
        searchput.addEventListener('keydown', function (e) {//keyboard actions
            e.stopImmediatePropagation();
            if (e.key == "Escape") {
                UI.overpain.hide()
            } else {
                player.lookup();
            }
        })

        //shuffle button
        switch (config.data.shuffle) {
            case false://no shuffle
                shufflebtn.className = "shufflebtn"
                shufflebtn.title = "no shuffle"
                break;
            case true:// shuffle
                shufflebtn.className = "shufflebtn_on"
                shufflebtn.title = "shuffle"
                break;
            default: config.data.shuffle = false; config.save();

        }
        shufflebtn.addEventListener('click', function () {
            switch (config.data.shuffle) {
                case false://no shuffle
                    shufflebtn.className = "shufflebtn_on"
                    shufflebtn.title = "shuffle"
                    config.data.shuffle = true;
                    config.save();
                    break;
                case true:// shuffle
                    shufflebtn.className = "shufflebtn";
                    shufflebtn.title = "no shuffle"
                    config.data.shuffle = false;
                    config.save();
                    break;
                default: config.data.shuffle = false; config.save();
            }
        })

        //repeat button
        switch (config.data.repeat) {
            case 0://no repeat
                repeatbtn.className = "repeatbtn_no"
                repeatbtn.title = "no repeat"
                break;
            case 1:// repeat all
                repeatbtn.className = "repeatbtn_all"
                repeatbtn.title = "repeat all"
                break;
            case 2://replay current song
                repeatbtn.className = "repeatbtn_lock"
                repeatbtn.title = "repeat current song"
                break;
            default: config.data.repeat = 0; config.save();

        }

        repeatbtn.addEventListener('click', function () {
            switch (config.data.repeat) {
                case 0://no repeat
                    repeatbtn.className = "repeatbtn_all"
                    repeatbtn.title = "repeat all"
                    config.data.repeat = 1;
                    config.save();
                    break;
                case 1:// repeat all
                    repeatbtn.className = "repeatbtn_lock";
                    repeatbtn.title = "repeat current song"
                    config.data.repeat = 2;
                    config.save();
                    break;
                case 2://replay current song
                    repeatbtn.className = "repeatbtn_no"
                    repeatbtn.title = "no repeat"
                    config.data.repeat = 0;
                    config.save();
                    break;
                default: config.data.repeat = 0; config.save();

            }
        })

        //  Play\pause button
        playbtn.addEventListener('click', function () { player.play() })
        ipcRenderer.on('tray_play_pause', () => { player.play() })//listening on channel 'tray_play_pause'

        //  Next button
        nextbtn.addEventListener('click', function () { player.next() })
        ipcRenderer.on('tray_next', () => { player.next() })//listening on channel 'tray_next'

        //  Previous button
        previousbtn.addEventListener('click', function () { player.previous() })
        ipcRenderer.on('tray_previous', () => { player.previous() })//listening on channel 'tray_previous'

        //seek controls
        song_progress_bar.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('seek to :', this.value);
            player.stop_seeking();
            player.stream1.seek(this.value);
            backgroundvideo.currentTime = this.value;
        })
        song_progress_bar.addEventListener('mouseenter', function () { player.stop_seeking() })
        song_progress_bar.addEventListener('mouseleave', function (e) {
            if (player.playstate == true && player.seekterval == null) {
                player.start_seeking()
            }
        })


        /* Polish when done */
        /*setTimeout(() => {
            navigator.mediaSession.playbackState = "none";
            
            player.play(config.data.last_played, true).then(() => { })
            setTimeout(() => {
                player.pause()
                player.seekbackward()
                Howler.mute(false)
            }, 1000);
            
        }, 4000);*/
    },
    play: async function (fileindex, load) {
        /* If something is playing resumes playback,
        if nothing is playing plays from the files[fileindex],
        if no fileindex assumes playback of the last song, if no last song, unloads playr
        */
        console.log('Attempt to play: ', fileindex);

        if (now_playing_content.id == null && fileindex == undefined) {//play last known song
            player.play(config.data.last_played ? config.data.last_played : 1);
            setTimeout(() => { player.scroll_to_current() }, 500);
            return 0;
        }

        if (player.playstate != false) {//if is playing something
            if (fileindex == undefined) {//pause playback
                player.pause()
                return 0;
            }
        } else {//playing something
            if (fileindex == now_playing_content.id) {
                player.stream1.play();
                if (backgroundvideo.style.display != "none") {
                    backgroundvideo.play();
                    backgroundvideo.currentTime = player.stream1.seek()
                } else {
                    backgroundvideo.muted = true;
                    backgroundvideo.pause()
                }

                ipcRenderer.invoke('get.localfile', now_playing_content.id).then(returned => {
                    console.log('resume : ', localfiles[now_playing_content.id]);
                })

                return 0;
            }
        }

        if (fileindex == undefined && now_playing_content.id != null) {//resume playback
            player.stream1.play();
            if (backgroundvideo.style.display != "none") {

                backgroundvideo.play();
                backgroundvideo.currentTime = player.stream1.seek()
            } else {
                backgroundvideo.muted = true;
                backgroundvideo.pause()
            }

            ipcRenderer.invoke('get.localfile', now_playing_content.id).then(returned => {
                console.log('resume : ', returned);
            })

            return 0;
        }

        if (fileindex == now_playing_content.id) {//pause playback
            if (player.playstate == true) {
                player.pause()
            } else {
                player.stream1.play()
            }
            return 0;
        }

        /*if (fileindex != now_playing_content.id && player.playstate != false) {
            //await player.stream1.unload();//unlock the stream thats gonna be used
            //Howler.unload()
            /*backgroundvideo.src = "";
            backgroundvideo.style.display = "none"
        }*/

        try {
            //await player.stream1.unload();//unlock the stream thats gonna be used
            Howler.unload()//unload playing track if any

            player.stream1 = new Howl({
                src: await ipcRenderer.invoke('get.localfile', fileindex),//takes an array, or single path
                autoplay: true,
                loop: false,
                volume: 1,
                preload: false,
                html5: true,
                onend: function () {//Playback ends
                    ipcRenderer.invoke('get.localfile', fileindex).then(returned => {
                        console.log('Finished playing', returned);
                    })

                    player.playstate = false;
                    //place repeat chck here
                    player.next()
                },
                onplayerror: function () {//Playback fails
                    console.warn('fail to play ', ipcRenderer.invoke('get.localfile', fileindex))
                    stream1.once('unlock', function () {//wait for unlock
                        player.play(fileindex);// try to play again
                        notify.new('Error', `Could not access file: {main/.get.localfile(fileindex)}`, 'a file access error occured for some reason, could be anything from a bad disk to improper file permissions')
                    });
                },
                onload: function () {

                    ipcRenderer.invoke('get.localfile', fileindex).then((filepath) => {

                        console.log('loaded: ', filepath)
                        document.getElementById('songTitle').innerText = path.basename(filepath);
                        //player.stream1.play()//play the sound that was just loaded
                        //Handle background video (if any)
                        song_progress_bar.value = 0;
                        switch (path.extname(filepath)) {//check file types

                            case ".mp4": case ".m4v": case ".webm": case ".mov"://playable as music files
                                backgroundvideo.src = filepath;
                                backgroundvideo.style.display = "block"
                                backgroundvideo.play();
                                document.getElementById('tbuttonholder').className = "tbuttonholder"//allow to be hidden
                                break;
                            default:
                                backgroundvideo.src = "";
                                backgroundvideo.style.display = "none"
                                backgroundvideo.muted = true;
                                backgroundvideo.pause()


                        }
                    });
                    backgroundvideo.currentTime = 0;
                },
                onplay: async function () {
                    //playback of loaded song file sucessfull
                    player.playstate = true;//now playing and play pause functionality
                    now_playing_content.id = Number(fileindex);//remove if you want a brain ache
                    config.data.last_played = Number(fileindex);
                    player.updatemetadata(fileindex);
                    ipcRenderer.send('Play_msg', fileindex, 'pause')//Send playing song to main
                    playbtn.classList = "pausebtn"
                    playbtn.title = "pause"
                    player.start_seeking()
                    console.log('Playing: ', fileindex);
                    config.save();
                },
                onloaderror: function () {

                }
            });


            if (load != false) { player.stream1.load() }

        } catch (err) {
            console.warn('howl error ', err)
        } finally {
            document.querySelectorAll('.song_bar_active').forEach((song_bar) => { song_bar.className = "song_bar" })
            document.getElementById(fileindex).className = 'song_bar_active'
            player.build_songbar(fileindex).then((songbar) => { document.getElementById('playhistory').appendChild(songbar) })
        }
    },
    pause: async function () {
        console.log('Pause functionaliy');
        if (player.playstate != false) {
            player.stream1.pause();
            backgroundvideo.pause();
            player.stop_seeking();
            player.playstate = false;//stop playstate 
            navigator.mediaSession.playbackState = "paused";
            playbtn.classList = "playbtn";
            playbtn.title = "play";
            ipcRenderer.send('Play_msg', now_playing_content.id, 'Play');
        } else {//assume error
            console.warn('Tried pause functionality with no playback');
        }
    },
    next: async function () {//Play next song in que if any
        console.log('Play Next');

        switch (config.data.repeat) {
            case 0://no repeat
                break;
            case 1:// repeat all
                break;
            case 2://replay current song
                player.stream1.seek(0);
                player.play();
                return 0;
                break;
            default:
        }

        //prototype shuffle
        let nextsong;

        if (config.data.shuffle == true) {//the next song is choosen at random
            let length = await ipcRenderer.invoke('get.localtable_length')
            nextsong = utils.rand_number(length - 1, 0, now_playing_content.id);
        } else {//next song inline unless at the end
            nextsong = Number(now_playing_content.id + 1)
        }

        player.play(nextsong)
        now_playing_content.id = nextsong;
        song_progress_bar.value = 0;//reset seek value
        player.scroll_to_current()

    },
    previous: async function () {
        console.log('Play Previous');

        if (player.playstate == true) {
            if (player.stream1.seek() > 3) {//reset seek on back if less 
                player.stream1.seek(0)
                backgroundvideo.currentTime = 0
                return 0;
            }
        }

        player.play(now_playing_content.id - 1)
        song_progress_bar.value = 0;//reset seek value
        now_playing_content.id = now_playing_content.id - 1;

        player.scroll_to_current()
    },
    start_seeking: async function () {
        console.log('start seeking')
        player.stop_seeking();
        player.seekterval = setInterval(async () => {
            let seeked = ~~(player.stream1.seek())
            song_progress_bar.value = seeked;

            navigator.mediaSession.setPositionState({
                duration: player.stream1._duration,
                playbackRate: player.stream1._rate,
                position: seeked,
            });

        }, 1000)
        /*navigator.mediaSession.setPositionState({
            duration: backgroundvideo.duration,
            playbackRate: backgroundvideo.playbackRate,
            position: backgroundvideo.currentTime,
        })*/
    },
    stop_seeking: function () {
        console.log('stop seeking')
        clearInterval(player.seekterval)
        player.seekterval = null;
    },
    seekforward: function () {
        console.log('seek forward')
        var seeked = player.stream1.seek() + 5
        player.stream1.seek(seeked)
        backgroundvideo.currentTime = seeked;

    },
    seekbackward: function () {
        console.log('seek backwards')
        var seeked = player.stream1.seek() - 5
        player.stream1.seek(seeked)
        backgroundvideo.currentTime = seeked
    },
    updatemetadata: async function (fileindex) {//Bste the UI with metadata about the song that is currently playing

        navigator.mediaSession.playbackState = "playing";

        ipcRenderer.invoke('pullmetadata', fileindex).then((metadata) => {

            document.getElementById('songTitle').innerText = metadata.title;
            document.getElementById('songArtist').innerText = `by ${metadata.artist}`;
            now_playing_content.duration = metadata.duration;
            song_progress_bar.max = metadata.duration;

            if (metadata.image != null) {
                //console.log('Cover art info: ', metadata.image)
                document.getElementById('coverartsmall').src = metadata.image;
                backgroundmaskimg.src = metadata.image;
                backgroundmaskimg.style.display = "block";

                UI.blurse()

                if (overpainelm.className != "overpain_active") {//hide titlebar buttons if overpain isnt visible
                    document.getElementById('tbuttonholder').className = "tbuttonholder"
                }

                if (config.data.background_blur == 0) {//strech song totle as needed
                    document.getElementById('songdetailcontainer').classList = "songdetailcontainer_alt";
                } else {
                    document.getElementById('songdetailcontainer').classList = "songdetailcontainer";

                }
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: metadata.title,
                    artist: metadata.artist,
                    album: metadata.album,
                    /*artwork: [
                        { src: URL.createObjectURL(new Blob([metadata.rawpic.data], { type: metadata.rawpic.format })), sizes: '64x64', type: 'image/jpg' },
                    ],*/
                    artwork: [
                        { src: 'https://dummyimage.com/96x96', sizes: '96x96', type: 'image/png' },
                        { src: 'https://dummyimage.com/128x128', sizes: '128x128', type: 'image/png' },
                        { src: 'https://dummyimage.com/192x192', sizes: '192x192', type: 'image/png' },
                        { src: 'https://dummyimage.com/256x256', sizes: '256x256', type: 'image/png' },
                        { src: 'https://dummyimage.com/384x384', sizes: '384x384', type: 'image/png' },
                        { src: 'https://dummyimage.com/512x512', sizes: '512x512', type: 'image/png' },
                    ]
                });

                // ipcRenderer.send('new_icon',metadata.image)

            } else {
                //use placeholder image
                document.getElementById('coverartsmall').src = "img/vinyl-record-pngrepo-com-white.png"

                document.getElementById('coverartsmall').name = "vibecat"
                backgroundmaskimg.src = "";
                backgroundmaskimg.style.display = "none";

                UI.unblurse()

                document.getElementById('tbuttonholder').className = "tbuttonholder_locked"
                document.getElementById('songdetailcontainer').classList = "songdetailcontainer_alt";
                UI.get_desktop_wallpaper().then((wallpaperpath) => {
                    mainmaskcontainer.style.backgroundImage = `url('${wallpaperpath}')`
                });

                navigator.mediaSession.metadata = new MediaMetadata({
                    title: metadata.title,
                    artist: metadata.artist,
                    album: metadata.album,
                    /*artwork: [
                        { src: './img/icon.png', sizes: '64x64', type: 'image/png' },
                    ],*/
                    artwork: [
                        { src: 'https://dummyimage.com/96x96', sizes: '96x96', type: 'image/png' },
                        { src: 'https://dummyimage.com/128x128', sizes: '128x128', type: 'image/png' },
                        { src: 'https://dummyimage.com/192x192', sizes: '192x192', type: 'image/png' },
                        { src: 'https://dummyimage.com/256x256', sizes: '256x256', type: 'image/png' },
                        { src: 'https://dummyimage.com/384x384', sizes: '384x384', type: 'image/png' },
                        { src: 'https://dummyimage.com/512x512', sizes: '512x512', type: 'image/png' },
                    ]
                });
            }

            if (backgroundvideo.style.display == "block") { document.getElementById('tbuttonholder').className = "tbuttonholder" }

            //player.songbarmenu_build(coverartsmall, fileindex);
            //ipcRenderer.send('playback_notification', metadata);
            player.playback_notification(metadata)
            ipcRenderer.send('wallpaper', fileindex, config.data.background_blur);
        })

        navigator.mediaSession.setActionHandler('play', function () {
            console.log('External play command');
            if (!actiontimeout) {
                actiontimeout = true;
                setTimeout(() => { actiontimeout = false }, 20)
                player.play();
            } else {
                console.warn('2 simultanius commands, Hit action timeout')
            }

        });

        navigator.mediaSession.setActionHandler('pause', function () {
            console.log('External pause command');
            player.pause()
        });

        navigator.mediaSession.setActionHandler('stop', function () { console.log('External stop command') });
        navigator.mediaSession.setActionHandler('seekbackward', function () { });
        navigator.mediaSession.setActionHandler('seekforward', function () { });
        //navigator.mediaSession.setActionHandler('shuffle', function () { });
        navigator.mediaSession.setActionHandler('seekto', function () { });
        navigator.mediaSession.setActionHandler('previoustrack', function () {
            console.log('External previous command');
            if (!actiontimeout) {
                actiontimeout = true;
                setTimeout(() => { actiontimeout = false }, 20)
                player.previous();
            } else {
                console.warn('2 simultanius commands, Hit action timeout')
            }


        });
        navigator.mediaSession.setActionHandler('nexttrack', function () {
            console.log('External next command');
            if (!actiontimeout) {
                actiontimeout = true;
                setTimeout(() => { actiontimeout = false }, 20)
                player.next()
            } else {
                console.warn('2 simultanius commands, Hit action timeout')
            }

        });
    },
    lookup: async function () {//seach for matches to a pattern amoungst local files pattern

        for (let i in looking) { clearInterval(looking.pop()) }//prevent rappid researching

        looking.push(setTimeout(async () => {

            const filelist = await ipcRenderer.invoke('get.localtable');

            const pattern = searchput.value;
            console.log('Look for ', pattern)

            if (pattern != "" || pattern != " ") {
                searchbox.innerHTML = ""
                for (let fileindex in filelist) {
                    if (path.basename(filelist[fileindex]).toLowerCase().search(pattern.toLowerCase()) != -1) {
                        player.build_songbar(fileindex).then((songbar) => {
                            searchbox.appendChild(songbar);
                        })
                    }
                }
            }

        }, 500))

    },
    scroll_to_current: async function () {
        document.querySelectorAll('.song_bar_active').forEach((song_bar) => { song_bar.className = "song_bar" })
        document.getElementById(`${now_playing_content.id}`).className = "song_bar_active"
        if (document.getElementById(`#${now_playing_content.id - 2}`)) {
            window.location.href = `#${now_playing_content.id - 2}`
        } else {
            window.location.href = `#${now_playing_content.id - 1}`
        }

    },
    build_songbar: async function (fileindex) {
        /*
            Song bars constructed in series normally from an array or 1 at a time in the case of history, fileindex points to an index in an array of paths to local files
        */
        try {

            let songbar = buildsong(fileindex);// data filled in later assigned and sent back immediatly
            return songbar;

            async function buildsong(fiso) {
                var song_bar = document.createElement('div');

                song_bar.addEventListener('click', function () { player.play(fiso); })

                song_bar.classList = "song_bar";
                var song_title = document.createElement('div')
                song_title.className = "song_title";
                ipcRenderer.invoke('get.localfile', fiso).then((filepath) => {

                    song_title.innerHTML = path.basename(filepath)
                    //song_bar.title = `Play ${path.basename(filepath)}`;
                })
                song_bar.appendChild(song_title);

                //functionality(song_bar, fiso);
                player.songbarmenu_build(song_bar, fiso)

                let observer = new IntersectionObserver(async function (entries) {
                    if (entries[0].isIntersecting) {
                        observer.disconnect()
                        fillmetadata(song_bar, fiso, song_title);
                    }
                }, { root: null, rootMargin: '4000px', threshold: 0.1 });
                observer.observe(song_bar)


                setTimeout(async () => {
                    if (utils.isElementInViewport(song_bar)) {
                        fillmetadata(song_bar, fiso, song_title);
                        observer.disconnect()
                    }
                }, 1000);

                return song_bar;

            }
        } catch (error) {

        }

        async function fillmetadata(eliment, fileindex, song_title) {//set meta properties

            var song_duration = document.createElement('div')
            song_duration.className = "song_duration"
            //mm.parseFile(main.get.localfile(fileindex), { duration: false }).then(async (metadata) => {


            ipcRenderer.invoke('pullmetadata', fileindex).then((metadata) => {

                //metadata song title
                song_title.innerHTML = metadata.title;

                //file duration
                song_duration.title = `${metadata.duration} seconds`;

                song_duration.innerHTML = `${~~(Number((metadata.duration - metadata.duration % 60) / 60))}:${~~(Number(metadata.duration % 60))}`;

                eliment.appendChild(song_duration)

                if (metadata.image != null) {
                    var songicon = document.createElement("img")
                    songicon.className = "songicon"
                    songicon.loading = "lazy"

                    songicon.src = metadata.image;
                    eliment.appendChild(songicon)
                } else {
                    //use placeholder image
                    ipcRenderer.invoke('get.localfile', fileindex).then((filepath) => {
                        if (path.extname(filepath) == ".mp4") {
                            var songicon = document.createElement("img")
                            songicon.className = "songicon"
                            songicon.loading = "lazy"
                            eliment.appendChild(songicon)
                            thumbnailjs.getVideoThumbnail(filepath, 0.2, 3, "image/jpg").then((src) => { songicon.src = src })
                        } else {
                            var songicon = document.createElement("div")
                            songicon.className = "songicon_dfault"
                            eliment.appendChild(songicon)
                        }
                    })


                }
            })
        }



    },
    songbarmenu_build: async function (eliment, fileindex) {
        eliment.addEventListener('contextmenu', (e) => {//Body menu attached to window
            e.preventDefault();
            e.stopPropagation();//important
            console.log("Context menu on, ", fileindex)
            ipcRenderer.send('songbarmenu', fileindex);
        }, false);

        /*
        */
    },
    playback_notification: async function (metadata) {
        //notification if hidden
        if (await ipcRenderer.invoke('playback_notificationchk')) {
            new Notification(`${metadata.title}`,
                {
                    body: ` by ${metadata.artist}`,
                    icon: metadata.image || null,
                    image: './img/icon.png',
                    silent: true,
                }
            ).onclick = () => {
                console.log('Notification clicked')
                ipcRenderer.send('raisemainwindow');
                //main.Show_window()
            }
        }
    },
    setvolume: async function (volume) {
        Howler.volume(volume);
    },
    mute: async function () {
        if (Howler._muted == true) {
            Howler.mute(false)
        } else {
            Howler.mute(true)
        }
    },
    /*
        rate Number 1.0
        The rate of playback. 0.5 to 4.0, with 1.0 being normal speed.
    */

}

let UI = {
    initalize: function () {

        UI.settings.animation.setpostition()
        UI.settings.minimize_to_tray.setpostition()
        UI.settings.quiton_X.setpostition()
        UI.settings.use_tray.setpostition()
        //grab desktop wallpaper
        UI.get_desktop_wallpaper().then((wallpaperpath) => { mainmaskcontainer.style.backgroundImage = `url('${wallpaperpath}')` })

        document.getElementById('library_btn').addEventListener('click', function () { UI.navigate.main_library_view() }, false)
        document.getElementById('favourits_btn').addEventListener('click', function () { UI.navigate.favourits_view() }, false)

        //animations switch trigger
        document.getElementById('Animations_btn').addEventListener('click', function () { UI.settings.animation.flip() })

        //tray switch trigger
        document.getElementById('tray_btn').addEventListener('click', function () { UI.settings.use_tray.flip() })

        //minimize to tray switch trigger
        document.getElementById('minimize_to_tray_btn').addEventListener('click', function () { UI.settings.minimize_to_tray.flip() })

        //close to tray switch trigger
        document.getElementById('close_to_tray_btn').addEventListener('click', function () { UI.settings.quiton_X.flip() })

        //setting navitation trigger
        document.getElementById('setting_btn').addEventListener('click', function () { UI.navigate.setting_view() })

        //search trigger
        document.getElementById('search_btn').addEventListener('click', function () {
            if (overpainelm.className == "overpain_active") {//hide it
                UI.overpain.hide()
            } else {//show it
                UI.overpain.show()
            }
        })

        Menupannel_main.addEventListener('mouseenter', function () { UI.overpain.hide() })
        main_library_view.addEventListener('mouseenter', function () { UI.overpain.hide() })
        document.getElementById('Playbar').addEventListener('mouseenter', function () { UI.overpain.hide() })
        document.getElementById('setting_view').addEventListener('mouseenter', function () { UI.overpain.hide() })

        //background blur
        backgroundmaskimg.style.filter = `blur(${config.data.background_blur}px)`;
        document.getElementById('background_blur_put').value = config.data.background_blur;
        document.getElementById('bluroutsight').innerHTML = `${config.data.background_blur}px`;
        document.getElementById('background_blur_put').addEventListener('change', async function () {
            config.data.background_blur = this.value;
            config.save();
            UI.blurse()
        }, false)

        document.getElementById('background_blur_put').addEventListener('input', async function () {
            config.data.background_blur = this.value;
            UI.blurse()
        }, false)

        UI.blurse()
        document.getElementById('blurpan').addEventListener('wheel', function (ev) {
            ev.stopPropagation()
            ev.preventDefault()
            if (!actiontimeout) {
                actiontimeout = true;
                setTimeout(() => { actiontimeout = false }, 50)

                if (ev.deltaY < 0) {
                    //scroll up
                    if (config.data.background_blur >= 100) {
                        config.data.background_blur = 100;

                    } else {
                        config.data.background_blur++

                    }
                } else {
                    //scroll down
                    if (config.data.background_blur <= 0) {
                        config.data.background_blur = 0;

                    } else {
                        config.data.background_blur--

                    }
                }
                document.getElementById('bluroutsight').innerHTML = `${config.data.background_blur}px`;
                document.getElementById('background_blur_put').value = config.data.background_blur;
                UI.blurse()
            }

        }, false)
    },
    navigate: {
        main_library_view: async function () {
            console.log('Navigate main library')
            document.getElementById('setting_view').className = "setting_view"
            main_library_view.style.display = "block";
            document.getElementById('favourits_view').style.display = "none"
            Menupannel_main.style.display = "block";
        },
        setting_view: async function () {
            console.log('Setting toggle settings')
            if (document.getElementById('setting_view').className == "setting_view_active") {
                document.getElementById('setting_view').classList = "setting_view"
            } else {
                document.getElementById('setting_view').classList = "setting_view_active"
            }

        }, favourits_view: async function () {
            console.log('Navigate favourits library')
            document.getElementById('setting_view').className = "setting_view"
            main_library_view.style.display = "none";
            document.getElementById('favourits_view').style.display = "block"
            Menupannel_main.style.display = "block";
            playlistmanager.buildfavourites()
        }
    },
    settings: {
        animation: {
            flip: function () {
                console.log('animation switch triggered');
                if (process.platform != "linux" && systemPreferences.getAnimationSettings().shouldRenderRichAnimation == false) {//animations preffered OFF by system
                    notify.new('System over-rule', 'Animations dissabled by Your Systems devices preferences');
                } else {
                    if (config.data.animations == true) {
                        //turn off the switch
                        config.data.animations = false
                        console.warn('animations dissabled');
                    } else {
                        //turn on the witch
                        config.data.animations = true
                        console.warn('animations enabled');
                    }
                }

                config.save();
                this.setpostition();
            },
            setpostition: function () {
                switch (process.platform) {
                    case "linux"://Linux && free BSD
                        if (config.data.animations == true) { mation() }
                        else { nomation() }
                        break;
                    default://Mac OS && windows
                        if (systemPreferences.getAnimationSettings().shouldRenderRichAnimation == true) {//animations preffered by system only works on windows and wackOS
                            if (config.data.animations == true) { mation() } else { nomation() }
                        } else { nomation() }//system preffers no animations
                }
                function mation() {
                    document.getElementById('anime_put').checked = true;
                    document.getElementById('nomation_box').innerText = "";
                }
                function nomation() {
                    document.getElementById('anime_put').checked = false;
                    document.getElementById('nomation_box').innerText = "*{transition: none !important;animation: none !important;}";
                }
            },
        },
        use_tray: {
            flip: function () {
                console.log('use tray switch triggered');
                /*
                                if (main.get.use_tray() == true) {//turn off the switch
                                    main.set.use_tray(false)
                                    main.remove_tray()
                                    console.warn('use tray  dissabled');
                                } else {//turn on the witch
                                    main.set.use_tray(true)
                                    main.reamake_tray()
                                    console.warn('use tray enabled');
                                }*/
                this.setpostition();
            },
            setpostition: function () {
                /*
                if (main.get.use_tray() == true) {
                    document.getElementById('tray_put').checked = true;
                } else {
                    document.getElementById('tray_put').checked = false;
                }
                */
            },
        },
        minimize_to_tray: {
            flip: function () {
                console.log('use tray switch triggered');
                /*
                if (main.get.minimize_to_tray() == true) {//turn off the switch
                    main.set.minimize_to_tray(false)
                    //main.remove_tray()
                    console.warn('use minimize_to_tray dissabled');
                } else {//turn on the witch
                    main.set.minimize_to_tray(true)
                    //main.reamake_tray()
                    console.warn('use minimize_to_tray enabled');
                }
                */
                this.setpostition();
            },
            setpostition: function () {
                /*
                if (main.get.minimize_to_tray() == true) {
                    document.getElementById('minimize_to_tray_put').checked = true;
                } else {
                    document.getElementById('minimize_to_tray_put').checked = false;
                }*/
            },
        },
        quiton_X: {
            flip: function () {
                console.log('use tray switch triggered');
                /*
                if (main.get.quiton_X() == true) {//turn off the switch
                    main.set.quiton_X(false)
                    //main.remove_tray()
                    console.warn('use minimize_to_tray dissabled');
                } else {//turn on the witch
                    main.set.quiton_X(true)
                    //main.reamake_tray()
                    console.warn('use minimize_to_tray enabled');
                }*/
                this.setpostition();
            },
            setpostition: function () {
                /*
                if (main.get.quiton_X() == true) {
                    document.getElementById('close_to_tray_put').checked = true;
                } else {
                    document.getElementById('close_to_tray_put').checked = false;
                }*/
            },
        }
    },
    notify: {//notification function house
        clap: window.addEventListener('resize', async () => { UI.notify.clearall() }),
        new: async function (title, body, hover_title, ifunction) {

            let notification = document.createElement("div")
            notification.classList = "notification"

            let notification_title = document.createElement("div")
            notification_title.classList = "title"
            notification_title.innerHTML = title
            notification.title = hover_title ? hover_title : "click to dismiss"

            let nbody = document.createElement("div")//body
            nbody.classList = "notifbody"
            nbody.innerHTML = body;

            notification.appendChild(notification_title)
            notification.appendChild(nbody)
            document.body.appendChild(notification)

            if (typeof (ifunction) == 'function') { //imbedded function
                notification.addEventListener('click', ifunction);
                let xbutton = document.createElement('div');//Close button
                xbutton.setAttribute('class', 'x-button')
                notification.appendChild(xbutton)
                xbutton.title = 'click to dismiss';
                xbutton.addEventListener('click', async function (e) { removethis(e, notification) })
            } else {
                notification.addEventListener('click', async function (e) { removethis(e, notification) })
            }

            //Timing effects
            setTimeout(async () => {
                notification.style.transform = 'translateX(0)'
                //UI.notify.shove()
            }, 50);

            setTimeout(async () => { notification.style.opacity = '0.0' }, 10000); //dissapear

            setTimeout(async () => { try { document.body.removeChild(notification) } catch (err) { console.warn(err) } }, 11000); //remove from document

            async function removethis(e, rnotification) {
                e.stopImmediatePropagation();
                rnotification.style.transform = 'translateX(22rem)';
                setTimeout(() => { rnotification.style.opacity = '0.0'; }, 100)
                setTimeout(() => { try { document.body.removeChild(notification) } catch (err) { console.warn(err) } }, 1000)
            }

        },
        shove: async function () {
            var notifications = document.querySelectorAll(".notification")
            var reverse = notifications.length - 1;
            for (let i in notifications) {
                notifications[i].style.transform = 'translateY(' + -reverse * 9 + 'rem)';//9 rem., height of notification
                reverse--;//get it, because oposite
            }
        },
        clearall: async function () {
            document.querySelectorAll(".notification").forEach((notification) => {
                try {
                    notification.style.opacity = '0.0';
                    notification.style.transform = 'translate(0,0)'
                } catch (err) { console.warn(err) }
            })
        }
    },
    overpain: {
        hide: async function () {
            console.log("Hide overpain")
            //if (searchput.value != "" || document.getElementById('searchbox').style.display == "block") {
            if (backgroundmaskimg.style.display == "none" && backgroundvideo.style.display == "none") {
                document.getElementById('tbuttonholder').className = "tbuttonholder_locked"
            } else {
                document.getElementById('tbuttonholder').className = "tbuttonholder"
            }
            searchput.style.display = ""
            overpainelm.className = "overpain"
            main_library_view.style.filter = "";
            Menupannel_main.style.filter = "";
            /*document.getElementById('searchbox').style.width = ""*/
            /*} else {
    
                document.getElementById('tbuttonholder').className = "tbutaintonholder_locked"
    
    
                document.getElementById('searchbox').style.display = ""
            }*/
        },
        show: async function () {
            console.log('Show overpain')
            document.getElementById('tbuttonholder').className = "tbuttonholder_locked"
            overpainelm.className = "overpain_active"
            setTimeout(() => { searchput.focus(); searchput.select() }, 100);
            searchput.style.display = "block";
            main_library_view.style.filter = `blur(${(config.data.background_blur * 2)}px)`;
            Menupannel_main.style.filter = `blur(${(config.data.background_blur * 2)}px)`;
        },
    },
    blurse: async function () {
        backgroundmaskimg.style.filter = `blur(${config.data.background_blur}px)`;
        backgroundmaskimg.style.height = `calc(100vh + ${config.data.background_blur}px)`;
        backgroundmaskimg.style.width = `calc(100vw + ${config.data.background_blur}px)`;
        if (config.data.background_blur > 0) { mainmaskcontainer.style.backgroundImage = "" }

        document.getElementById('bluroutsight').innerHTML = `${config.data.background_blur}px`;
    },
    unblurse: async function () {
        backgroundmaskimg.style.filter = `blur(0)`;
    },
    get_desktop_wallpaper: async function () {
        // get desktop wallpaper with 
        let returned = await wallpaper.get()
            .then((wallpaperpath) => {//gets desktop wallpaper
                if (path.parse(wallpaperpath).ext !== undefined) {
                    wallpaperpath = wallpaperpath.replace(/\\/g, '/');// replace all \\ with /
                    return wallpaperpath;
                } else {
                    console.error('Failed to get desktop wallpaper')
                    return 'fail'
                }
            }).catch((err) => {
                console.warn('wallpaper error ', err)
                return err;
            })
        return returned;
    },
}

let playlistmanager = {
    addtofavourite: async function (datum) {
        console.log('Add to favourite ', datum)
        //check for duplicate then add
        ipcRenderer.invoke('get.localfile', datum).then((filepath) => {
            config.data.favourites.push(path.basename(filepath))
        })
        config.save()
    },
    buildfavourites: async function () {
        document.getElementById('favourits_view').innerHTML = "";
        /*
                for (let f2index in main.get.localtable()) {
                    for (let fileindex in config.data.favourites) {
                        let pattern = config.data.favourites[fileindex];
                        if (path.basename(main.get.localfile(f2index)) == pattern) {
                            player.build_songbar(f2index).then((songbar) => { document.getElementById('favourits_view').appendChild(songbar); })
                            console.log('favourite of ', pattern)
                        }
                    }
                }
        */

        const localtable = await ipcRenderer.invoke('get.localtable');

        const favlength = config.data.favourites.length;
        //let f2index = favlength;
        for (let f2index = favlength; f2index > 0; f2index--) {
            //let pattern = config.data.favourites[fileindex];

            let found = localtable.findIndex(data => path.basename(data) == config.data.favourites[f2index - 1]) || null;

            if (found != null && found != undefined && found != -1) {
                player.build_songbar(found).then((songbar) => {
                    document.getElementById('favourits_view').appendChild(songbar);
                })
                console.log('favourite of ', found)
            }
        }

        /*        
                for (let f2index in main.get.localtable()) {
                    //let pattern = config.data.favourites[fileindex];
                    let found = config.data.favourites.findIndex(data => data == path.basename(main.get.localfile(f2index))) || null;
                    if (found != null && found != undefined && found != -1) {
                        player.build_songbar(found).then((songbar) => { document.getElementById('favourits_view').appendChild(songbar); })
                        console.log('favourite of ', found)
                    }
                }*/
    }
}



/* Temporary prototypes */
async function remove_favourite_duplicates() {
    let hold = config.data.favourites;
    config.data.favourites = Array.from(new Set(hold));
    config.save()
}

async function export_favourites(){
    let outputs = '';

    const localtable = await ipcRenderer.invoke('get.localtable');

    const favlength = config.data.favourites.length;
    //let f2index = favlength;
    for (let f2index = favlength; f2index > 0; f2index--) {
        //let pattern = config.data.favourites[fileindex];

        let found = localtable.findIndex(data => path.basename(data) == config.data.favourites[f2index - 1]) || null;

        if (found != null && found != undefined && found != -1) {
            outputs = outputs + /*path.basename(*/localtable[found]/*)*/+'\n';
            console.log('Export of ', found)
        }
    }
    console.log(outputs);

    ipcRenderer.send('export_playlist',outputs);
}

async function first_settup() { require('../Windows/js/first_settup.js').first_settup() }