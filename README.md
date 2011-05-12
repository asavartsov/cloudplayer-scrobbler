Amazon Cloud Player scrobbler
-----------------------------

Google Chrome plugin for scrobbling songs from Amazon Cloud Player to Last.fm

Features
========

* Scrobbles now playing songs at 70% played time
* Song information in popup window
* Cloud Player state in icon
* Love/unlove now playing song
* Option to turn scrobbling off if you do not want to send scrobbles

Installation
============

Install stable release from [Google Web Store](https://chrome.google.com/webstore/detail/nolkhoglpmelgkcljkjlfeledieoahoa)

Version History
===============

**Version 1.1.0**

* New engine for obtaining the song info. Now playing information now gathering directly from Cloud Player JS objects
* Fixed a problem with long song titles (when some song sometimes were scrobbled like "This is Very Very Very Long Tit...")
* Now the album information is sent too
* Fixed a rare problem with superfluous scrobbles on song switching

**Version 1.0.3**

* Fixed link to Cloud Player in popup window (Amazon now returns 403 error for short link used before) 

**Version 1.0.2**

* Fixed artist detection when playing from Artists section 
* Fixed a problem when popup displayed a song info when player stopped playing 

Author
======

[Alexey Savartsov](https://github.com/asavartsov), asavartsov@gmail.com

License
=======

(The MIT License)

Copyright (c) 2011 Alexey Savartsov, asavartsov@gmail.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
