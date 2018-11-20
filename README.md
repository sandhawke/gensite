You ever have one of those days where you get so frustrated with a
build system you give up and make your own?  Then you have two
problems, or something, I hear.

Anyway, I couldn't get local jekyll to behave right, and proxying for
gitpages had its own problems, so I spent a mildly enjoyable 3 hours
and wrote my own.

I currently use it like

```bash

$ (cd ~/credweb; rm -rf _generated; node ~/Repos/gensite/ && cd _generated/; rsync -avvR --progress . credweb.org:/sites/credweb.org)
```

The web server should try .html files when there's no suffix.  With
nginx this means: `try_files $uri $uri.html $uri/ =404;`

