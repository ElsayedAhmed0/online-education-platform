const ReactPlayer = require('react-player');
console.log('youtube:', ReactPlayer.default.canPlay('https://youtube.com/watch?v=123'));
console.log('google drive:', ReactPlayer.default.canPlay('https://drive.google.com/file/d/123/view'));
console.log('iframe:', ReactPlayer.default.canPlay('<iframe src="123">'));
console.log('mp4:', ReactPlayer.default.canPlay('https://storage.supabase.com/file.mp4'));
